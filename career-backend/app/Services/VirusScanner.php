<?php

namespace App\Services;

use RuntimeException;

/**
 * Optional ClamAV scanning through clamd's INSTREAM command.
 *
 * Turned on by setting CLAMAV_HOST (tcp, e.g. 127.0.0.1:3310) or CLAMAV_SOCKET (unix socket path).
 * When it is off, every file is treated as clean.
 */
class VirusScanner
{
    public const CLEAN = 'clean';

    public const INFECTED = 'infected';

    public const UNAVAILABLE = 'unavailable';

    private const CHUNK = 8192;

    public function enabled(): bool
    {
        return filled(config('services.clamav.socket')) || filled(config('services.clamav.host'));
    }

    /**
     * @return self::CLEAN|self::INFECTED|self::UNAVAILABLE
     */
    public function scan(string $path): string
    {
        if (! $this->enabled()) {
            return self::CLEAN;
        }

        try {
            return self::parse($this->stream($path));
        } catch (RuntimeException) {
            return self::UNAVAILABLE;
        }
    }

    /**
     * Turn clamd's reply ("stream: OK" or "stream: <name> FOUND") into a result.
     */
    public static function parse(string $reply): string
    {
        $reply = trim(str_replace("\0", '', $reply));

        return match (true) {
            str_ends_with($reply, 'OK') => self::CLEAN,
            str_ends_with($reply, 'FOUND') => self::INFECTED,
            default => self::UNAVAILABLE,
        };
    }

    private function stream(string $path): string
    {
        $target = filled(config('services.clamav.socket'))
            ? 'unix://'.config('services.clamav.socket')
            : 'tcp://'.config('services.clamav.host');
        $timeout = (int) config('services.clamav.timeout', 10);

        $socket = @stream_socket_client($target, $errno, $error, $timeout);
        $file = @fopen($path, 'rb');

        if (! $socket || ! $file) {
            throw new RuntimeException('ClamAV is not reachable.');
        }

        stream_set_timeout($socket, $timeout);
        fwrite($socket, "zINSTREAM\0");

        while (! feof($file)) {
            $chunk = (string) fread($file, self::CHUNK);

            if ($chunk !== '') {
                fwrite($socket, pack('N', strlen($chunk)).$chunk);
            }
        }

        fwrite($socket, pack('N', 0));
        $reply = (string) stream_get_contents($socket);
        fclose($file);
        fclose($socket);

        if ($reply === '') {
            throw new RuntimeException('ClamAV did not answer.');
        }

        return $reply;
    }
}
