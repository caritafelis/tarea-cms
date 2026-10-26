<?php

use App\Models\ApiKey;
use App\Support\ApiAbilities;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;

return new class extends Migration
{
    public function up(): void
    {
        $keys = (new ApiKey)->getTable();
        $tokens = (new Sanctum::$personalAccessTokenModel)->getTable();

        DB::table($keys)->orderBy('id')->each(function ($row) use ($keys, $tokens) {
            $old = json_decode((string) $row->abilities, true) ?: [];
            $new = ApiAbilities::normalize($this->expand($old));

            if ($new === $old) {
                return;
            }

            DB::table($keys)->where('id', $row->id)->update(['abilities' => json_encode($new)]);

            if ($row->personal_access_token_id) {
                DB::table($tokens)->where('id', $row->personal_access_token_id)->update(['abilities' => json_encode($new)]);
            }
        });
    }

    public function down(): void {}

    private function expand(array $abilities): array
    {
        $aliases = config('api_permissions.legacy_aliases', []);
        $resources = config('api_permissions.resources', []);
        $out = [];

        foreach ($abilities as $a) {
            if ($a === 'read') {
                $out[] = '*:read';

                continue;
            }

            if ($a === 'write') {
                array_push($out, '*:create', '*:update', '*:delete');

                continue;
            }

            if (! str_contains($a, ':')) {
                $out[] = $a;

                continue;
            }

            [$res, $act] = explode(':', $a, 2);
            $targets = array_merge(isset($resources[$res]) ? [$res] : [], $aliases[$res] ?? []);

            foreach ($targets ?: [$res] as $t) {
                $def = $resources[$t] ?? null;

                if (! $def) {
                    $out[] = "{$t}:{$act}";

                    continue;
                }

                $actions = $act === 'write' ? array_values(array_diff($def[2], ['read'])) : [$act];

                foreach ($actions as $x) {
                    $out[] = "{$t}:{$x}";
                }
            }
        }

        return $out;
    }
};