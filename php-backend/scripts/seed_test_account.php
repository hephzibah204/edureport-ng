<?php

require_once dirname(__DIR__) . '/src/Config.php';
require_once dirname(__DIR__) . '/src/Db.php';
require_once dirname(__DIR__) . '/src/Auth.php';

Config::loadEnvIfPresent();

$pdo = Db::pdo();

$email = 'test@school.com';
$password = 'TestPassword123!';

function idp(string $prefix): string {
    return $prefix . '_' . bin2hex(random_bytes(8));
}

// 1. Ensure user exists
$stmt = $pdo->prepare('SELECT id FROM users WHERE email=? LIMIT 1');
$stmt->execute([$email]);
$user = $stmt->fetch();

if (!$user) {
    $uid = idp('usr');
    $hash = Auth::hashPassword($password);
    $pdo->prepare('INSERT INTO users (id,email,password_hash,role,status,created_at) VALUES (?,?,?,?,?,NOW())')
        ->execute([$uid, $email, $hash, 'SCHOOL', 'ACTIVE']);
    $user = ['id' => $uid];
    fwrite(STDOUT, "Created user: {$email}\n");
} else {
    $uid = $user['id'];
    fwrite(STDOUT, "Using existing user: {$email}\n");
}

// 2. Ensure school exists
$stmt = $pdo->prepare('SELECT id FROM schools WHERE owner_id=? LIMIT 1');
$stmt->execute([$uid]);
$school = $stmt->fetch();

if (!$school) {
    $sid = idp('sch');
    $subjects = ['Mathematics', 'English Language', 'Basic Science', 'Social Studies', 'Civic Education', 'Computer Studies', 'Agricultural Science'];
    $grades = [
        ['min'=>75,'max'=>100,'grade'=>'A','remark'=>'Distinction','color'=>'#155724'],
        ['min'=>65,'max'=>74,'grade'=>'B','remark'=>'Credit','color'=>'#0c5460'],
        ['min'=>50,'max'=>64,'grade'=>'C','remark'=>'Merit','color'=>'#856404'],
        ['min'=>40,'max'=>49,'grade'=>'D','remark'=>'Pass','color'=>'#884510'],
        ['min'=>0,'max'=>39,'grade'=>'F','remark'=>'Fail','color'=>'#721c24']
    ];

    $pdo->prepare('INSERT INTO schools (id,owner_id,name,abbr,school_level,class_templates,plan,subjects,grades,ca1_max,ca2_max,exam_max,subdomain,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,NOW())')
        ->execute([
            $sid,
            $uid,
            'Test Academy',
            'TTA',
            'Secondary',
            json_encode(['nursery' => 'Nursery, KG', 'primary' => 'Primary, Grade', 'secondary' => 'JSS, SSS'], JSON_UNESCAPED_SLASHES),
            'PRO',
            json_encode($subjects, JSON_UNESCAPED_SLASHES),
            json_encode($grades, JSON_UNESCAPED_SLASHES),
            10,
            10,
            80,
            'test'
        ]);
    $school = ['id' => $sid];
    fwrite(STDOUT, "Created school: Test Academy\n");
} else {
    $sid = $school['id'];
    fwrite(STDOUT, "Using existing school ID: {$sid}\n");
}

