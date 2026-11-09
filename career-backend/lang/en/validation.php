<?php

// Only the messages that differ from Laravel's defaults; everything else comes from the framework.
return [
    // PHP rejects a file before Laravel sees it when it is larger than upload_max_filesize (2 MB by default).
    'uploaded' => 'The :attribute is larger than this server accepts. Choose a smaller file, or raise upload_max_filesize and post_max_size in php.ini.',
];
