<?php

final class Totp
{
    private static function base32Decode(string $s): string
    {
        $alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
        $s = strtoupper(preg_replace('/[^A-Z2-7]/', '', $s) ?? '');
        $bits = '';
        for ($i = 0; $i < strlen($s); $i++) {
            $c = $s[$i];
            $v = strpos($alphabet, $c);
            if ($v === false) {
                continue;
            }
            $bits .= str_pad(decbin($v), 5, '0', STR_PAD_LEFT);
        }
        $out = '';
        for ($i = 0; $i + 8 <= strlen($bits); $i += 8) {
            $out .= chr(bindec(substr($bits, $i, 8)));
        }
        return $out;
    }

    public static function generateSecretBase32(int $bytes = 20): string
    {
        $raw = random_bytes($bytes);
        $alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
        $bits = '';
        for ($i = 0; $i < strlen($raw); $i++) {
            $bits .= str_pad(decbin(ord($raw[$i])), 8, '0', STR_PAD_LEFT);
        }
        $out = '';
        for ($i = 0; $i < strlen($bits); $i += 5) {
            $chunk = substr($bits, $i, 5);
            if (strlen($chunk) < 5) {
                $chunk = str_pad($chunk, 5, '0', STR_PAD_RIGHT);
            }
            $out .= $alphabet[bindec($chunk)];
        }
        return $out;
    }

    public static function code(string $secretBase32, ?int $time = null, int $period = 30, int $digits = 6): string
    {
        if ($time === null) {
            $time = time();
        }
        $key = self::base32Decode($secretBase32);
        $counter = intdiv($time, $period);
        $msg = pack('N*', 0) . pack('N*', $counter);
        $hash = hash_hmac('sha1', $msg, $key, true);
        $offset = ord(substr($hash, -1)) & 0x0F;
        $part = substr($hash, $offset, 4);
        $value = unpack('N', $part)[1] & 0x7FFFFFFF;
        $mod = 10 ** $digits;
        return str_pad(strval($value % $mod), $digits, '0', STR_PAD_LEFT);
    }

    public static function verify(string $secretBase32, string $code, int $window = 1): bool
    {
        $code = preg_replace('/\D/', '', $code) ?? '';
        if ($code === '') {
            return false;
        }
        $now = time();
        for ($i = -$window; $i <= $window; $i++) {
            $t = $now + ($i * 30);
            if (hash_equals(self::code($secretBase32, $t), $code)) {
                return true;
            }
        }
        return false;
    }

    public static function otpauthUri(string $issuer, string $account, string $secretBase32): string
    {
        $label = rawurlencode($issuer . ':' . $account);
        $issuerEnc = rawurlencode($issuer);
        $acctEnc = rawurlencode($account);
        return "otpauth://totp/{$label}?secret={$secretBase32}&issuer={$issuerEnc}&account={$acctEnc}";
    }
}