$pdo->beginTransaction();
try {
    // Clear existing students/teachers for this school to start fresh
    $pdo->prepare('DELETE FROM students WHERE school_id=?')->execute([$sid]);
    $pdo->prepare('DELETE FROM teacher_profiles WHERE school_id=?')->execute([$sid]);
    $pdo->prepare('DELETE FROM teacher_class_assignments WHERE school_id=?')->execute([$sid]);
    
    // Delete users associated with this school (Teachers)
    $pdo->prepare('DELETE FROM users WHERE school_id=? AND role=?')->execute([$sid, 'TEACHER']);
    
    // Delete parent users (identified by pattern to be safe)
    $pdo->prepare("DELETE FROM users WHERE role='PARENT' AND email LIKE 'parent.%@test.com'")->execute();
    $pdo->prepare("DELETE FROM student_links WHERE school_id=?")->execute([$sid]);
    
    $classes = ['JSS 1', 'JSS 2', 'JSS 3', 'SSS 1', 'SSS 2', 'SSS 3'];
    $school_data = $pdo->query("SELECT subjects FROM schools WHERE id='$sid'")->fetch();
    $subjects = json_decode($school_data['subjects'], true);
    
    $firstNames = ['John', 'Jane', 'David', 'Sarah', 'Michael', 'Emily', 'Daniel', 'Olivia', 'James', 'Sophia', 'Ade', 'Bisi', 'Chidi', 'Nkechi', 'Musa', 'Fatima', 'Olu', 'Tunde', 'Aisha', 'Ibrahim'];
    $lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Okonkwo', 'Balogun', 'Abubakar', 'Eze', 'Danladi', 'Umar', 'Okoro', 'Adewale', 'Salami', 'Garba'];

    foreach ($classes as $className) {
        // Create a teacher for this class
        $teacherUid = idp('usr');
        $teacherEmail = strtolower(str_replace(' ', '', $className)) . ".teacher@test.com";
        $hash = Auth::hashPassword('TeacherPass123!');
        
        $pdo->prepare('INSERT INTO users (id,email,password_hash,role,status,created_at,school_id) VALUES (?,?,?,?,?,NOW(),?)')
            ->execute([$teacherUid, $teacherEmail, $hash, 'TEACHER', 'ACTIVE', $sid]);
            
        $pdo->prepare('INSERT INTO teacher_profiles (id,user_id,school_id,display_name,created_at) VALUES (?,?,?,?,NOW())')
            ->execute([idp('tp'), $teacherUid, $sid, "Teacher for " . $className]);
            
        $pdo->prepare('INSERT INTO teacher_class_assignments (id,school_id,teacher_user_id,class_name,created_at) VALUES (?,?,?,?,NOW())')
            ->execute([idp('tca'), $sid, $teacherUid, $className]);

        fwrite(STDOUT, "Created teacher: {$teacherEmail} for {$className}\n");

        // Create 20 students for this class (total 120 students)
        for ($i = 1; $i <= 20; $i++) {
            $fn = $firstNames[array_rand($firstNames)];
            $ln = $lastNames[array_rand($lastNames)];
            $name = $fn . ' ' . $ln;
            $adm = "TTA/" . substr($className, 0, 1) . substr($className, -1) . "/" . str_pad($i, 3, '0', STR_PAD_LEFT);
            $gender = ($i % 2 === 0) ? 'Female' : 'Male';
            
            $studId = idp('stu');
            $pdo->prepare('INSERT INTO students (id,school_id,name,admission_no,gender,class_name,created_at) VALUES (?,?,?,?,?,?,NOW())')
                ->execute([$studId, $sid, $name, $adm, $gender, $className]);

            // Create random scores
            $sheet = [];
            foreach ($subjects as $sub) {
                $ca1 = random_int(5, 10);
                $ca2 = random_int(5, 10);
                $exam = random_int(30, 75);
                $sheet[$sub] = ['ca1' => $ca1, 'ca2' => $ca2, 'exam' => $exam];
            }
            $pdo->prepare('INSERT INTO score_sheets (id,school_id,student_id,data,created_at,updated_at) VALUES (?,?,?,?,NOW(),NOW())')
                ->execute([idp('scr'), $sid, $studId, json_encode($sheet, JSON_UNESCAPED_SLASHES)]);

            // Create a parent account for every 3rd student
            if ($i % 3 === 0) {
                $parentUid = idp('usr');
                $parentEmail = "parent." . strtolower($fn) . "." . strtolower($ln) . "@test.com";
                $hash = Auth::hashPassword('ParentPass123!');
                
                try {
                    $pdo->prepare('INSERT INTO users (id,email,password_hash,role,status,created_at) VALUES (?,?,?,?,?,NOW())')
                        ->execute([$parentUid, $parentEmail, $hash, 'PARENT', 'ACTIVE']);
                        
                    $pdo->prepare('INSERT INTO student_links (id,school_id,student_id,user_id,link_type,created_at) VALUES (?,?,?,?,?,NOW())')
                        ->execute([idp('sl'), $sid, $studId, $parentUid, 'PARENT']);
                } catch (Exception $e) {}
            }
        }
    }

    $pdo->commit();
    fwrite(STDOUT, "Seeding completed successfully!\n");
} catch (Throwable $e) {
    try { $pdo->rollBack(); } catch (Throwable $e2) {}
    fwrite(STDERR, "Seed failed: " . $e->getMessage() . "\n");
    exit(1);
}
