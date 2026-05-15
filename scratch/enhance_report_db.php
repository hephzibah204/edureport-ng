<?php
require_once __DIR__ . '/../php-backend/src/Config.php';
require_once __DIR__ . '/../php-backend/src/Db.php';

try {
    Config::loadEnvIfPresent();
    $pdo = Db::pdo();
    $pdo->exec("ALTER TABLE report_extras ADD COLUMN comments TEXT");
    $pdo->exec("ALTER TABLE report_extras ADD COLUMN promotion TEXT");
    echo "Columns comments and promotion added to report_extras successfully.\n";
} catch (Exception $e) {
    echo "Error or already exists: " . $e->getMessage() . "\n";
}
