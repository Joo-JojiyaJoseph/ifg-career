<?php

$link = dirname(__DIR__).DIRECTORY_SEPARATOR.'public'.DIRECTORY_SEPARATOR.'storage';

if (file_exists($link)) {
    echo "The [public/storage] link already exists.\n";
    exit(0);
}

passthru(PHP_BINARY.' artisan storage:link --ansi', $code);
exit($code);
