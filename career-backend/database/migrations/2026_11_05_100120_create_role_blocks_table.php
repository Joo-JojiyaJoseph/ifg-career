<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('role_blocks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('candidate_id')->constrained()->cascadeOnDelete();
            $table->string('role_key', 150);
            $table->timestamp('blocked_until');
            $table->string('reason');
            $table->foreignId('source_application_id')->nullable()->constrained('applications')->nullOnDelete();
            $table->foreignId('overridden_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('overridden_at')->nullable();
            $table->string('override_reason')->nullable();
            $table->timestamps();

            $table->index(['candidate_id', 'role_key', 'blocked_until']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('role_blocks');
    }
};
