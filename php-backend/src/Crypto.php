<?php

final class Crypto
{
    private static function key(): string
    {
        $raw = Config::env('ENCRYPTION_KEY') ?? Config::env('APP_KEY');
        if (!is_string($raw) || trim($raw) === '') {
            throw new RuntimeException('Missing ENCRYPTION_KEY');
        }
        $raw = trim($raw);
        $key = base64_decode($raw, true);
        if (!is_string($key)) {
            $key = $raw;
        }
        if (strlen($key) !== SODIUM_CRYPTO_SECRETBOX_KEYBYTES) {
            throw new RuntimeException('Invalid ENCRYPTION_KEY length');
        }
        return $key;
    }

    public static function encrypt(string $plaintext): string
    {
        $key = self::key();
        $nonce = random_bytes(SODIUM_CRYPTO_SECRETBOX_NONCEBYTES);
        $cipher = sodium_crypto_secretbox($plaintext, $nonce, $key);
        return base64_encode($nonce . $cipher);
    }

    public static function decrypt(string $ciphertextB64): string
    {
        $key = self::key();
        $raw = base64_decode($ciphertextB64, true);
        if (!is_string($raw) || strlen($raw) < SODIUM_CRYPTO_SECRETBOX_NONCEBYTES + 1) {
            throw new RuntimeException('Invalid ciphertext');
        }
        $nonce = substr($raw, 0, SODIUM_CRYPTO_SECRETBOX_NONCEBYTES);
        $cipher = substr($raw, SODIUM_CRYPTO_SECRETBOX_NONCEBYTES);
        $plain = sodium_crypto_secretbox_open($cipher, $nonce, $key);
        if (!is_string($plain)) {
            throw new RuntimeException('Decrypt failed');
        }
        return $plain;
    }
}

