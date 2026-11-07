<?php

namespace Database\Seeders\Support;

/**
 * Default photos for the careers site, from Unsplash (free to use under the Unsplash License).
 * They load straight from Unsplash's image CDN. HR replaces any of them by uploading a photo in Website Content.
 */
class Photos
{
    public const TEAM_CELEBRATING = '1758691737538-220c1902b1ca';

    public const DESK_CELEBRATION = '1758691737138-7b9b1884b1db';

    public const COWORKERS_LAUGHING = '1758873268745-dd2cf0d677b5';

    public const FESTIVAL = '1520312622401-cac590a0d473';

    public const SPARKLERS = '1758599669628-bc8eb56fb361';

    public const TRIP = '1758599668780-60d53c35135d';

    public const HANDSHAKE = '1758518730384-be3d205838e8';

    public const WORKING_ON_LAPTOP = '1758876201566-990fd4e0f3c5';

    public static function url(string $id, int $width = 1600): string
    {
        return "https://images.unsplash.com/photo-{$id}?auto=format&fit=crop&w={$width}&q=75";
    }
}
