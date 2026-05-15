<?php
require_once __DIR__ . '/../php-backend/src/Config.php';
require_once __DIR__ . '/../php-backend/src/Db.php';

try {
    Config::loadEnvIfPresent();
    $pdo = Db::pdo();
    $driver = $pdo->getAttribute(PDO::ATTR_DRIVER_NAME);
    echo "Driver: $driver\n";
    
    if ($driver === 'sqlite') {
        $stmt = $pdo->query("PRAGMA table_info(report_extras)");
        $cols = $stmt->fetchAll(PDO::FETCH_ASSOC);
        foreach ($cols as $col) {
            echo "Column: {$col['name']} ({$col['type']})\n";
        }
    } else {
        $stmt = $pdo->query("DESCRIBE report_extras");
        $cols = $stmt->fetchAll(PDO::FETCH_ASSOC);
        foreach ($cols as $col) {
            echo "Column: {$col['Field']} ({$col['Type']})\n";
        }
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
