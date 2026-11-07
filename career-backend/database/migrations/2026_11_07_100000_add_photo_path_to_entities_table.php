<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('entities', function (Blueprint $table) {
            // A photo for the entity's card on the careers page; a full URL or a path on the public disk.
            $table->string('photo_path', 500)->nullable()->after('pattern_path');
        });
    }

    public function down(): void
    {
        Schema::table('entities', function (Blueprint $table) {
            $table->dropColumn('photo_path');
        });
    }
};
