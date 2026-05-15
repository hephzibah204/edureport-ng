<?php

final class Response
{
    public static function json(int $status, array $data): void
    {
        http_response_code($status);
        header('X-Content-Type-Options: nosniff');
        header('Cache-Control: no-store, max-age=0');
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($data, JSON_UNESCAPED_SLASHES);
    }

    public static function html(int $status, string $html): void
    {
        http_response_code($status);
        header('X-Content-Type-Options: nosniff');
        header('X-Frame-Options: SAMEORIGIN');
        header('Content-Type: text/html; charset=utf-8');
        echo $html;
    }

    public static function download(int $status, string $contentType, string $filename, string $bytes): void
    {
        http_response_code($status);
        header('X-Content-Type-Options: nosniff');
        header('Content-Type: ' . $contentType);
        header('Content-Disposition: attachment; filename="' . str_replace('"', '', $filename) . '"');
        header('Cache-Control: no-store, max-age=0');
        echo $bytes;
    }

    public static function noContent(): void
    {
        http_response_code(204);
    }

    public static function error(int $status, string $code, string $message, ?array $details = null): void
    {
        $payload = ['error' => ['code' => $code, 'message' => $message]];
        if ($details !== null) {
            $payload['error']['details'] = $details;
        }
        self::json($status, $payload);
    }
}
