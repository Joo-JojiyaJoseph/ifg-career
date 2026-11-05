<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('applications', function (Blueprint $table) {
            $table->id();
            $table->char('public_id', 26)->unique();
            $table->string('type', 30)->index();
            $table->foreignId('candidate_id')->constrained()->restrictOnDelete();
            $table->foreignId('job_posting_id')->nullable()->constrained()->restrictOnDelete();
            $table->foreignId('entity_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('department_id')->nullable()->constrained()->nullOnDelete();
            $table->timestamp('applied_at')->index();
            $table->string('source', 30)->index();
            $table->string('reference_id', 50)->nullable();
            $table->boolean('referred')->default(false)->index();
            $table->string('status', 30)->default('applied')->index();
            $table->string('result', 30)->nullable()->index();
            $table->timestamp('status_changed_at')->nullable();
            $table->timestamp('shortlisted_at')->nullable();
            $table->timestamp('rejected_at')->nullable();
            $table->timestamp('result_at')->nullable();
            $table->foreignId('status_changed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->json('snapshot');
            $table->string('resume_path');
            $table->boolean('is_flagged')->default(false);
            $table->timestamps();

            $table->unique(['candidate_id', 'job_posting_id']);
            $table->index(['status', 'applied_at']);
            $table->index(['entity_id', 'status']);
            $table->index(['type', 'department_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('applications');
    }
};
