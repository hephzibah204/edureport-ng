<?php

require_once dirname(__DIR__) . '/src/Config.php';
require_once dirname(__DIR__) . '/src/Db.php';
require_once dirname(__DIR__) . '/src/Auth.php';

Config::loadEnvIfPresent();

$pdo = Db::pdo();

$email = Config::env('DEMO_SCHOOL_EMAIL', 'demo.school@example.com');
$password = Config::env('DEMO_SCHOOL_PASSWORD', 'ChangeMeNow_Use_At_Least_12Chars');

if (!is_string($email) || trim($email) === '' || !is_string($password) || strlen($password) < 12) {
    fwrite(STDERR, "Invalid DEMO_SCHOOL_EMAIL/DEMO_SCHOOL_PASSWORD\n");
    exit(2);
}

function idp(string $prefix): string {
    return $prefix . '_' . bin2hex(random_bytes(8));
}

$stmt = $pdo->prepare('SELECT id FROM users WHERE email=? LIMIT 1');
$stmt->execute([$email]);
$existing = $stmt->fetch();
if ($existing) {
    fwrite(STDOUT, "Demo school already exists: {$email}\n");
    exit(0);
}

$uid = idp('usr');
$sid = idp('sch');
$hash = Auth::hashPassword($password);

$subjects = [
    'Mathematics',
    'English Language',
    'Basic Science',
    'Social Studies',
    'Civic Education'
];

$grades = [
    ['min'=>75,'max'=>100,'grade'=>'A','remark'=>'Distinction','color'=>'#155724'],
    ['min'=>65,'max'=>74,'grade'=>'B','remark'=>'Credit','color'=>'#0c5460'],
    ['min'=>50,'max'=>64,'grade'=>'C','remark'=>'Merit','color'=>'#856404'],
    ['min'=>40,'max'=>49,'grade'=>'D','remark'=>'Pass','color'=>'#884510'],
    ['min'=>0,'max'=>39,'grade'=>'F','remark'=>'Fail','color'=>'#721c24']
];

$pdo->beginTransaction();
try {
    $pdo->prepare('INSERT INTO users (id,email,password_hash,role,status,created_at) VALUES (?,?,?,?,?,NOW())')
        ->execute([$uid, $email, $hash, 'SCHOOL', 'ACTIVE']);

    $pdo->prepare('INSERT INTO schools (id,owner_id,name,abbr,school_level,class_templates,plan,subjects,grades,ca1_max,ca2_max,exam_max,subdomain,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,NOW())')
        ->execute([
            $sid,
            $uid,
            'Demo Secondary School',
            'DSS',
            'Secondary',
            json_encode(['nursery' => 'Nursery, KG', 'primary' => 'Primary, Grade', 'secondary' => 'JSS, SSS'], JSON_UNESCAPED_SLASHES),
            'PRO',
            json_encode($subjects, JSON_UNESCAPED_SLASHES),
            json_encode($grades, JSON_UNESCAPED_SLASHES),
            10,
            10,
            80,
            'demo'
        ]);

    $students = [
        ['name' => 'Adeyemi Tunde', 'adm' => 'DSS/001', 'gender' => 'Male', 'cls' => 'JSS 1'],
        ['name' => 'Okafor Chiamaka', 'adm' => 'DSS/002', 'gender' => 'Female', 'cls' => 'JSS 1'],
        ['name' => 'Suleiman Ibrahim', 'adm' => 'DSS/003', 'gender' => 'Male', 'cls' => 'JSS 1'],
        ['name' => 'Bello Zainab', 'adm' => 'DSS/004', 'gender' => 'Female', 'cls' => 'JSS 2'],
        ['name' => 'Udo Akpan', 'adm' => 'DSS/005', 'gender' => 'Male', 'cls' => 'JSS 2']
    ];

    foreach ($students as $st) {
        $studId = idp('stu');
        $pdo->prepare('INSERT INTO students (id,school_id,name,admission_no,gender,class_name,created_at) VALUES (?,?,?,?,?,?,NOW())')
            ->execute([$studId, $sid, $st['name'], $st['adm'], $st['gender'], $st['cls']]);

        $sheet = [];
        foreach ($subjects as $sub) {
            $ca1 = random_int(3, 10);
            $ca2 = random_int(3, 10);
            $exam = random_int(25, 75);
            $sheet[$sub] = ['ca1' => $ca1, 'ca2' => $ca2, 'exam' => $exam];
        }
        $pdo->prepare('INSERT INTO score_sheets (id,school_id,student_id,data,created_at,updated_at) VALUES (?,?,?,?,NOW(),NOW())')
            ->execute([idp('scr'), $sid, $studId, json_encode($sheet, JSON_UNESCAPED_SLASHES)]);
    }

    $pdo->commit();
} catch (Throwable $e) {
    try { $pdo->rollBack(); } catch (Throwable $e2) {}
    fwrite(STDERR, "Seed failed: " . $e->getMessage() . "\n");
    exit(1);
}

fwrite(STDOUT, "Demo seeded. Login with:\n");
fwrite(STDOUT, "  Email: {$email}\n");
fwrite(STDOUT, "  Password: {$password}\n");
