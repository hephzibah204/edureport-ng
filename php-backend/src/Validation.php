<?php

final class Validation
{
    public static function requireString(array $data, string $key, int $min = 1, int $max = 500): string
    {
        $v = $data[$key] ?? null;
        if (!is_string($v)) {
            throw new InvalidArgumentException($key . ' is required');
        }
        $v = trim($v);
        if (mb_strlen($v) < $min) {
            throw new InvalidArgumentException($key . ' is too short');
        }
        if (mb_strlen($v) > $max) {
            throw new InvalidArgumentException($key . ' is too long');
        }
        return $v;
    }

    public static function optionalString(array $data, string $key, int $max = 500): ?string
    {
        if (!array_key_exists($key, $data)) {
            return null;
        }
        $v = $data[$key];
        if ($v === null) {
            return null;
        }
        if (!is_string($v)) {
            throw new InvalidArgumentException($key . ' must be a string');
        }
        $v = trim($v);
        if (mb_strlen($v) > $max) {
            throw new InvalidArgumentException($key . ' is too long');
        }
        return $v;
    }

    public static function requireEmail(array $data, string $key = 'email'): string
    {
        $v = self::requireString($data, $key, 3, 320);
        $v = strtolower($v);
        if (!filter_var($v, FILTER_VALIDATE_EMAIL)) {
            throw new InvalidArgumentException($key . ' is invalid');
        }
        return $v;
    }
}
