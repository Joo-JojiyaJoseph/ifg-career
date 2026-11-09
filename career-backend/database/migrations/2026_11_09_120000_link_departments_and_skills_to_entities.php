<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Departments belong to one company (entity), or to none for group-wide departments such as HR.
 * Skills can be linked to any number of companies; a skill with no companies is open to all of them.
 * Existing departments and skills start as group-wide, so nothing changes until HR assigns them.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('departments', function (Blueprint $table) {
            $table->foreignId('entity_id')->nullable()->after('id')->constrained()->nullOnDelete();
            $table->dropUnique(['name']);
            $table->unique(['entity_id', 'name']);
        });

        Schema::create('entity_skill', function (Blueprint $table) {
            $table->foreignId('entity_id')->constrained()->cascadeOnDelete();
            $table->foreignId('skill_id')->constrained()->cascadeOnDelete();
            $table->primary(['entity_id', 'skill_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('entity_skill');

        Schema::table('departments', function (Blueprint $table) {
            $table->dropUnique(['entity_id', 'name']);
            $table->dropConstrainedForeignId('entity_id');
            $table->unique('name');
        });
    }
};
