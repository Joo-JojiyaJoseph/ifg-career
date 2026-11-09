<?php

namespace Database\Seeders\Support;

/**
 * Default photos for the careers site, linked from where they are hosted.
 * Real Infolks Group photos come from the Worklife section of infolksgroup.com/about and from infolks.info.
 * Where the group's sites have no photo (Medrays, Webfolks and Dataways cards), free Unsplash photos stand in.
 * HR replaces any of them by uploading a photo in Website Content.
 */
class Photos
{
    /** Generated artwork shown under the hero photos while they load (served by both apps). */
    public const HERO = '/images/hero/careers-hero.svg';

    // Real photos from the group's websites.
    public const WORKFORCE = 'https://infolksgroup.com/images/about/work_life/strength.jpg';

    public const INFIESTA = 'https://infolksgroup.com/images/about/work_life/infiesta.jpg';

    public const FOOTBALL_LEAGUE = 'https://infolksgroup.com/images/about/work_life/ifl.jpg';

    public const FOOTBALL_TEAM = 'https://infolksgroup.com/images/about/work_life/football_team.jpg';

    public const TEAM_OUTINGS = 'https://infolksgroup.com/images/about/work_life/annual_team_outings.jpg';

    public const CELEBRATION_CORNER = 'https://infolksgroup.com/images/about/work_life/celebration_corner.jpg';

    public const GENDER_EQUALITY = 'https://infolksgroup.com/images/about/work_life/gender_equality.jpg';

    public const WORK_LIFE_BALANCE = 'https://infolksgroup.com/images/about/work_life/work_life_balance.jpg';

    public const INFOLKS_TEAM = 'https://infolks.info/images/about/expert-crew.jpg';

    // Unsplash photo ids (Unsplash License), for cards with no photo on the group's sites yet.
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
