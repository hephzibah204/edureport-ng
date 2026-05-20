<?php
require_once __DIR__ . '/../php-backend/src/Config.php';
require_once __DIR__ . '/../php-backend/src/Db.php';

try {
    Config::loadEnvIfPresent();
    $pdo = Db::pdo();
    
    // Retrieve the trial plan versions
    $stmt = $pdo->query("SELECT spv.id, spv.config FROM subscription_plans sp JOIN subscription_plan_versions spv ON spv.plan_id=sp.id WHERE sp.slug='trial'");
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($rows as $row) {
        $cfg = json_decode($row['config'] ?? '[]', true);
        if (is_array($cfg)) {
            $cfg['trialDays'] = 7;
            $newConfig = json_encode($cfg, JSON_UNESCAPED_SLASHES);
            
            $update = $pdo->prepare("UPDATE subscription_plan_versions SET config=? WHERE id=?");
            $update->execute([$newConfig, $row['id']]);
            echo "Updated subscription_plan_version {$row['id']} to 7 trialDays.\n";
        }
    }
    
    // Also double check if there are other trial records
    $s = $pdo->query("SELECT sp.slug, spv.config FROM subscription_plans sp JOIN subscription_plan_versions spv ON spv.plan_id=sp.id WHERE sp.slug='trial'")->fetchAll(PDO::FETCH_ASSOC);
    print_r($s);
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
