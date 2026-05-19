<?php
$pdo = new PDO('sqlite:C:/Users/Abiodun Emmanuel/Documents/CODEBASE/edureport-ng/php-backend/storage/edureport.sqlite');
$stmt = $pdo->query('SELECT name FROM sqlite_master WHERE type="table" AND name="jobs"');
$result = $stmt->fetchColumn();
if ($result) {
    echo 'jobs table exists';
} else {
    echo 'jobs table missing';
}
?>