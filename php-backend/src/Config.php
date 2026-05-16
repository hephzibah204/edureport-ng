<?php

final class Config
{
    public static function loadEnvIfPresent(): void
    {
        $path = dirname(__DIR__) . DIRECTORY_SEPARATOR . '.env';
        if (!is_file($path)) {
            return;
        }
        $lines = file($path, FILE_IGNORE_NEW_LINES);
        if ($lines === false) {
            return;
        }
        foreach ($lines as $line) {
            $line = trim($line);
            if ($line === '' || str_starts_with($line, '#')) {
                continue;
            }
            $eq = strpos($line, '=');
            if ($eq === false) {
                continue;
            }
            $k = trim(substr($line, 0, $eq));
            $v = trim(substr($line, $eq + 1));
            if ($k === '') {
                continue;
            }
            if ((str_starts_with($v, '"') && str_ends_with($v, '"')) || (str_starts_with($v, "'") && str_ends_with($v, "'"))) {
                $v = substr($v, 1, -1);
            }
            if (getenv($k) === false) {
                putenv($k . '=' . $v);
                $_ENV[$k] = $v;
            }
        }
    }

    public static function env(string $key, ?string $default = null): ?string
    {
        $v = getenv($key);
        if ($v === false) {
            $v = $_ENV[$key] ?? null;
        }
        if ($v === false || $v === null) {
            $v = $_SERVER[$key] ?? null;
        }
        if ($v === false || $v === null) {
            return $default;
        }
        return $v;
    }

    public static function envBool(string $key, bool $default = false): bool
    {
        $v = self::env($key);
        if ($v === null) {
            return $default;
        }
        $v = strtolower(trim($v));
        return $v === '1' || $v === 'true' || $v === 'yes' || $v === 'on';
    }

    public static function envInt(string $key, int $default): int
    {
        $v = self::env($key);
        if ($v === null) {
            return $default;
        }
        $n = intval($v);
        return $n > 0 ? $n : $default;
    }
}
