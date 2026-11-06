<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('interview_rounds', function (Blueprint $table) {
            $table->char('public_id', 26)->nullable()->after('id');
            $table->unsignedTinyInteger('calendar_sync_attempts')->default(0)->after('calendar_sync_error');
            $table->timestamp('calendar_synced_at')->nullable()->after('calendar_sync_attempts');
        });

        DB::table('interview_rounds')->whereNull('public_id')->orderBy('id')->each(function ($round) {
            DB::table('interview_rounds')->where('id', $round->id)->update(['public_id' => (string) Str::ulid()]);
        });

        Schema::table('interview_rounds', function (Blueprint $table) {
            $table->unique('public_id');
            $table->index(['status', 'scheduled_at']);
        });
    }

    public function down(): void
    {
        Schema::table('interview_rounds', function (Blueprint $table) {
            $table->dropIndex(['status', 'scheduled_at']);
            $table->dropUnique(['public_id']);
            $table->dropColumn(['public_id', 'calendar_sync_attempts', 'calendar_synced_at']);
        });
    }
};
