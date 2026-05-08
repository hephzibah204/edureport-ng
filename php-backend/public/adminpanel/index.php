<?php

require_once dirname(__DIR__, 2) . '/src/Config.php';
Config::loadEnvIfPresent();

$ui = Config::env('ADMIN_UI_URL', 'http://127.0.0.1:3000/admin.html');
header('Location: ' . $ui, true, 302);
exit;

