<?php

final class JobService
{
    private PDO $pdo;

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    public function create(string $schoolId, string $userId, string $type, array $payload): string
    {
        $id = 'job_' . bin2hex(random_bytes(8));
        $stmt = $this->pdo->prepare('INSERT INTO jobs (id, school_id, user_id, type, payload, created_at, updated_at) VALUES (?, ?, ?, ?, ?, NOW(), NOW())');
        $stmt->execute([$id, $schoolId, $userId, $type, json_encode($payload, JSON_UNESCAPED_SLASHES)]);
        return $id;
    }

    public function updateStatus(string $jobId, string $status, int $progress = 0, ?string $resultUrl = null, ?string $error = null): void
    {
        $stmt = $this->pdo->prepare('UPDATE jobs SET status=?, progress=?, result_url=?, error=?, updated_at=NOW() WHERE id=?');
        $stmt->execute([$status, $progress, $resultUrl, $error, $jobId]);
    }

    public function getById(string $jobId): ?array
    {
        $stmt = $this->pdo->prepare('SELECT * FROM jobs WHERE id=? LIMIT 1');
        $stmt->execute([$jobId]);
        $row = $stmt->fetch();
        if ($row) {
            $row['payload'] = json_decode($row['payload'], true);
        }
        return $row ?: null;
    }

    public function listRecent(string $schoolId, int $limit = 10): array
    {
        $stmt = $this->pdo->prepare('SELECT * FROM jobs WHERE school_id=? ORDER BY created_at DESC LIMIT ?');
        $stmt->execute([$schoolId, $limit]);
        $rows = $stmt->fetchAll();
        foreach ($rows as &$r) {
            $r['payload'] = json_decode($r['payload'], true);
        }
        return $rows;
    }

    public function getPending(): array
    {
        $stmt = $this->pdo->prepare("SELECT * FROM jobs WHERE status='PENDING' ORDER BY created_at ASC");
        $stmt->execute();
        $rows = $stmt->fetchAll();
        foreach ($rows as &$r) {
            $r['payload'] = json_decode($r['payload'], true);
        }
        return $rows;
    }
}
