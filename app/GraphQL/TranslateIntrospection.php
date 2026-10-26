<?php

namespace App\GraphQL;

use Nuwave\Lighthouse\Events\ManipulateResult;

class TranslateIntrospection
{
    public function handle(ManipulateResult $event): void
    {
        $data = $event->result->data;

        if (! is_array($data) || (! isset($data['__schema']) && ! isset($data['__type']))) {
            return;
        }

        $translator = new DescriptionTranslator(DescriptionTranslator::resolveLocale());

        if (isset($data['__schema'])) {
            $event->result->data['__schema'] = $translator->translateSchema($data['__schema']);
        }

        if (isset($data['__type']) && is_array($data['__type'])) {
            $event->result->data['__type'] = $translator->translateType($data['__type']);
        }
    }
}