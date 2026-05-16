<?php
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$file = __DIR__ . $path;

if (is_file($file)) {
    return false; // serve as-is
}

if (is_file($file . '.html')) {
    require $file . '.html';
    return true;
}

if ($path == '/' && is_file(__DIR__ . '/index.html')) {
    require __DIR__ . '/index.html';
    return true;
}

return false;
