<?php

namespace App\Models;

use App\Concerns\GeneratesUniqueTeamSlugs;
use App\Enums\BusinessType;
use App\Enums\HostingPlan;
use App\Enums\ProjectType;
use Database\Factories\TeamFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Permission\PermissionRegistrar;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

#[Fillable(['name', 'slug', 'is_personal', 'business_type', 'hosting_plan', 'project_type', 'organization_type', 'billing_address', 'tax_id', 'icon_path'])]
class Team extends Model implements HasMedia
{
    /** @use HasFactory<TeamFactory> */
        use GeneratesUniqueTeamSlugs, HasFactory, InteractsWithMedia, SoftDeletes;

    /**
     * Bootstrap the model and its traits.
     */
    protected static function boot(): void
    {
        parent::boot();

        static::creating(function (Team $team) {
            if (empty($team->slug)) {
                $team->slug = static::generateUniqueTeamSlug($team->name);
            }
        });

        static::updating(function (Team $team) {
            if ($team->isDirty('name')) {
                $team->slug = static::generateUniqueTeamSlug($team->name, $team->id);
            }
        });
    }

    public function registerMediaCollections(): void
    {
        $this->addMediaCollection('logo')
            ->singleFile()
            ->acceptsMimeTypes(['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']);
    }

    public function registerMediaConversions(?Media $media = null): void
    {
        $this->addMediaConversion('thumb')->width(128)->height(128)->nonQueued();
    }

    public function getLogoUrlAttribute(): ?string
    {
        return $this->getFirstMediaUrl('logo', 'thumb') ?: null;
    }

    /**
     * Get the team owner.
     */
    public function owner(): ?Model
    {
        app(PermissionRegistrar::class)->setPermissionsTeamId($this->id);

        return $this->members()
            ->whereHas('roles', fn ($query) => $query->where('name', 'Owner'))
            ->first();
    }

    /**
     * Get all members of this team.
     *
     * @return BelongsToMany<Model, $this>
     */
    public function members(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'team_members', 'team_id', 'user_id')
            ->using(Membership::class)
            ->withPivot(['role'])
            ->withTimestamps();
    }

    /**
     * Get all memberships for this team.
     *
     * @return HasMany<Membership, $this>
     */
    public function memberships(): HasMany
    {
        return $this->hasMany(Membership::class);
    }

    /**
     * Get all invitations for this team.
     *
     * @return HasMany<TeamInvitation, $this>
     */
    public function invitations(): HasMany
    {
        return $this->hasMany(TeamInvitation::class);
    }

    public function cpts(): HasMany
    {
        return $this->hasMany(Cpt::class);
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'is_personal' => 'boolean',
            'business_type' => BusinessType::class,
            'hosting_plan' => HostingPlan::class,
            'project_type' => ProjectType::class,
        ];
    }

    /**
     * Get the route key for the model.
     */
    public function getRouteKeyName(): string
    {
        return 'slug';
    }

    // Team.php
    public function subscriptions(): HasMany { return $this->hasMany(Subscription::class); }

    public function activeSubscription(): ?Subscription
    {
        return $this->subscriptions()->with('plan')->latest()->get()
            ->first(fn ($s) => $s->active() || $s->onGracePeriod());
    }

    public function entitlements(): array
    {
        return $this->activeSubscription()?->plan?->entitlements
            ?? once(fn () => Plan::query()->where('slug', 'free')->first()?->entitlements)
            ?? ['modules' => ['cms'], 'limits' => [], 'meta' => []];
    }

    public function hasModule(string $module): bool
    {
        if (auth()->user()?->is_super_admin) {
            return true;
        }

        return in_array($module, $this->entitlements()['modules'] ?? [], true);
    }

    public function apiKeys(): HasMany
    {
        return $this->hasMany(ApiKey::class);
    }

    /** Última API key del team (la que define el "Production" del switcher). */
    public function latestApiKey(): HasOne
    {
        return $this->hasOne(ApiKey::class)->latestOfMany();
    }

    /** null si el team no tiene ninguna API key => el switcher no muestra subtítulo. */
    public function getEnvironmentAttribute(): ?string
    {
        return $this->latestApiKey?->environment;
    }
}
