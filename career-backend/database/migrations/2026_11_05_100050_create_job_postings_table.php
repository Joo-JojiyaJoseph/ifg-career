<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('job_postings', function (Blueprint $table) {
            $table->id();
            $table->char('public_id', 26)->unique();
            $table->string('title', 150);
            $table->string('slug', 180)->index();
            $table->string('role_key', 150)->index();
            $table->foreignId('entity_id')->constrained()->restrictOnDelete();
            $table->foreignId('department_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('team_id')->nullable()->constrained()->nullOnDelete();
            $table->string('level', 30)->index();
            $table->string('location', 120)->index();
            $table->text('summary');
            $table->text('qualification');
            $table->string('experience', 150);
            $table->text('why_join_us')->nullable();
            $table->date('last_date_to_apply')->index();
            $table->string('status', 30)->default('draft')->index();
            $table->timestamp('posted_at')->nullable()->index();
            $table->timestamp('published_at')->nullable();
            $table->timestamp('closed_at')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->softDeletes();
            $table->timestamps();

            $table->index(['status', 'last_date_to_apply']);
            $table->index(['entity_id', 'status']);
        });

        if (Schema::getConnection()->getDriverName() === 'mysql') {
            Schema::table('job_postings', function (Blueprint $table) {
                $table->fullText(['title', 'summary']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('job_postings');
    }
};
