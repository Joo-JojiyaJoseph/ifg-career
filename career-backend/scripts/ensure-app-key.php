<?php

$envPath = dirname(__DIR__).DIRECTORY_SEPARATOR.'.env';
$contents = is_file($envPath) ? (string) file_get_contents($envPath) : '';

if (preg_match('/^APP_KEY=base64:.+/m', $contents) === 1) {
    echo "Application key already set.\n";
    exit(0);
}

passthru(PHP_BINARY.' artisan key:generate --ansi', $code);
exit($code);
