const fs = require('fs');

const now = new Date().toISOString();

// Helper to escape SQL strings
const esc = (str) => typeof str === 'string' ? `'${str.replace(/'/g, "''")}'` : 'NULL';

let sql = '';

const superAdminId = 'super-admin-id';
const schoolUserId = 'demo-user-id';
const schoolId = 'demo-school-id';
const teacherUserId = 'demo-teacher-id';
const parentUserId = 'demo-parent-id';

// CLEANUP PREVIOUS DEMO DATA
sql += `-- CLEANUP\n`;
sql += `DELETE FROM student_links WHERE school_id = ${esc(schoolId)};\n`;
sql += `DELETE FROM score_sheets WHERE school_id = ${esc(schoolId)};\n`;
sql += `DELETE FROM report_extras WHERE school_id = ${esc(schoolId)};\n`;
sql += `DELETE FROM attendance_marks WHERE school_id = ${esc(schoolId)};\n`;
sql += `DELETE FROM attendance_sessions WHERE school_id = ${esc(schoolId)};\n`;
sql += `DELETE FROM students WHERE school_id = ${esc(schoolId)};\n`;
sql += `DELETE FROM teacher_class_assignments WHERE school_id = ${esc(schoolId)};\n`;
sql += `DELETE FROM teacher_profiles WHERE school_id = ${esc(schoolId)};\n`;
sql += `DELETE FROM schools WHERE id = ${esc(schoolId)};\n`;
sql += `DELETE FROM users WHERE id IN (${esc(superAdminId)}, ${esc(schoolUserId)}, ${esc(teacherUserId)}, ${esc(parentUserId)});\n\n`;

// 1. Create Users
const pwdHash = '$2a$10$X8O.U/GgJd2d.8pW/X6sMeQ3A7P3A/L4Zq8B6m1g8aE8W0Q7.Gz3S'; // password123

sql += `-- SEED DATA FOR EDUREPORT NG\n`;
// Super Admin
sql += `INSERT INTO users (id, email, display_name, password_hash, role, status, created_at, force_password_change) VALUES (${esc(superAdminId)}, 'admin@report.com', 'Super Admin', ${esc(pwdHash)}, 'ADMIN', 'ACTIVE', ${esc(now)}, 0);\n`;
// School Admin
sql += `INSERT INTO users (id, email, display_name, password_hash, role, status, created_at, force_password_change) VALUES (${esc(schoolUserId)}, 'demo@report.com', 'Demo Admin', ${esc(pwdHash)}, 'SCHOOL', 'ACTIVE', ${esc(now)}, 0);\n`;
// Teacher
sql += `INSERT INTO users (id, email, display_name, password_hash, role, status, created_at) VALUES (${esc(teacherUserId)}, 'teacher@report.com', 'Mr. Olumide Johnson', ${esc(pwdHash)}, 'TEACHER', 'ACTIVE', ${esc(now)});\n`;
// Parent
sql += `INSERT INTO users (id, email, display_name, password_hash, role, status, created_at) VALUES (${esc(parentUserId)}, 'parent@report.com', 'Mrs. Amina Abubakar', ${esc(pwdHash)}, 'PARENT', 'ACTIVE', ${esc(now)});\n`;

// 2. Create School
const subjects = JSON.stringify(['Mathematics', 'English Language', 'Basic Science', 'Social Studies', 'Civic Education', 'Agricultural Science', 'Business Studies', 'Computer Studies', 'Home Economics', 'Physical Health Education']);
const grades = JSON.stringify([
  { min: 70, max: 100, grade: 'A', remark: 'Excellent' },
  { min: 60, max: 69, grade: 'B', remark: 'Very Good' },
  { min: 50, max: 59, grade: 'C', remark: 'Good' },
  { min: 45, max: 49, grade: 'D', remark: 'Fair' },
  { min: 40, max: 44, grade: 'E', remark: 'Pass' },
  { min: 0, max: 39, grade: 'F', remark: 'Fail' }
]);

sql += `INSERT INTO schools (id, owner_id, name, abbr, address, contact, session, term, ca1_max, ca2_max, exam_max, subjects, grades, plan, created_at, updated_at) VALUES (${esc(schoolId)}, ${esc(schoolUserId)}, 'Global Excellence Academy', 'GEA', '123 Education Way, Lagos, Nigeria', '08037000456', '2023/2024', 'First Term', 10, 10, 80, ${esc(subjects)}, ${esc(grades)}, 'LIFETIME', ${esc(now)}, ${esc(now)});\n`;

// 3. Profiles
sql += `INSERT INTO teacher_profiles (id, user_id, school_id, display_name, created_at, updated_at) VALUES ('tp1', ${esc(teacherUserId)}, ${esc(schoolId)}, 'Mr. Olumide Johnson', ${esc(now)}, ${esc(now)});\n`;

