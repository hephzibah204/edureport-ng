<?php

require_once dirname(__DIR__) . '/src/Config.php';
require_once dirname(__DIR__) . '/src/Db.php';

Config::loadEnvIfPresent();

$dsnArg = $argv[1] ?? null;
$dsn = is_string($dsnArg) && trim($dsnArg) !== '' ? trim($dsnArg) : Config::env('DB_DSN');
if (!is_string($dsn) || trim($dsn) === '') {
    $dsn = 'sqlite:storage/edureport.sqlite';
}
if (!str_starts_with($dsn, 'sqlite:')) {
    fwrite(STDERR, "DB_DSN must start with sqlite:.\n");
    fwrite(STDERR, "Tip: set DB_DSN in php-backend/.env or run: php php-backend/scripts/init_sqlite.php sqlite:storage/edureport.sqlite\n");
    exit(2);
}

putenv('DB_DSN=' . $dsn);
$_ENV['DB_DSN'] = $dsn;

$path = substr($dsn, 7);
if (is_string($path) && $path !== '' && $path !== ':memory:') {
    $pathOnly = $path;
    $q = strpos($pathOnly, '?');
    if ($q !== false) {
        $pathOnly = substr($pathOnly, 0, $q);
    }
    if (!preg_match('#^(/|[A-Za-z]:[\\/])#', $pathOnly)) {
        $pathOnly = dirname(__DIR__) . DIRECTORY_SEPARATOR . str_replace(['/', '\\'], DIRECTORY_SEPARATOR, $pathOnly);
    }
    $dir = dirname($pathOnly);
    if (!is_dir($dir)) {
        @mkdir($dir, 0775, true);
    }
}

$pdo = Db::pdo();

$sqlFile = dirname(__DIR__) . '/migrations/sqlite_init.sql';
if (!is_file($sqlFile)) {
    fwrite(STDERR, "Missing migrations/sqlite_init.sql\n");
    exit(2);
}

$raw = file_get_contents($sqlFile);
if (!is_string($raw)) {
    fwrite(STDERR, "Failed to read sqlite_init.sql\n");
    exit(2);
}

$statements = [];
$buf = '';
$lines = preg_split('/\r?\n/', $raw);
foreach ($lines as $line) {
    $trim = trim($line);
    if ($trim === '' || str_starts_with($trim, '--')) {
        continue;
    }
    $buf .= $line . "\n";
    if (str_contains($line, ';')) {
        $parts = explode(';', $buf);
        for ($i = 0; $i < count($parts) - 1; $i++) {
            $stmt = trim($parts[$i]);
            if ($stmt !== '') {
                $statements[] = $stmt;
            }
        }
        $buf = $parts[count($parts) - 1];
    }
}
$tail = trim($buf);
if ($tail !== '') {
    $statements[] = $tail;
}

$pdo->beginTransaction();
try {
    foreach ($statements as $s) {
        $pdo->exec($s);
    }
    $pdo->commit();
} catch (Throwable $e) {
    try { $pdo->rollBack(); } catch (Throwable $e2) {}
    fwrite(STDERR, "SQLite init failed: " . $e->getMessage() . "\n");
    exit(1);
}

try {
    $pdo->exec("CREATE UNIQUE INDEX IF NOT EXISTS idx_schools_subdomain_unique ON schools(subdomain)");
} catch (Throwable $e) {
}

try {
    $pdo->exec("ALTER TABLE schools ADD COLUMN school_level TEXT NOT NULL DEFAULT 'Secondary'");
} catch (Throwable $e) {
}

try {
    $pdo->exec("ALTER TABLE schools ADD COLUMN class_templates TEXT NOT NULL DEFAULT '{}'");
} catch (Throwable $e) {
}

try {
    $pdo->exec('ALTER TABLE users ADD COLUMN display_name TEXT NULL');
} catch (Throwable $e) {
}

try {
    $pdo->exec('ALTER TABLE students ADD COLUMN photo_url TEXT NULL');
} catch (Throwable $e) {
}
try {
    $pdo->exec('ALTER TABLE students ADD COLUMN address TEXT NULL');
} catch (Throwable $e) {
}
try {
    $pdo->exec('ALTER TABLE students ADD COLUMN guardian_name TEXT NULL');
} catch (Throwable $e) {
}
try {
    $pdo->exec('ALTER TABLE students ADD COLUMN guardian_phone TEXT NULL');
} catch (Throwable $e) {
}
try {
    $pdo->exec('ALTER TABLE students ADD COLUMN guardian_email TEXT NULL');
} catch (Throwable $e) {
}
try {
    $pdo->exec('ALTER TABLE students ADD COLUMN emergency_name TEXT NULL');
} catch (Throwable $e) {
}
try {
    $pdo->exec('ALTER TABLE students ADD COLUMN emergency_phone TEXT NULL');
} catch (Throwable $e) {
}
try {
    $pdo->exec("ALTER TABLE students ADD COLUMN profile_extra TEXT NOT NULL DEFAULT '{}'");
} catch (Throwable $e) {
}

