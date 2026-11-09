<?php

use App\Support\CacheVersion;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Puts a real team photo (Infiesta, the whole group together) back as the careers hero banner, where the banner
 * is still one of the defaults: the old strength.jpg photo or the generated artwork. A banner HR uploaded is kept.
 */
return new class extends Migration
{
    private const DEFAULTS = [
        'https://infolksgroup.com/images/about/work_life/strength.jpg',
        '/images/hero/careers-hero.svg',
    ];

    private const PHOTO = 'https://infolksgroup.com/images/about/work_life/infiesta.jpg';

    public function up(): void
    {
        $row = DB::table('site_settings')->where('key', 'hero')->first();
        if (! $row) {
            return;
        }

        $value = json_decode((string) $row->value, true);
        if (! is_array($value) || ! in_array($value['banner_image'] ?? null, self::DEFAULTS, true)) {
            return;
        }

        $value['banner_image'] = self::PHOTO;
        DB::table('site_settings')->where('key', 'hero')->update(['value' => json_encode($value), 'updated_at' => now()]);
        CacheVersion::bump('content');
    }

    public function down(): void
    {
        // Nothing to undo: the previous banner was a default, and the photo is a fine default too.
    }
};
