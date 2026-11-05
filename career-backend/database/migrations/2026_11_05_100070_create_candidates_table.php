<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('candidates', function (Blueprint $table) {
            $table->id();
            $table->char('public_id', 26)->unique();
            $table->string('google_id')->nullable()->unique();
            $table->string('avatar_url')->nullable();
            $table->string('email')->unique();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('name', 100);
            $table->date('date_of_birth')->nullable();
            $table->string('phone', 20)->nullable()->index();
            $table->string('location', 120)->nullable()->index();
            $table->string('gender', 30)->nullable()->index();
            $table->string('highest_qualification', 150)->nullable();
            $table->foreignId('preferred_department_id')->nullable()->constrained('departments')->nullOnDelete();
            $table->decimal('years_experience', 4, 1)->nullable()->index();
            $table->decimal('current_ctc', 12, 2)->nullable();
            $table->decimal('expected_ctc', 12, 2)->nullable();
            $table->string('reference_id', 50)->nullable();
            $table->string('linkedin_url', 255)->nullable();
            $table->string('portfolio_url', 255)->nullable();
            $table->string('resume_path')->nullable();
            $table->string('resume_original_name')->nullable();
            $table->timestamp('resume_uploaded_at')->nullable();
            $table->string('signup_source', 30)->index();
            $table->timestamp('profile_completed_at')->nullable();
            $table->string('colour_tag', 30)->default('not_contacted')->index();
            $table->boolean('is_blacklisted')->default(false)->index();
            $table->timestamp('blacklisted_at')->nullable();
            $table->timestamp('blacklist_until')->nullable();
            $table->text('blacklist_reason')->nullable();
            $table->foreignId('blacklisted_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('privacy_consent_at')->nullable();
            $table->timestamp('last_login_at')->nullable();
            $table->rememberToken();
            $table->timestamps();

            $table->index(['is_blacklisted', 'blacklist_until']);
        });

        if (Schema::getConnection()->getDriverName() === 'mysql') {
            Schema::table('candidates', function (Blueprint $table) {
                $table->fullText(['name', 'email']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('candidates');
    }
};
