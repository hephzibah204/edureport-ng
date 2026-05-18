<?php
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// Route API calls to PHP backend
if ($path === '/api' || str_starts_with($path, '/api/')) {
    require __DIR__ . '/php-backend/public/index.php';
    return true;
}

$file = __DIR__ . $path;

if (is_file($file)) {
    return false;
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
