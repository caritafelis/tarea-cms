<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CptDefinition extends Model
{
    use HasFactory;

    protected $fillable = [
        'cpt_id',
        'label',
        'name',
        'type',
        'options',
        'settings',
        'instructions',
        'required',
        'default_value',
        'order',
        'parent_id',
    ];

    protected $casts = [
        'options' => 'array',
        'settings' => 'array',
        'required' => 'boolean',
        'order' => 'integer',
        'translatable' => 'boolean',
    ];

    // Tipos soportados
    public const TYPES = [
        'text',
        'textarea',
        'wysiwyg',
        'number',
        'email',
        'url',
        'color',
        'date',
        'image',
        'file',
        'select',
        'checkbox',
        'radio',
        'repeater',
        'relation',
    ];

    public const TRANSLATABLE_TYPES = [
        'text', 
        'textarea', 
        'wysiwyg'
    ];

    public function cpts(): BelongsTo
    {
        return $this->belongsTo(Cpt::class);
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(CptDefinition::class, 'parent_id');
    }

    // Sub-campos de un repeater
    public function subCpts(): HasMany
    {
        return $this->hasMany(CptDefinition::class, 'parent_id')->orderBy('order');
    }

    public function sectionValues(): HasMany
    {
        return $this->hasMany(ContentSectionValue::class);
    }

    public function isRepeater(): bool
    {
        return $this->type === 'repeater';
    }

    public function isMedia(): bool
    {
        return in_array($this->type, ['image', 'file']);
    }

    public static function canTranslate(string $type): bool
    {
        return in_array($type, self::TRANSLATABLE_TYPES, true);
    }
}
