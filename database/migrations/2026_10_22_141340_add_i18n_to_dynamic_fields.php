<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('cpt_definitions', function (Blueprint $table) {
            $table->boolean('translatable')->default(false)->after('required');
        });

        Schema::table('content_section_values', function (Blueprint $table) {
            $table->string('locale', 10)->nullable()->after('row_index');
            $table->index(['content_section_id', 'locale'], 'csv_locale_idx');
        });

        DB::table('cpt_definitions')
            ->whereIn('type', ['text', 'textarea', 'wysiwyg'])
            ->update(['translatable' => true]);

        $raw = DB::table('settings')
            ->where('group', 'localization')
            ->where('key', 'default_locale')
            ->value('value');
        $decoded = is_string($raw) ? json_decode($raw, true) : null;
        $default = is_string($decoded) && $decoded !== '' ? $decoded : 'en';

        DB::table('content_section_values')
            ->whereIn('cpt_definition_id', DB::table('cpt_definitions')->where('translatable', true)->select('id'))
            ->update(['locale' => $default]);
    }

    public function down(): void
    {
        Schema::table('content_section_values', function (Blueprint $table) {
            $table->dropIndex('csv_locale_idx');
            $table->dropColumn('locale');
        });

        Schema::table('cpt_definitions', function (Blueprint $table) {
            $table->dropColumn('translatable');
        });
    }
};