<?php

final class AttendanceService
{
    private PDO $pdo;

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    public function getSession(string $schoolId, string $className, string $date): ?array
    {
        $stmt = $this->pdo->prepare('SELECT id,status,updated_at FROM attendance_sessions WHERE school_id=? AND class_name=? AND session_date=? LIMIT 1');
        $stmt->execute([$schoolId, $className, $date]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    public function getMarks(string $schoolId, string $sessionId): array
    {
        $stmt = $this->pdo->prepare('SELECT student_id,mark,note FROM attendance_marks WHERE school_id=? AND attendance_session_id=?');
        $stmt->execute([$schoolId, $sessionId]);
        return $stmt->fetchAll();
    }

    public function upsertSession(string $schoolId, string $className, string $date, string $userId, array $marks): string
    {
        $session = $this->getSession($schoolId, $className, $date);
        $sessionId = $session ? $session['id'] : $this->id('ats');
        
        if ($session && $session['status'] === 'SUBMITTED') {
            throw new InvalidArgumentException('Cannot update a submitted session');
        }

        $this->pdo->beginTransaction();
        try {
            if (!$session) {
                $stmt = $this->pdo->prepare('INSERT INTO attendance_sessions (id,school_id,class_name,session_date,taken_by_user_id,status,created_at) VALUES (?,?,?,?,?,\'DRAFT\',NOW())');
                $stmt->execute([$sessionId, $schoolId, $className, $date, $userId]);
            } else {
                $stmt = $this->pdo->prepare('UPDATE attendance_sessions SET updated_at=NOW() WHERE id=?');
                $stmt->execute([$sessionId]);
            }

            // Simple approach: delete and re-insert marks
            $stmt = $this->pdo->prepare('DELETE FROM attendance_marks WHERE attendance_session_id=?');
            $stmt->execute([$sessionId]);

            $stmt = $this->pdo->prepare('INSERT INTO attendance_marks (id,school_id,attendance_session_id,student_id,mark,note,created_at) VALUES (?,?,?,?,?,?,NOW())');
            foreach ($marks as $m) {
                $mid = $this->id('atm');
                $stmt->execute([$mid, $schoolId, $sessionId, $m['studentId'], $m['mark'], $m['note'] ?? null]);
            }

            $this->pdo->commit();
            return $sessionId;
        } catch (Throwable $e) {
            $this->pdo->rollBack();
            throw $e;
        }
    }

    public function submitSession(string $schoolId, string $sessionId): void
    {
        $stmt = $this->pdo->prepare('UPDATE attendance_sessions SET status=\'SUBMITTED\', updated_at=NOW() WHERE id=? AND school_id=?');
        $stmt->execute([$sessionId, $schoolId]);
    }

    public function getHistory(string $schoolId, string $className, string $from, string $to): array
    {
        $stmt = $this->pdo->prepare('SELECT id,session_date AS date,status,updated_at FROM attendance_sessions WHERE school_id=? AND class_name=? AND session_date BETWEEN ? AND ? ORDER BY session_date DESC');
        $stmt->execute([$schoolId, $className, $from, $to]);
        return $stmt->fetchAll();
    }

    public function getStudentSummary(string $schoolId, string $studentId, string $from, string $to): array
    {
        $stmt = $this->pdo->prepare("SELECT m.mark FROM attendance_marks m JOIN attendance_sessions s ON s.id=m.attendance_session_id WHERE m.school_id=? AND m.student_id=? AND s.status='SUBMITTED' AND s.session_date BETWEEN ? AND ?");
        $stmt->execute([$schoolId, $studentId, $from, $to]);
        $rows = $stmt->fetchAll();
        
        $stats = ['total' => 0, 'present' => 0, 'absent' => 0, 'late' => 0];
        foreach ($rows as $r) {
            $stats['total']++;
            $mk = strtoupper($r['mark']);
            if ($mk === 'PRESENT') $stats['present']++;
            elseif ($mk === 'ABSENT') $stats['absent']++;
            elseif ($mk === 'LATE') $stats['late']++;
        }
        $stats['presentRate'] = $stats['total'] > 0 ? ($stats['present'] / $stats['total']) : null;
        return $stats;
    }

    public function getStudentDays(string $schoolId, string $studentId, string $from, string $to): array
    {
        $stmt = $this->pdo->prepare("SELECT s.session_date AS date, m.mark, m.note FROM attendance_marks m JOIN attendance_sessions s ON s.id=m.attendance_session_id WHERE m.school_id=? AND m.student_id=? AND s.status='SUBMITTED' AND s.session_date BETWEEN ? AND ? ORDER BY s.session_date DESC");
        $stmt->execute([$schoolId, $studentId, $from, $to]);
        return $stmt->fetchAll();
    }

    private function id(string $prefix): string
    {
        return $prefix . '_' . bin2hex(random_bytes(8));
    }
}
