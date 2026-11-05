<?php

namespace App\Support;

use Illuminate\Support\Facades\Cache;

class CacheVersion
{
    public static function get(string $name): int
    {
        return (int) Cache::get(self::key($name), 1);
    }

    public static function bump(string $name): int
    {
        $next = self::get($name) + 1;
        Cache::forever(self::key($name), $next);

        return $next;
    }

    public static function key(string $name): string
    {
        return $name.':version';
    }
}
