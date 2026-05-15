<?php

final class Ai
{
    /**
     * Get API key for a specific provider, prioritizing stored settings over .env
     */
    private static function getProviderKey(string $provider): ?string
    {
        try {
            $stmt = Db::pdo()->prepare('SELECT v FROM system_settings WHERE k=? LIMIT 1');
            $stmt->execute(['aiKeys']);
            $row = $stmt->fetch();
            if ($row && is_string($row['v'])) {
                $cfg = json_decode($row['v'], true);
                if (isset($cfg[$provider]['enabled']) && $cfg[$provider]['enabled'] === true) {
                    $cipher = $cfg[$provider]['apiKeyCiphertext'] ?? null;
                    if ($cipher) return Crypto::decrypt($cipher);
                }
            }
        } catch (Throwable $e) {}

        return match ($provider) {
            'gemini' => Config::env('GOOGLE_API_KEY'),
            'openrouter' => Config::env('OPEN_ROUTER_API_KEY'),
            'openai' => Config::env('OPENAI_API_KEY', Config::env('AI_API_KEY')),
            default => null
        };
    }

    public static function enabled(): bool
    {
        return Config::envBool('AI_ENABLED', true);
    }

    /**
     * Main router that tries providers in priority order
     */
    private static function callRouter(string $system, string $user, bool $jsonMode = true): ?string
    {
        if (!self::enabled()) return null;

        $priorityList = Config::env('AI_PRIORITY_LIST', 'gemini,openrouter,openai');
        $providers = array_filter(array_map('trim', explode(',', strtolower($priorityList))));

        foreach ($providers as $provider) {
            $apiKey = self::getProviderKey($provider);
            if (!$apiKey) continue;

            $result = match ($provider) {
                'gemini' => self::callGemini($apiKey, $system, $user, $jsonMode),
                'openrouter' => self::callOpenRouter($apiKey, $system, $user, $jsonMode),
                'openai' => self::callOpenAi($apiKey, $system, $user, $jsonMode),
                default => null
            };

            if ($result !== null) return $result;
        }

        return null;
    }

    /**
     * NATIVE GEMINI HANDLER
     */
    private static function callGemini(string $key, string $system, string $user, bool $jsonMode): ?string
    {
        $model = Config::env('AI_GEMINI_MODEL', 'gemini-1.5-flash');
        $url = "https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key={$key}";
        
        $payload = [
            'contents' => [
                ['role' => 'user', 'parts' => [['text' => "SYSTEM INSTRUCTIONS: {$system}\n\nUSER INPUT: {$user}"]]]
            ],
            'generationConfig' => [
                'temperature' => 0.4,
                'topP' => 0.8,
                'topK' => 40
            ]
        ];

        if ($jsonMode) {
            $payload['generationConfig']['responseMimeType'] = 'application/json';
        }

        return self::curlRequest($url, $payload, [], 15000, function($resp) {
            return $resp['candidates'][0]['content']['parts'][0]['text'] ?? null;
        });
    }

    /**
     * OPENROUTER HANDLER
     */
    private static function callOpenRouter(string $key, string $system, string $user, bool $jsonMode): ?string
    {
        $model = Config::env('AI_OPENROUTER_MODEL', 'google/gemini-flash-1.5');
        $url = "https://openrouter.ai/api/v1/chat/completions";
        
        $payload = [
            'model' => $model,
            'messages' => [
                ['role' => 'system', 'content' => $system],
                ['role' => 'user', 'content' => $user]
            ],
            'temperature' => 0.3
        ];
        if ($jsonMode) $payload['response_format'] = ['type' => 'json_object'];

        $headers = [
            'Authorization: Bearer ' . $key,
            'HTTP-Referer: https://edureport.ng',
            'X-Title: EduReport NG'
        ];

        return self::curlRequest($url, $payload, $headers, 20000, function($resp) {
            return $resp['choices'][0]['message']['content'] ?? null;
        });
    }

