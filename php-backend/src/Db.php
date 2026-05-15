<?php

final class Db
{
    private static ?PDO $pdo = null;

    public static function isSqlite(): bool
    {
        try {
            return self::pdo()->getAttribute(PDO::ATTR_DRIVER_NAME) === 'sqlite';
        } catch (Throwable $e) {
            return false;
        }
    }

    public static function pdo(): PDO
    {
        if (self::$pdo) {
            return self::$pdo;
        }
        $dsn = Config::env('DB_DSN');
        $user = Config::env('DB_USER');
        $pass = Config::env('DB_PASS');

        if (is_string($dsn) && str_starts_with($dsn, 'sqlite:')) {
            $path = substr($dsn, 7);
            $path = is_string($path) ? $path : '';
            if ($path !== '' && $path !== ':memory:') {
                $pathOnly = $path;
                $q = strpos($pathOnly, '?');
                if ($q !== false) {
                    $pathOnly = substr($pathOnly, 0, $q);
                }
                $isAbs = preg_match('#^(/|[A-Za-z]:[\\/])#', $pathOnly) === 1;
                if (!$isAbs) {
                    $base = dirname(__DIR__);
                    $joined = $base . DIRECTORY_SEPARATOR . str_replace(['/', '\\'], DIRECTORY_SEPARATOR, $pathOnly);
                    $joined = str_replace('\\\\', DIRECTORY_SEPARATOR, $joined);
                    $joinedSqlite = str_replace('\\', '/', $joined);
                    $suffix = $q !== false ? substr($path, $q) : '';
                    $dsn = 'sqlite:' . $joinedSqlite . $suffix;
                }
            }
        }

        if ($dsn === null) {
            $host = Config::env('DB_HOST', '127.0.0.1');
            $port = Config::envInt('DB_PORT', 3306);
            $name = Config::env('DB_NAME', 'ReportSheet');
            $dsn = "mysql:host={$host};port={$port};dbname={$name};charset=utf8mb4;connect_timeout=2";
        }
        $opt = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
            PDO::ATTR_TIMEOUT => 2
        ];
        if (is_string($dsn) && str_starts_with($dsn, 'mysql:') && defined('PDO::MYSQL_ATTR_INIT_COMMAND')) {
            $opt[PDO::MYSQL_ATTR_INIT_COMMAND] = "SET time_zone='+00:00'";
        }
        self::$pdo = new PDO($dsn, $user ?? '', $pass ?? '', $opt);

        try {
            $driver = self::$pdo->getAttribute(PDO::ATTR_DRIVER_NAME);
            if ($driver === 'sqlite') {
                self::$pdo->exec('PRAGMA foreign_keys = ON');
                self::$pdo->exec('PRAGMA busy_timeout = 2000');
                self::$pdo->exec('PRAGMA journal_mode = WAL');
                if (method_exists(self::$pdo, 'sqliteCreateFunction')) {
                    self::$pdo->sqliteCreateFunction('NOW', function (): string {
                        return gmdate('Y-m-d H:i:s');
                    }, 0);
                }
            }
        } catch (Throwable $e) {
        }

        return self::$pdo;
    }
}
