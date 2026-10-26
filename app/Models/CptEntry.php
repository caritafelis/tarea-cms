<?php

namespace App\Models;

use App\Concerns\HasDynamicFields;
use App\Concerns\HasSlug;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class CptEntry extends Model
{
    use HasDynamicFields, HasFactory, HasSlug, SoftDeletes;

    protected $fillable = ['cpt_id', 'title', 'slug', 'status'];

    public function cpts(): BelongsTo
    {
        return $this->belongsTo(Cpt::class);
    }
}
