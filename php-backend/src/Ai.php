<?php

final class Ai
{
    private static function provider(): string
    {
        $p = strtolower(trim(strval(Config::env('AI_PROVIDER', 'openai'))));
        if ($p === 'openrouter') return 'openrouter';
        if ($p === 'gemini') return 'gemini';
        return 'openai';
    }

    private static function getStoredKey(string $provider): ?string
    {
        try {
            $stmt = Db::pdo()->prepare('SELECT v FROM system_settings WHERE k=? LIMIT 1');
            $stmt->execute(['aiKeys']);
            $row = $stmt->fetch();
            if (!$row || !is_string($row['v'] ?? null)) {
                return null;
            }
            $cfg = json_decode($row['v'], true);
            if (!is_array($cfg)) {
                return null;
            }
            $pc = $cfg[$provider] ?? null;
            if (!is_array($pc)) {
                return null;
            }
            $enabled = ($pc['enabled'] ?? false) === true;
            if (!$enabled) {
                return null;
            }
            $cipher = $pc['apiKeyCiphertext'] ?? null;
            if (!is_string($cipher) || $cipher === '') {
                return null;
            }
            return Crypto::decrypt($cipher);
        } catch (Throwable $e) {
            return null;
        }
    }

    public static function getApiKey(): ?string
    {
        $p = self::provider();
        if ($p === 'openrouter') {
            $k = self::getStoredKey('openrouter');
            if ($k !== null) {
                return $k;
            }
            $env = Config::env('OPEN_ROUTER_API_KEY');
            if (is_string($env) && trim($env) !== '') {
                return $env;
            }
        }
        if ($p === 'gemini') {
            $k = self::getStoredKey('gemini');
            if ($k !== null) {
                return $k;
            }
            $env = Config::env('GOOGLE_API_KEY');
            if (is_string($env) && trim($env) !== '') {
                return $env;
            }
        }
        $k = self::getStoredKey('openrouter');
        if ($k !== null) {
            return $k;
        }
        $k = self::getStoredKey('gemini');
        if ($k !== null) {
            return $k;
        }
        return Config::env('AI_API_KEY');
    }

    public static function enabled(): bool
    {
        return Config::envBool('AI_ENABLED', false) && (self::getApiKey() !== null);
    }

    public static function reportFallback(string $firstName, ?float $avg): array
    {
        $a = $avg ?? 0.0;
        $teacherRemark =
            $a >= 75
                ? "{$firstName} has demonstrated outstanding academic performance this term. Keep it up!"
                : ($a >= 65
                    ? "{$firstName} has performed creditably this term. A little more effort will yield excellent results."
                    : ($a >= 50
                        ? "{$firstName} has performed satisfactorily. There is room for improvement next term."
                        : ($a >= 40
                            ? "{$firstName} must work harder. Please review weak subjects with your teacher."
                            : "{$firstName} must put in significantly more effort next term. Teacher intervention required."
                        )
                    )
                );
        return [
            'teacherRemark' => $teacherRemark,
            'principalRemark' => "We commend {$firstName} for this term's effort. Continue to strive for excellence. Our school remains committed to your success.",
            'studyTips' => [
                'Study 30–45 minutes daily, then take a short break.',
                'Revise mistakes from tests before starting new topics.',
                'Practice past questions for your weak subjects.'
            ],
            'gapAnalysis' => "General review required across core subjects.",
            'parentLetter' => "Dear Parent, please continue to support {$firstName}'s academic journey. Your involvement is crucial to their success."
        ];
    }

