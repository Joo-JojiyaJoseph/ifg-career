<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('site_settings', function (Blueprint $table) {
            $table->id();
            $table->string('key', 80)->unique();
            $table->json('value');
            $table->timestamps();
        });

        Schema::create('about_blocks', function (Blueprint $table) {
            $table->id();
            $table->string('title', 80);
            $table->text('body');
            $table->string('heroicon_name', 60);
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->boolean('is_published')->default(true);
            $table->softDeletes();
            $table->timestamps();
        });

        Schema::create('interview_steps', function (Blueprint $table) {
            $table->id();
            $table->string('name', 80);
            $table->string('description', 255);
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->boolean('is_published')->default(true);
            $table->softDeletes();
            $table->timestamps();
        });

        Schema::create('employee_stories', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100);
            $table->string('role', 100);
            $table->foreignId('entity_id')->nullable()->constrained()->nullOnDelete();
            $table->string('photo_path')->nullable();
            $table->text('quote');
            $table->boolean('publish_permission_confirmed')->default(false);
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->boolean('is_published')->default(true);
            $table->softDeletes();
            $table->timestamps();
        });

        Schema::create('recruitment_drives', function (Blueprint $table) {
            $table->id();
            $table->string('name', 150);
            $table->date('drive_date');
            $table->string('caption', 255)->nullable();
            $table->string('photo_path');
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->boolean('is_published')->default(true);
            $table->softDeletes();
            $table->timestamps();
        });

        Schema::create('faqs', function (Blueprint $table) {
            $table->id();
            $table->string('question', 255);
            $table->text('answer');
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->boolean('is_published')->default(true);
            $table->softDeletes();
            $table->timestamps();
        });

        Schema::create('recognitions', function (Blueprint $table) {
            $table->id();
            $table->string('name', 150);
            $table->unsignedSmallInteger('year')->nullable();
            $table->string('badge_path');
            $table->string('link')->nullable();
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->boolean('is_published')->default(true);
            $table->softDeletes();
            $table->timestamps();
        });

        Schema::create('media_items', function (Blueprint $table) {
            $table->id();
            $table->string('type', 30);
            $table->string('title', 150);
            $table->string('youtube_url')->nullable();
            $table->string('photo_path')->nullable();
            $table->string('caption', 255)->nullable();
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->boolean('is_published')->default(true);
            $table->softDeletes();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('media_items');
        Schema::dropIfExists('recognitions');
        Schema::dropIfExists('faqs');
        Schema::dropIfExists('recruitment_drives');
        Schema::dropIfExists('employee_stories');
        Schema::dropIfExists('interview_steps');
        Schema::dropIfExists('about_blocks');
        Schema::dropIfExists('site_settings');
    }
};
