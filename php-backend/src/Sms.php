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
        if ($provider === 'twilio') {
            self::sendTwilio($to, $message);
            return;
        }
        // Fallback: If primary fails or is unconfigured, try others if keys exist
        if (Config::env('TERMII_API_KEY')) {
            self::sendTermii($to, $message);
            return;
        }
        if (Config::env('TWILIO_AUTH_TOKEN')) {
            self::sendTwilio($to, $message);
            return;
        }
        throw new RuntimeException('SMS provider not configured or available');
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
        return $digits;
    }

    private static function sendTermii(string $to, string $message): void
    {
        $apiKey = Config::env('TERMII_API_KEY');
        $sender = Config::env('TERMII_SENDER_ID', 'ReportSheet');
        if (!$apiKey) throw new RuntimeException('TERMII_API_KEY is missing');
        
        $payload = [
            'to' => $to,
            'from' => $sender,
            'sms' => $message,
            'type' => 'plain',
            'channel' => 'generic',
            'api_key' => $apiKey
        ];
        self::curlPost('https://api.ng.termii.com/api/sms/send', $payload);
    }

    private static function sendTwilio(string $to, string $message): void
    {
        $sid = Config::env('TWILIO_ACCOUNT_SID');
        $token = Config::env('TWILIO_AUTH_TOKEN');
        $from = Config::env('TWILIO_FROM_NUMBER');
        if (!$sid || !$token || !$from) throw new RuntimeException('Twilio config missing');

        $url = "https://api.twilio.com/2010-04-01/Accounts/{$sid}/Messages.json";
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_USERPWD, "{$sid}:{$token}");
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query([
            'To' => '+' . $to,
            'From' => $from,
            'Body' => $message
        ]));
        $raw = curl_exec($ch);
        $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($code < 200 || $code >= 300) {
            throw new RuntimeException('Twilio send failed: ' . $raw);
        }
    }

    private static function curlPost(string $url, array $payload): void
    {
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload, JSON_UNESCAPED_SLASHES));
        curl_setopt($ch, CURLOPT_TIMEOUT, 15);
        $raw = curl_exec($ch);
        $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        if ($code < 200 || $code >= 300) {
            throw new RuntimeException('SMS provider error: ' . $raw);
        }
    }
}