    public static function generateReport(array $ctx): array
    {
        if (!self::enabled()) {
            return self::reportFallback($ctx['firstName'], $ctx['average']);
        }
        $provider = self::provider();
        $defaultBaseUrl = $provider === 'openrouter' ? 'https://openrouter.ai/api/v1' : 'https://api.openai.com/v1';
        $baseUrl = rtrim(Config::env('AI_BASE_URL', $defaultBaseUrl), '/');
        $model = Config::env('AI_MODEL', 'gpt-4o-mini');
        $timeoutMs = Config::envInt('AI_TIMEOUT_MS', 15000);
        $apiKey = self::getApiKey();
        if ($apiKey === null) {
            return self::reportFallback($ctx['firstName'], $ctx['average']);
        }

        $payload = [
            'model' => $model,
            'temperature' => 0.3,
            'response_format' => ['type' => 'json_object'],
            'messages' => [
                ['role' => 'system', 'content' => 'You generate concise, professional Nigerian school report remarks. Output strict JSON with keys: teacherRemark, principalRemark, studyTips, gapAnalysis, parentLetter. No markdown.'],
                ['role' => 'user', 'content' => json_encode($ctx, JSON_UNESCAPED_SLASHES)]
            ]
        ];

        $ch = curl_init($baseUrl . '/chat/completions');
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json',
            'Authorization: Bearer ' . $apiKey
        ]);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload, JSON_UNESCAPED_SLASHES));
        curl_setopt($ch, CURLOPT_TIMEOUT_MS, $timeoutMs);
        $raw = curl_exec($ch);
        $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        if (!is_string($raw) || $code < 200 || $code >= 300) {
            return self::reportFallback($ctx['firstName'], $ctx['average']);
        }
        $decoded = json_decode($raw, true);
        $content = $decoded['choices'][0]['message']['content'] ?? null;
        if (!is_string($content) || $content === '') {
            return self::reportFallback($ctx['firstName'], $ctx['average']);
        }
        $out = json_decode($content, true);
        if (!is_array($out)) {
            return self::reportFallback($ctx['firstName'], $ctx['average']);
        }
        $teacherRemark = $out['teacherRemark'] ?? null;
        $principalRemark = $out['principalRemark'] ?? null;
        $studyTips = $out['studyTips'] ?? null;
        $gapAnalysis = $out['gapAnalysis'] ?? "Continue to maintain consistent study habits.";
        $parentLetter = $out['parentLetter'] ?? "Dear Parent, please review this report and support the student in their academic goals.";
        if (!is_string($teacherRemark) || !is_string($principalRemark) || !is_array($studyTips)) {
            return self::reportFallback($ctx['firstName'], $ctx['average']);
        }
        $studyTips = array_values(array_filter($studyTips, fn($t) => is_string($t) && trim($t) !== ''));
        $studyTips = array_slice($studyTips, 0, 6);
        return [
            'teacherRemark' => mb_substr(trim($teacherRemark), 0, 800),
            'principalRemark' => mb_substr(trim($principalRemark), 0, 800),
            'studyTips' => $studyTips,
            'gapAnalysis' => mb_substr(trim($gapAnalysis), 0, 800),
            'parentLetter' => mb_substr(trim($parentLetter), 0, 1000)
        ];
    }

    public static function generateExamQuestions(array $ctx): array
    {
        if (!self::enabled()) {
            throw new RuntimeException("AI features are not enabled or configured.");
        }
        $provider = self::provider();
        $defaultBaseUrl = $provider === 'openrouter' ? 'https://openrouter.ai/api/v1' : 'https://api.openai.com/v1';
        $baseUrl = rtrim(Config::env('AI_BASE_URL', $defaultBaseUrl), '/');
        $model = Config::env('AI_MODEL', 'gpt-4o-mini');
        $timeoutMs = Config::envInt('AI_TIMEOUT_MS', 30000);
        $apiKey = self::getApiKey();

        $prompt = "Generate an exam/quiz based on the following parameters.\n";
        $prompt .= "Subject: " . $ctx['subject'] . "\n";
        $prompt .= "Class Level: " . $ctx['classLevel'] . "\n";
        $prompt .= "Topic/Notes:\n" . $ctx['topic'] . "\n\n";
        $prompt .= "Generate " . (int)$ctx['questionCount'] . " multiple choice questions.\n";
        $prompt .= "Output strict JSON in the format: { \"questions\": [ { \"question\": \"...\", \"options\": [\"A\", \"B\", \"C\", \"D\"], \"correctAnswer\": 0, \"explanation\": \"...\" } ] }";

        $payload = [
            'model' => $model,
            'temperature' => 0.5,
            'response_format' => ['type' => 'json_object'],
            'messages' => [
                ['role' => 'system', 'content' => 'You are an expert teacher creating accurate exam questions. Respond with strict JSON. '],
                ['role' => 'user', 'content' => $prompt]
            ]
        ];

        $ch = curl_init($baseUrl . '/chat/completions');
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json',
            'Authorization: Bearer ' . $apiKey
        ]);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload, JSON_UNESCAPED_SLASHES));
        curl_setopt($ch, CURLOPT_TIMEOUT_MS, $timeoutMs);
        $raw = curl_exec($ch);
        $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if (!is_string($raw) || $code < 200 || $code >= 300) {
            throw new RuntimeException("Failed to generate exam from AI provider");
        }
        
        $decoded = json_decode($raw, true);
        $content = $decoded['choices'][0]['message']['content'] ?? null;
        if (!is_string($content) || $content === '') {
            throw new RuntimeException("Empty response from AI provider");
        }
        
        $out = json_decode($content, true);
        if (!is_array($out) || !isset($out['questions'])) {
            throw new RuntimeException("Invalid response format from AI provider");
        }
        
        return $out['questions'];
    }
}
