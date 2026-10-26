<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Plugin extends Model
{
    protected $fillable = ['name', 'slug', 'version', 'author', 'description', 'is_active'];

    protected $casts = ['is_active' => 'boolean'];
}
