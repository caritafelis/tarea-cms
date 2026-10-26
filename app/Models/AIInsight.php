<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AIInsight extends Model
{
    use HasFactory;

    protected $table = 'ai_insights';

    protected $fillable = ['post_id', 'page_id', 'llm_score', 'llm_detection_result', 'recommendations'];

    protected $casts = [
        'recommendations' => 'array',
    ];

    public function post()
    {
        return $this->belongsTo(Post::class);
    }

    public function page()
    {
        return $this->belongsTo(Page::class);
    }
}
