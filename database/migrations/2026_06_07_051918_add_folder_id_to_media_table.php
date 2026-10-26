<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('media', function (Blueprint $table) {
            $table->foreignId('folder_id')->nullable()->after('model_id')->constrained('media_folders')->nullOnDelete();
            $table->index('folder_id', 'media_folder_id_idx');
        });
    }

    public function down(): void
    {
        Schema::table('media', function (Blueprint $table) {
            $table->dropForeign(['folder_id']);
            $table->dropIndex('media_folder_id_idx');
            $table->dropColumn('folder_id');
        });
    }
};