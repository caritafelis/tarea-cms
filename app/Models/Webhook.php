<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Webhook extends Model
{
    public const ENVIRONMENTS = ['live', 'test'];

    protected $fillable = ['name', 'environment', 'url', 'events', 'secret', 'is_active'];

    protected $casts = [
        'events' => 'array',
        'is_active' => 'boolean',
    ];

    // The signing secret must never reach the browser via Inertia props.
    protected $hidden = ['secret'];

    public function logs(): HasMany
    {
        return $this->hasMany(WebhookLog::class);
    }

    public const EVENTS = [
        'post.created', 'post.updated', 'post.deleted',
        'page.created', 'page.updated', 'page.deleted',
        'product.created', 'product.updated', 'product.deleted',
        'entry.created', 'entry.updated', 'entry.deleted',
        'media.uploaded', 'order.created', 'user.created',
        'order.created',
        'user.created',
    ];

    
}