const classes = ['JSS 1', 'JSS 2', 'JSS 3', 'SS 1', 'SS 2', 'SS 3'];
const firstNames = ['Chidi', 'Oluwaseun', 'Amina', 'Emeka', 'Fatima', 'Tunde', 'Ngozi', 'Ibrahim', 'Zainab', 'Babatunde', 'Chinelo', 'Musa', 'Aisha', 'Kelechi', 'Yinka', 'Hadiza', 'Obinna', 'Folake', 'Mustapha', 'Uche'];
const lastNames = ['Okonkwo', 'Adeyemi', 'Bello', 'Eze', 'Abubakar', 'Balogun', 'Nnaji', 'Usman', 'Danjuma', 'Olawale', 'Chukwuma', 'Sanni', 'Ibrahim', 'Okafor', 'Lawal', 'Garba', 'Nwosu', 'Adebayo', 'Muhammed', 'Ani'];

let studentCounter = 1;

for (const cls of classes) {
  const assignmentId = `tca-${cls.replace(/\s+/g, '')}`;
  sql += `INSERT INTO teacher_class_assignments (id, school_id, teacher_user_id, class_name, created_at) VALUES (${esc(assignmentId)}, ${esc(schoolId)}, ${esc(teacherUserId)}, ${esc(cls)}, ${esc(now)});\n`;

  for (let i = 1; i <= 50; i++) {
    const studentId = `stu-${cls.replace(/\s+/g, '')}-${i}`;
    const fname = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lname = lastNames[Math.floor(Math.random() * lastNames.length)];
    const name = `${fname} ${lname}`;
    const gender = Math.random() > 0.5 ? 'Female' : 'Male';
    const admNo = `ADM/2023/${studentCounter.toString().padStart(4, '0')}`;
    
    sql += `INSERT INTO students (id, school_id, name, admission_no, gender, class_name, created_at, updated_at) VALUES (${esc(studentId)}, ${esc(schoolId)}, ${esc(name)}, ${esc(admNo)}, ${esc(gender)}, ${esc(cls)}, ${esc(now)}, ${esc(now)});\n`;

    const studentScores = {};
    const parsedSubjects = JSON.parse(subjects);
    for (const sub of parsedSubjects) {
      if (Math.random() > 0.1) {
        studentScores[sub] = {
          ca1: Math.floor(Math.random() * 11),
          ca2: Math.floor(Math.random() * 11),
          exam: Math.floor(Math.random() * 51) + 30
        };
      }
    }
    
    sql += `INSERT INTO score_sheets (id, school_id, student_id, data, created_at, updated_at) VALUES ('score-${studentId}', ${esc(schoolId)}, ${esc(studentId)}, ${esc(JSON.stringify(studentScores))}, ${esc(now)}, ${esc(now)});\n`;

    const traits = {
      punctuality: Math.floor(Math.random() * 3) + 3,
      neatness: Math.floor(Math.random() * 3) + 3,
      honesty: Math.floor(Math.random() * 3) + 3
    };
    const principalComments = [
      'A very brilliant performance. Keep it up.',
      'Excellent result. Consistent effort shown.',
      'Impressive grades. More focus needed in Mathematics.',
      'A good result. You can do better with more practice.',
      'Satisfactory performance. Aim for higher grades next term.'
    ];
    const teacherComments = [
      'A dedicated and hardworking student.',
      'Very active in class activities. Good job.',
      'Strongly motivated and shows great potential.',
      'Well-behaved and respectful student.',
      'Neat and regular in school. Keep it up.'
    ];
    
    const comments = {
      principal: principalComments[Math.floor(Math.random() * principalComments.length)],
      teacher: teacherComments[Math.floor(Math.random() * teacherComments.length)]
    };
    
    sql += `INSERT INTO report_extras (id, school_id, student_id, session, term, attendance, traits, comments, promotion, created_at, updated_at) VALUES ('ext-${studentId}', ${esc(schoolId)}, ${esc(studentId)}, '2023/2024', 'First Term', ${esc((Math.floor(Math.random() * 15) + 85).toString())}, ${esc(JSON.stringify(traits))}, ${esc(JSON.stringify(comments))}, '', ${esc(now)}, ${esc(now)});\n`;

    // Link Parent to first student of first two classes
    if (i === 1 && (cls === 'JSS 1' || cls === 'JSS 2')) {
      const linkId = `link-${studentId}`;
      sql += `INSERT INTO student_links (id, school_id, student_id, user_id, link_type, created_at) VALUES (${esc(linkId)}, ${esc(schoolId)}, ${esc(studentId)}, ${esc(parentUserId)}, 'PARENT', ${esc(now)});\n`;
    }

    studentCounter++;
  }
}

fs.writeFileSync('seed.sql', sql);
console.log(`Generated seed.sql with 4 types of accounts.`);
console.log(`- Super Admin: admin@report.com / password123`);
console.log(`- School Admin: demo@report.com / password123`);
console.log(`- Teacher: teacher@report.com / password123`);
console.log(`- Parent: parent@report.com / password123`);
console.log(`Data: 300 students across 6 classes with scores and report extras.`);
