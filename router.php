<?php
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// Route API calls to PHP backend (which handles its own maintenance mode)
if ($path === '/api' || str_starts_with($path, '/api/')) {
    require __DIR__ . '/php-backend/public/index.php';
    return true;
}

// Maintenance page for non-API routes
$maintenanceFile = __DIR__ . '/php-backend/storage/.maintenance';
if (is_file($maintenanceFile)) {
    $allowedIps = @file_get_contents($maintenanceFile);
    $allowedIps = is_string($allowedIps) ? array_map('trim', explode("\n", $allowedIps)) : [];
    $clientIp = $_SERVER['HTTP_CF_CONNECTING_IP'] ?? $_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'] ?? '';
    if (!in_array($clientIp, $allowedIps, true) && $path !== '/maintenance') {
        http_response_code(503);
        header('Retry-After: 3600');
        if (is_file(__DIR__ . '/maintenance.html')) {
            require __DIR__ . '/maintenance.html';
        } else {
            echo '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Maintenance</title><style>body{font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#0d4526;color:#fff;text-align:center;padding:20px;}h1{font-size:2.5rem;}p{color:rgba(255,255,255,0.7);}</style></head><body><div><h1>🔧 Under Maintenance</h1><p>We\'ll be back shortly. Thank you for your patience.</p></div></body></html>';
        }
        return true;
    }
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
