<?php

use App\Support\CacheVersion;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Switches the careers hero to the new artwork, but only where it still shows the old default photo.
 * A banner that HR uploaded is left alone.
 */
return new class extends Migration
{
    private const OLD = 'https://infolksgroup.com/images/about/work_life/strength.jpg';

    private const NEW = '/images/hero/careers-hero.svg';

    public function up(): void
    {
        $this->swap(self::OLD, self::NEW);
    }

    public function down(): void
    {
        $this->swap(self::NEW, self::OLD);
    }

    private function swap(string $from, string $to): void
    {
        $row = DB::table('site_settings')->where('key', 'hero')->first();
        if (! $row) {
            return;
        }

        $value = json_decode((string) $row->value, true);
        if (! is_array($value) || ($value['banner_image'] ?? null) !== $from) {
            return;
        }

        $value['banner_image'] = $to;
        DB::table('site_settings')->where('key', 'hero')->update(['value' => json_encode($value), 'updated_at' => now()]);
        CacheVersion::bump('content');
    }
};
