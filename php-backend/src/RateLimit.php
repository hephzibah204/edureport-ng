<?php

final class RateLimit
{
    public static function enforce(string $key, int $max, int $windowSeconds): void
    {
        $dir = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'storage' . DIRECTORY_SEPARATOR . 'ratelimit';
        if (!is_dir($dir)) {
            @mkdir($dir, 0750, true);
        }
        
        $now = time();
        $cleanupFile = $dir . DIRECTORY_SEPARATOR . '.cleanup';
        $lastCleanup = @filemtime($cleanupFile);
        if ($lastCleanup === false || $lastCleanup < $now - 3600) {
            self::cleanup($dir, $now);
            @touch($cleanupFile);
        }
        $file = $dir . DIRECTORY_SEPARATOR . hash('sha256', $key) . '.json';
        $bucket = ['reset' => $now + $windowSeconds, 'count' => 0];
        $fp = @fopen($file, 'c+');
        if ($fp !== false) {
            try {
                flock($fp, LOCK_EX);
                $raw = stream_get_contents($fp);
                if (is_string($raw) && $raw !== '') {
                    $decoded = json_decode($raw, true);
                    if (is_array($decoded) && isset($decoded['reset'], $decoded['count'])) {
                        $bucket = $decoded;
                    }
                }
                if (!is_int($bucket['reset']) || $bucket['reset'] <= $now) {
                    $bucket = ['reset' => $now + $windowSeconds, 'count' => 0];
                }
                $bucket['count'] = intval($bucket['count']) + 1;
                ftruncate($fp, 0);
                rewind($fp);
                fwrite($fp, json_encode($bucket));
                fflush($fp);
            } finally {
                flock($fp, LOCK_UN);
                fclose($fp);
            }
        } else {
            $bucket['count'] = 1;
        }
        if ($bucket['count'] > $max) {
            Response::error(429, 'RATE_LIMITED', 'Too many requests');
            exit;
        }
    }

    private static function cleanup(string $dir, int $now): void
    {
        $files = @glob($dir . DIRECTORY_SEPARATOR . '*.json');
        if (!is_array($files)) return;
        
        foreach ($files as $f) {
            $raw = @file_get_contents($f);
            if (is_string($raw) && $raw !== '') {
                $decoded = json_decode($raw, true);
                if (is_array($decoded) && isset($decoded['reset'])) {
                    if ($decoded['reset'] <= $now) {
                        @unlink($f);
                    }
                } else {
                    @unlink($f); // Invalid file
                }
            } else {
                @unlink($f); // Empty or unreadable
            }
        }
    }
}