try {
    $pdo->exec('CREATE TABLE IF NOT EXISTS student_links (id TEXT PRIMARY KEY, school_id TEXT NOT NULL, student_id TEXT NOT NULL, user_id TEXT NOT NULL, link_type TEXT NOT NULL, created_at TEXT NOT NULL, UNIQUE (student_id, user_id, link_type), FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE, FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE, FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE)');
    $pdo->exec('CREATE INDEX IF NOT EXISTS idx_student_links_school ON student_links(school_id)');
    $pdo->exec('CREATE INDEX IF NOT EXISTS idx_student_links_student ON student_links(student_id)');
    $pdo->exec('CREATE INDEX IF NOT EXISTS idx_student_links_user ON student_links(user_id)');
} catch (Throwable $e) {
}

try {
    $pdo->exec("CREATE TABLE IF NOT EXISTS attendance_sessions (id TEXT PRIMARY KEY, school_id TEXT NOT NULL, class_name TEXT NOT NULL, session_date TEXT NOT NULL, taken_by_user_id TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'DRAFT', created_at TEXT NOT NULL, updated_at TEXT NULL, UNIQUE (school_id, class_name, session_date), FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE, FOREIGN KEY (taken_by_user_id) REFERENCES users(id) ON DELETE RESTRICT)");
    $pdo->exec('CREATE INDEX IF NOT EXISTS idx_att_sessions_school ON attendance_sessions(school_id)');
    $pdo->exec('CREATE INDEX IF NOT EXISTS idx_att_sessions_class_date ON attendance_sessions(class_name, session_date)');
    $pdo->exec('CREATE INDEX IF NOT EXISTS idx_att_sessions_taken_by ON attendance_sessions(taken_by_user_id)');
} catch (Throwable $e) {
}

try {
    $pdo->exec('CREATE TABLE IF NOT EXISTS attendance_marks (id TEXT PRIMARY KEY, school_id TEXT NOT NULL, attendance_session_id TEXT NOT NULL, student_id TEXT NOT NULL, mark TEXT NOT NULL, note TEXT NULL, created_at TEXT NOT NULL, updated_at TEXT NULL, UNIQUE (attendance_session_id, student_id), FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE, FOREIGN KEY (attendance_session_id) REFERENCES attendance_sessions(id) ON DELETE CASCADE, FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE)');
    $pdo->exec('CREATE INDEX IF NOT EXISTS idx_att_marks_school ON attendance_marks(school_id)');
    $pdo->exec('CREATE INDEX IF NOT EXISTS idx_att_marks_student ON attendance_marks(student_id)');
    $pdo->exec('CREATE INDEX IF NOT EXISTS idx_att_marks_session ON attendance_marks(attendance_session_id)');
} catch (Throwable $e) {
}

try {
    $pdo->exec('CREATE TABLE IF NOT EXISTS report_extras (id TEXT PRIMARY KEY, school_id TEXT NOT NULL, student_id TEXT NOT NULL, session TEXT NOT NULL, term TEXT NOT NULL, attendance TEXT NOT NULL, traits TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, UNIQUE (school_id, student_id, session, term), FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE, FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE)');
    $pdo->exec('CREATE INDEX IF NOT EXISTS idx_report_extras_school ON report_extras(school_id)');
    $pdo->exec('CREATE INDEX IF NOT EXISTS idx_report_extras_student ON report_extras(student_id)');
} catch (Throwable $e) {
}

try {
    $pdo->exec('CREATE TABLE IF NOT EXISTS teacher_profiles (id TEXT PRIMARY KEY, user_id TEXT NOT NULL UNIQUE, school_id TEXT NOT NULL, display_name TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NULL, FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE, FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE)');
    $pdo->exec('CREATE INDEX IF NOT EXISTS idx_teacher_profiles_school_id ON teacher_profiles(school_id)');
} catch (Throwable $e) {
}

try {
    $pdo->exec('CREATE TABLE IF NOT EXISTS teacher_class_assignments (id TEXT PRIMARY KEY, school_id TEXT NOT NULL, teacher_user_id TEXT NOT NULL, class_name TEXT NOT NULL, created_at TEXT NOT NULL, UNIQUE (school_id, teacher_user_id, class_name), FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE, FOREIGN KEY (teacher_user_id) REFERENCES users(id) ON DELETE CASCADE)');
    $pdo->exec('CREATE INDEX IF NOT EXISTS idx_teacher_assignments_teacher ON teacher_class_assignments(teacher_user_id)');
    $pdo->exec('CREATE INDEX IF NOT EXISTS idx_teacher_assignments_school ON teacher_class_assignments(school_id)');
    $pdo->exec('CREATE INDEX IF NOT EXISTS idx_teacher_assignments_class ON teacher_class_assignments(class_name)');
} catch (Throwable $e) {
}

try {
    $pdo->exec('CREATE TABLE IF NOT EXISTS report_exports (id TEXT PRIMARY KEY, school_id TEXT NOT NULL, token TEXT NOT NULL UNIQUE, pin_hash TEXT NOT NULL, filename TEXT NOT NULL, file_path TEXT NOT NULL, created_at TEXT NOT NULL, expires_at TEXT NOT NULL, FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE)');
    $pdo->exec('CREATE INDEX IF NOT EXISTS idx_report_exports_school ON report_exports(school_id)');
} catch (Throwable $e) {
}

fwrite(STDOUT, "SQLite initialized.\n");
