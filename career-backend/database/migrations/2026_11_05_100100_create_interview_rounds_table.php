<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('interview_rounds', function (Blueprint $table) {
            $table->id();
            $table->foreignId('application_id')->constrained()->cascadeOnDelete();
            $table->unsignedTinyInteger('round_number');
            $table->string('round_name', 100);
            $table->timestamp('scheduled_at')->index();
            $table->unsignedSmallInteger('duration_minutes')->default(60);
            $table->string('mode', 30);
            $table->string('location_or_link')->nullable();
            $table->string('interviewer_name', 100);
            $table->string('interviewer_email')->nullable()->index();
            $table->string('google_event_id')->nullable();
            $table->string('calendar_sync_status', 30)->default('pending')->index();
            $table->text('calendar_sync_error')->nullable();
            $table->string('status', 30)->default('scheduled')->index();
            $table->text('feedback')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('reminder_sent_at')->nullable();
            $table->timestamps();

            $table->unique(['application_id', 'round_number']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('interview_rounds');
    }
};
