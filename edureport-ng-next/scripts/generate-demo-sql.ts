import * as fs from 'fs';
import * as path from 'path';

function generateId() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

function nowISO() {
  return new Date().toISOString();
}

async function run() {
  console.log("Generating seed SQL...");
  
  const schoolId = "demo-school-id";
  const ownerId = "demo-owner-id";
  const teacherId1 = generateId();
  const teacherId2 = generateId();
  
  const pwdData = new TextEncoder().encode("demo");
  const hashBuffer = await crypto.subtle.digest('SHA-256', pwdData);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const validHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  const sql: string[] = [];

  // Users
  sql.push(`INSERT OR REPLACE INTO users (id, email, password_hash, role, status, created_at, updated_at) VALUES ('${ownerId}', 'demo@reportsheet.com.ng', '${validHash}', 'OWNER', 'ACTIVE', '${nowISO()}', '${nowISO()}');`);
  
  sql.push(`INSERT OR REPLACE INTO users (id, email, password_hash, role, status, school_id, created_at, updated_at) VALUES ('${teacherId1}', 'teacher1@reportsheet.com.ng', '${validHash}', 'TEACHER', 'ACTIVE', '${schoolId}', '${nowISO()}', '${nowISO()}');`);
  sql.push(`INSERT OR REPLACE INTO users (id, email, password_hash, role, status, school_id, created_at, updated_at) VALUES ('${teacherId2}', 'teacher2@reportsheet.com.ng', '${validHash}', 'TEACHER', 'ACTIVE', '${schoolId}', '${nowISO()}', '${nowISO()}');`);

  const classTemplates = ["JSS 1", "JSS 2", "JSS 3", "SSS 1", "SSS 2", "SSS 3"];
  const subjects = ["Mathematics", "English", "Basic Science", "Social Studies", "Civic Education", "Computer Studies"];
  const grades = [
    { min: 70, max: 100, letter: "A", remark: "Excellent" },
    { min: 60, max: 69, letter: "B", remark: "Very Good" },
    { min: 50, max: 59, letter: "C", remark: "Credit" },
    { min: 40, max: 49, letter: "D", remark: "Pass" },
    { min: 0, max: 39, letter: "F", remark: "Fail" }
  ];

  sql.push(`INSERT OR REPLACE INTO schools (id, owner_id, name, abbr, subdomain, session, term, ca1_max, ca2_max, exam_max, class_templates, subjects, grades, plan, created_at, updated_at) VALUES ('${schoolId}', '${ownerId}', 'Demo International Academy', 'DIA', 'demo', '2025/2026', 'First Term', 10, 10, 80, '${JSON.stringify(classTemplates)}', '${JSON.stringify(subjects)}', '${JSON.stringify(grades)}', 'LIFETIME', '${nowISO()}', '${nowISO()}');`);

  // Teacher Profiles
  sql.push(`INSERT OR REPLACE INTO teacher_profiles (id, user_id, school_id, display_name, created_at) VALUES ('${generateId()}', '${teacherId1}', '${schoolId}', 'Mr. John Doe', '${nowISO()}');`);
  sql.push(`INSERT OR REPLACE INTO teacher_profiles (id, user_id, school_id, display_name, created_at) VALUES ('${generateId()}', '${teacherId2}', '${schoolId}', 'Mrs. Jane Smith', '${nowISO()}');`);

  // Teacher Class Assignments
  sql.push(`INSERT OR REPLACE INTO teacher_class_assignments (id, school_id, teacher_user_id, class_name, created_at) VALUES ('${generateId()}', '${schoolId}', '${teacherId1}', 'JSS 1', '${nowISO()}');`);
  sql.push(`INSERT OR REPLACE INTO teacher_class_assignments (id, school_id, teacher_user_id, class_name, created_at) VALUES ('${generateId()}', '${schoolId}', '${teacherId2}', 'SSS 1', '${nowISO()}');`);

  // Generate 100 students
  const students = [];
  for (let i = 1; i <= 100; i++) {
    const studentId = generateId();
    const cls = classTemplates[i % classTemplates.length];
    const name = `Student ${i} Demo`;
    const gender = i % 2 === 0 ? 'M' : 'F';
    const admNo = `DIA-${1000 + i}`;
    
    students.push({ id: studentId, cls, name, gender, admNo });

    sql.push(`INSERT OR REPLACE INTO students (id, school_id, name, class_name, gender, admission_no, created_at, updated_at) VALUES ('${studentId}', '${schoolId}', '${name}', '${cls}', '${gender}', '${admNo}', '${nowISO()}', '${nowISO()}');`);

    // Generate scores for subjects
    const scoreData: Record<string, any> = {};
    for (const sub of subjects) {
      const ca1 = Math.floor(Math.random() * 11);
      const ca2 = Math.floor(Math.random() * 11);
      const exam = Math.floor(Math.random() * 61) + 20; // 20-80
      scoreData[sub] = { ca1, ca2, exam };
    }
    
    sql.push(`INSERT OR REPLACE INTO score_sheets (id, school_id, student_id, data, created_at, updated_at) VALUES ('${generateId()}', '${schoolId}', '${studentId}', '${JSON.stringify(scoreData)}', '${nowISO()}', '${nowISO()}');`);
  }

  const outPath = path.join(__dirname, '..', 'demo-seed.sql');
  fs.writeFileSync(outPath, sql.join('\n'));
  console.log(`Generated ${sql.length} SQL statements to ${outPath}`);
}

run().catch(console.error);
