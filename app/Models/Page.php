<?php

namespace App\Models;

use App\Concerns\HasDynamicFields;
use App\Concerns\HasSlug;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Spatie\Translatable\HasTranslations;

class Page extends Model
{
    use HasDynamicFields, HasFactory, HasSlug, HasTranslations;

    protected $fillable = ['title', 'content', 'slug', 'status', 'user_id'];

    public $translatable = ['title', 'content'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
