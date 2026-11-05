<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('talent_members', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100);
            $table->string('email')->unique();
            $table->string('phone', 20)->nullable();
            $table->foreignId('candidate_id')->nullable()->unique()->constrained()->nullOnDelete();
            $table->string('source', 30)->index();
            $table->boolean('is_subscribed')->default(true)->index();
            $table->char('unsubscribe_token', 64)->unique();
            $table->timestamp('subscribed_at');
            $table->timestamp('unsubscribed_at')->nullable();
            $table->timestamp('privacy_consent_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('talent_members');
    }
};
