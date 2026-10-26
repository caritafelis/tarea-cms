<?php

namespace App\Models;

use App\Concerns\HasDynamicFields;
use App\Concerns\HasSlug;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;
use Spatie\Translatable\HasTranslations;

class Post extends Model implements HasMedia
{
    use HasDynamicFields;
    use HasFactory;
    use HasSlug;
    use HasTranslations;
    use InteractsWithMedia;

    protected $fillable = ['title', 'content', 'slug', 'status', 'user_id', 'published_at'];

    public $translatable = ['title', 'content'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
