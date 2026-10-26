<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class Cpt extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'team_id',
        'title',
        'slug',
        'description',
        'content_type',
        'is_active',
        'is_standalone',
        'standalone_label',
        'standalone_icon',
        'order',
    ];

    protected $casts = [
        'order' => 'integer',
        'is_active' => 'boolean',
        'is_standalone' => 'boolean',
    ];

    public const CONTENT_TYPES = [
        'post' => 'Posts',
        'page' => 'Pages',
        'product' => 'Products',
        'any' => 'All content types',
    ];

    protected static function boot(): void
    {
        parent::boot();

        static::creating(function (Cpt $group) {
            if (empty($group->slug)) {
                $group->slug = Str::slug($group->title);
            }
        });
    }

    public function cptDefinitions(): HasMany
    {
        return $this->hasMany(CptDefinition::class)->whereNull('parent_id')->orderBy('order');
    }

    public function allCptDefinitions(): HasMany
    {
        return $this->hasMany(CptDefinition::class)->orderBy('order');
    }

    public function contentSections(): HasMany
    {
        return $this->hasMany(ContentSection::class);
    }

    public function entries(): HasMany
    {
        return $this->hasMany(CptEntry::class);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeForContentType($query, string $type)
    {
        return $query->where(function ($q) use ($type) {
            $q->where('content_type', $type)->orWhere('content_type', 'any');
        });
    }
}
