<?php

final class StudentService
{
    private PDO $pdo;

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    public function getById(string $schoolId, string $studentId): ?array
    {
        $stmt = $this->pdo->prepare('SELECT * FROM students WHERE school_id=? AND id=? LIMIT 1');
        $stmt->execute([$schoolId, $studentId]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    public function listAll(string $schoolId): array
    {
        $stmt = $this->pdo->prepare('SELECT * FROM students WHERE school_id=? ORDER BY name ASC');
        $stmt->execute([$schoolId]);
        return $stmt->fetchAll();
    }

    public function create(string $schoolId, array $data): string
    {
        $id = $this->id('stu');
        $stmt = $this->pdo->prepare('INSERT INTO students (id,school_id,name,admission_no,gender,class_name,dob,house,parent,photo_url,address,guardian_name,guardian_phone,guardian_email,emergency_name,emergency_phone,profile_extra,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,NOW())');
        
        $extraJson = is_array($data['extra'] ?? null) ? json_encode($data['extra'], JSON_UNESCAPED_SLASHES) : '{}';

        $stmt->execute([
            $id,
            $schoolId,
            $data['name'],
            $data['admNo'],
            $data['gender'] ?? null,
            $data['cls'] ?? null,
            $data['dob'] ?? null,
            $data['house'] ?? null,
            $data['parent'] ?? null,
            $data['photoUrl'] ?? null,
            $data['address'] ?? null,
            $data['guardianName'] ?? null,
            $data['guardianPhone'] ?? null,
            $data['guardianEmail'] ?? null,
            $data['emergencyName'] ?? null,
            $data['emergencyPhone'] ?? null,
            $extraJson
        ]);
        return $id;
    }

    public function update(string $schoolId, string $studentId, array $data): void
    {
        $allowed = ['name','admission_no','gender','class_name','dob','house','parent','photo_url','address','guardian_name','guardian_phone','guardian_email','emergency_name','emergency_phone','profile_extra'];
        $set = [];
        $vals = [];
        foreach ($data as $col => $val) {
            if (!in_array($col, $allowed, true)) continue;
            $set[] = "$col=?";
            $vals[] = $val;
        }
        if (!$set) return;

        $vals[] = $schoolId;
        $vals[] = $studentId;
        $stmt = $this->pdo->prepare('UPDATE students SET ' . implode(',', $set) . ', updated_at=NOW() WHERE school_id=? AND id=?');
        $stmt->execute($vals);
    }

    public function bulkImport(string $schoolId, array $rows): array
    {
        $results = ['created' => 0, 'errors' => []];
        $sql = Db::isSqlite()
            ? 'INSERT INTO students (id,school_id,name,admission_no,gender,class_name,dob,house,parent,created_at) VALUES (?,?,?,?,?,?,?,?,?,NOW())'
            : 'INSERT INTO students (id,school_id,name,admission_no,gender,class_name,dob,house,parent,created_at) VALUES (?,?,?,?,?,?,?,?,?,NOW())';
        
        $stmt = $this->pdo->prepare($sql);
        
        foreach ($rows as $index => $row) {
            $line = $index + 1;
            if (!is_array($row)) continue;
            
            $name = trim(strval($row['name'] ?? ''));
            $adm = trim(strval($row['admNo'] ?? ''));
            
            if ($name === '') {
                $results['errors'][] = "Line $line: Name is required";
                continue;
            }
            if ($adm === '') {
                $results['errors'][] = "Line $line: Admission Number is required";
                continue;
            }

            try {
                $id = $this->id('stu');
                $stmt->execute([
                    $id,
                    $schoolId,
                    $name,
                    $adm,
                    trim(strval($row['gender'] ?? '')),
                    trim(strval($row['cls'] ?? '')),
                    isset($row['dob']) ? trim(strval($row['dob'])) : null,
                    isset($row['house']) ? trim(strval($row['house'])) : null,
                    isset($row['parent']) ? trim(strval($row['parent'])) : null
                ]);
                $results['created']++;
            } catch (PDOException $e) {
                if (str_contains($e->getMessage(), 'Duplicate') || str_contains($e->getMessage(), 'UNIQUE')) {
                    $results['errors'][] = "Line $line: Duplicate Admission Number ($adm)";
                } else {
                    $results['errors'][] = "Line $line: Database error (" . $e->getCode() . ")";
                }
            }
        }
        return $results;
    }

    public function delete(string $schoolId, string $studentId): void
    {
        $this->pdo->beginTransaction();
        try {
            $stmt = $this->pdo->prepare('DELETE FROM score_sheets WHERE school_id=? AND student_id=?');
            $stmt->execute([$schoolId, $studentId]);
            $stmt = $this->pdo->prepare('DELETE FROM attendance_marks WHERE school_id=? AND student_id=?');
            $stmt->execute([$schoolId, $studentId]);
            $stmt = $this->pdo->prepare('DELETE FROM students WHERE school_id=? AND id=?');
            $stmt->execute([$schoolId, $studentId]);
            $this->pdo->commit();
        } catch (Throwable $e) {
            $this->pdo->rollBack();
            throw $e;
        }
    }

    public function count(string $schoolId): int
    {
        $stmt = $this->pdo->prepare('SELECT COUNT(*) FROM students WHERE school_id=?');
        $stmt->execute([$schoolId]);
        return (int)$stmt->fetchColumn();
    }

    private function id(string $prefix): string
    {
        return $prefix . '_' . bin2hex(random_bytes(8));
    }
}
