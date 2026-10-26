<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ContentSectionValue extends Model
{
    use HasFactory;

    protected $fillable = [
        'content_section_id', 
        'cpt_definition_id', 
        'row_index', 
        'locale', 
        'value'
    ];

    protected $casts = ['row_index' => 'integer'];

    public function contentSection(): BelongsTo
    {
        return $this->belongsTo(ContentSection::class);
    }

    public function cptDefinition(): BelongsTo
    {
        return $this->belongsTo(CptDefinition::class);
    }
}
