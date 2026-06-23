const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
function generateId() {
  return crypto.randomBytes(16).toString('hex');
}
function getFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const stat = fs.statSync(path.join(dir, file));
    if (stat.isDirectory()) {
      getFiles(path.join(dir, file), fileList);
    } else if (file.endsWith('.docx')) {
      fileList.push(path.join(dir, file));
    }
  }
  return fileList;
}

const EXAM_DIR = path.resolve('../Exam Questions');
const files = getFiles(EXAM_DIR);

let sql = '';
let bat = '';

files.forEach(file => {
  const relativePath = path.relative(EXAM_DIR, file);
  const parts = relativePath.split(path.sep);
  if (parts.length < 3) return;
  
  const classLevel = parts[0];
  const term = parts[1];
  const subject = path.basename(parts[parts.length - 1], '.docx');
  
  const key = Date.now() + '-' + Math.random().toString(36).substring(2, 8) + '.docx';
  const fileUrl = '/api/files/' + key;
  const id = 'exam-' + generateId();
  
  // Notice we use school_id = 'default' or whatever the production uses. Let's see the local DB, earlier we used `session.schoolId` which could be anything. We should just let it be empty or default. Actually, earlier it was session.schoolId!. 
  // Let's check `users` to see if there's a school_id. The user schema has school_id. 
  // Let's just insert 'school-1' or whatever. Or NULL if allowed.
  // Wait, in `handleBulkImportDocumentExam` we use `session.schoolId!`. 
  // Wait! Production DB school_id is NOT NULL in `exams`! (cid 1: school_id TEXT notnull 1). So I must provide a school_id.
  
  sql += `INSERT INTO exams (id, school_id, subject, class_level, topic, questions, term, session, exam_type, question_type, source_mode, duration, file_url, is_shared, created_at, updated_at) VALUES ('${id}', '4c1f2fd2-e09f-4dd7-bd76-1055d5b16901', '${subject.replace(/'/g, "''")}', '${classLevel.replace(/'/g, "''")}', 'Bulk Imported Exam Document', '[]', '${term.replace(/'/g, "''")}', '2025/2026', 'Terminal Exam', 'document', 'document', '1 Hour', '${fileUrl}', 1, datetime('now'), datetime('now'));\n`;
  
  bat += `call npx wrangler r2 object put "edureport-bucket/${key}" --file="${file}" --remote\n`;
});

fs.writeFileSync('imports.sql', sql);
fs.writeFileSync('upload.bat', bat);
console.log(`Generated imports.sql and upload.bat for ${files.length} files`);
