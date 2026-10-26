<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;

class ApiKey extends Model
{
    public const ENVIRONMENTS = ['live', 'test'];

    protected $fillable = [
        'name',
        'environment',
        'key_prefix',
        'token',
        'abilities',
        'last_used_at',
        'expires_at',
        'user_id',
        'team_id',
        'personal_access_token_id',
    ];

    protected $casts = [
        'abilities' => 'array',
        'last_used_at' => 'datetime',
        'expires_at' => 'datetime',
    ];

    protected $hidden = ['token', 'personal_access_token_id'];

    public function personalAccessToken(): BelongsTo
    {
        return $this->belongsTo(Sanctum::$personalAccessTokenModel, 'personal_access_token_id');
    }

    public static function generate(string $name, array $abilities, ?\DateTimeInterface $expiresAt, int $userId, string $environment = 'live', ?int $teamId = null): array
    {
        $plain = "cms_{$environment}_" . Str::random(40);

        $model = self::create([
            'name' => $name,
            'environment' => $environment,
            'key_prefix' => substr($plain, 0, 16),
            'token' => hash('sha256', $plain),
            'abilities' => $abilities,
            'expires_at' => $expiresAt,
            'user_id' => $userId,
            'team_id' => $teamId,
        ]);

        return [$model, $plain];
    }

    public static function findByPlainText(string $plain): ?self
    {
        return self::where('token', hash('sha256', $plain))->first();
    }
}
