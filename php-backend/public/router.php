<?php

$path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);
$path = is_string($path) ? $path : '/';

$pathNoSlash = $path;
if ($pathNoSlash !== '/' && str_ends_with($pathNoSlash, '/')) {
    $pathNoSlash = rtrim($pathNoSlash, '/');
}

$full = __DIR__ . $path;
$fullNoSlash = __DIR__ . $pathNoSlash;

if ($path !== '/' && is_dir($full)) {
    $indexPhp = rtrim($full, DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR . 'index.php';
    if (is_file($indexPhp)) {
        require $indexPhp;
        return true;
    }
}

if ($pathNoSlash !== '/' && is_dir($fullNoSlash)) {
    $indexPhp = rtrim($fullNoSlash, DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR . 'index.php';
    if (is_file($indexPhp)) {
        require $indexPhp;
        return true;
    }
}

if ($path !== '/' && is_file($full)) {
    return false;
}

require __DIR__ . '/index.php';
