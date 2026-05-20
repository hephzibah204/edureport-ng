<?php
require_once 'php-backend/src/Config.php';
require_once 'php-backend/src/Db.php';
Config::loadEnvIfPresent();
$pdo = Db::pdo();
$q = $pdo->query("PRAGMA table_info(schools)");
while ($row = $q->fetch(PDO::FETCH_ASSOC)) {
    print_r($row);
}
