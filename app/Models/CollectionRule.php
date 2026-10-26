<?php

namespace App\Models;

use App\Enums\Operator;
use App\Enums\Rule;
use Database\Factories\CollectionRuleFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CollectionRule extends Model
{
    /** @use HasFactory<CollectionRuleFactory> */
    use HasFactory;

    protected $guarded = [];

    public function getFormattedRule(): string
    {
        return Rule::options()[$this->rule->value];
    }

    public function getFormattedOperator(): string
    {
        return Operator::options()[$this->operator->value];
    }

    public function getFormattedValue(): string
    {
        if ($this->rule->isPrice()) {
            return shopper_money_format((int) $this->value);
        }

        if ($this->rule->isBoolean()) {
            return $this->value === '1'
                ? __('forms.label.yes')
                : __('forms.label.no');
        }

        return $this->value;
    }

    /**
     * @return BelongsTo<Collection, $this>
     */
    public function collection(): BelongsTo
    {
        return $this->belongsTo(Collection::class, 'collection_id');
    }

    protected static function newFactory(): CollectionRuleFactory
    {
        return CollectionRuleFactory::new();
    }

    protected function casts(): array
    {
        return [
            'rule' => Rule::class,
            'operator' => Operator::class,
        ];
    }
}
