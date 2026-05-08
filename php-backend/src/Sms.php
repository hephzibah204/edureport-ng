<?php

final class Sms
{
    public static function send(string $to, string $message): void
    {
        $to = self::normalizePhone($to);
        $provider = strtolower(trim(strval(Config::env('SMS_PROVIDER', ''))));
        if ($provider === 'termii') {
            self::sendTermii($to, $message);
            return;
        }
        throw new RuntimeException('SMS provider not configured');
    }

    private static function normalizePhone(string $raw): string
    {
        $s = trim($raw);
        $s = preg_replace('/\s+/', '', $s);
        $s = str_replace(['(', ')', '-', '.'], '', $s);
        if (str_starts_with($s, '+')) {
            $s = substr($s, 1);
        }
        $digits = preg_replace('/\D+/', '', $s);
        $digits = is_string($digits) ? $digits : '';
        if (strlen($digits) === 11 && str_starts_with($digits, '0')) {
            return '234' . substr($digits, 1);
        }
        if (strlen($digits) === 13 && str_starts_with($digits, '234')) {
            return $digits;
        }
        if (strlen($digits) >= 10) {
            return $digits;
        }
        throw new RuntimeException('Invalid phone number');
    }

    private static function sendTermii(string $to, string $message): void
    {
        $apiKey = Config::env('TERMII_API_KEY');
        $sender = Config::env('TERMII_SENDER_ID', 'EduReport');
        if (!is_string($apiKey) || trim($apiKey) === '') {
            throw new RuntimeException('TERMII_API_KEY is missing');
        }
        $payload = [
            'to' => $to,
            'from' => $sender,
            'sms' => $message,
            'type' => 'plain',
            'channel' => 'generic',
            'api_key' => $apiKey
        ];
        $ch = curl_init('https://api.ng.termii.com/api/sms/send');
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload, JSON_UNESCAPED_SLASHES));
        curl_setopt($ch, CURLOPT_TIMEOUT, 12);
        $raw = curl_exec($ch);
        $err = curl_error($ch);
        $code = intval(curl_getinfo($ch, CURLINFO_HTTP_CODE));
        curl_close($ch);
        if ($raw === false) {
            throw new RuntimeException('SMS send failed: ' . $err);
        }
        if ($code < 200 || $code >= 300) {
            throw new RuntimeException('SMS send failed: ' . $raw);
        }
    }
}
