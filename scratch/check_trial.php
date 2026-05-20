<?php
require_once __DIR__ . '/../php-backend/src/Config.php';
require_once __DIR__ . '/../php-backend/src/Db.php';

try {
    Config::loadEnvIfPresent();
    $pdo = Db::pdo();
    $s = $pdo->query("SELECT sp.slug, spv.config FROM subscription_plans sp JOIN subscription_plan_versions spv ON spv.plan_id=sp.id WHERE sp.slug='trial'")->fetchAll(PDO::FETCH_ASSOC);
    print_r($s);
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