    /**
     * OPENAI HANDLER
     */
    private static function callOpenAi(string $key, string $system, string $user, bool $jsonMode): ?string
    {
        $model = Config::env('AI_OPENAI_MODEL', 'gpt-4o-mini');
        $url = Config::env('AI_OPENAI_BASE_URL', 'https://api.openai.com/v1') . '/chat/completions';
        
        $payload = [
            'model' => $model,
            'messages' => [
                ['role' => 'system', 'content' => $system],
                ['role' => 'user', 'content' => $user]
            ],
            'temperature' => 0.3
        ];
        if ($jsonMode) $payload['response_format'] = ['type' => 'json_object'];

        return self::curlRequest($url, $payload, ['Authorization: Bearer ' . $key], 15000, function($resp) {
            return $resp['choices'][0]['message']['content'] ?? null;
        });
    }

    private static function curlRequest(string $url, array $payload, array $headers, int $timeout, callable $extractor): ?string
    {
        $ch = curl_init($url);
        $headers[] = 'Content-Type: application/json';
        
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_HTTPHEADER => $headers,
            CURLOPT_POSTFIELDS => json_encode($payload, JSON_UNESCAPED_SLASHES),
            CURLOPT_TIMEOUT_MS => $timeout,
            CURLOPT_CONNECTTIMEOUT_MS => 5000,
            CURLOPT_SSL_VERIFYPEER => true,
            CURLOPT_SSL_VERIFYHOST => 2
        ]);

        // Support for custom CA bundle if needed in .env
        $ca = Config::env('SSL_CA_BUNDLE');
        if ($ca && is_file($ca)) {
            curl_setopt($ch, CURLOPT_CAINFO, $ca);
        }

        $raw = curl_exec($ch);
        $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($code >= 200 && $code < 300 && is_string($raw)) {
            $data = json_decode($raw, true);
            if (is_array($data)) return $extractor($data);
        }
        return null;
    }

    public static function generateReport(array $ctx): array
    {
        $system = "You generate concise, professional Nigerian school report remarks. Output strict JSON with keys: teacherRemark, principalRemark, studyTips (array), gapAnalysis, parentLetter. No markdown.";
        $user = json_encode($ctx, JSON_UNESCAPED_SLASHES);
        
        $content = self::callRouter($system, $user, true);
        if (!$content) return self::reportFallback($ctx['firstName'], $ctx['average']);

        $out = json_decode($content, true);
        if (!is_array($out)) return self::reportFallback($ctx['firstName'], $ctx['average']);

        return [
            'teacherRemark' => mb_substr(trim($out['teacherRemark'] ?? ''), 0, 800),
            'principalRemark' => mb_substr(trim($out['principalRemark'] ?? ''), 0, 800),
            'studyTips' => array_slice(array_filter((array)($out['studyTips'] ?? []), 'is_string'), 0, 5),
            'gapAnalysis' => mb_substr(trim($out['gapAnalysis'] ?? ''), 0, 800),
            'parentLetter' => mb_substr(trim($out['parentLetter'] ?? ''), 0, 1000)
        ];
    }

    public static function generateExamQuestions(array $ctx): array
    {
        $system = "You are an expert teacher creating accurate exam questions. Respond with strict JSON format: { \"questions\": [ { \"question\": \"...\", \"options\": [\"A\", \"B\", \"C\", \"D\"], \"correctAnswer\": 0, \"explanation\": \"...\" } ] }";
        $user = "Generate " . (int)$ctx['questionCount'] . " multiple choice questions for " . $ctx['subject'] . " (" . $ctx['classLevel'] . "). Topic/Context: " . $ctx['topic'];
        
        $content = self::callRouter($system, $user, true);
        if (!$content) throw new RuntimeException("AI generation failed or not configured.");

        $out = json_decode($content, true);
        if (!is_array($out) || !isset($out['questions'])) throw new RuntimeException("Invalid AI response format.");
        
        return $out['questions'];
    }

    public static function reportFallback(string $firstName, ?float $avg): array
    {
        $a = $avg ?? 0.0;
        $teacherRemark = $a >= 75 ? "{$firstName} has demonstrated outstanding academic performance." : ($a >= 50 ? "{$firstName} has performed satisfactorily." : "{$firstName} must work harder.");
        return [
            'teacherRemark' => $teacherRemark,
            'principalRemark' => "We commend {$firstName} for this term's effort.",
            'studyTips' => ['Study 30–45 minutes daily.', 'Revise mistakes from tests.'],
            'gapAnalysis' => "General review required.",
            'parentLetter' => "Dear Parent, please continue to support {$firstName}'s academic journey."
        ];
    }
}
