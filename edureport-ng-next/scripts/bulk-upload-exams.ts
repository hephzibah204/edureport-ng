import fs from 'fs';
import path from 'path';

// Configuration
const EXAMS_DIR = 'C:\\Users\\hephz\\Documents\\CODEBASE\\edureport-ng\\Exam Questions';
const BASE_URL = 'https://6363e108.edureport-ng.pages.dev';

// Function to recursively get all files in a directory
function getAllFiles(dirPath: string, arrayOfFiles: string[] = []) {
  const files = fs.readdirSync(dirPath);

  files.forEach(function(file) {
    if (fs.statSync(dirPath + "/" + file).isDirectory()) {
      arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
    } else {
      arrayOfFiles.push(path.join(dirPath, "/", file));
    }
  });

  return arrayOfFiles;
}

async function uploadFile(filePath: string, token: string): Promise<string> {
  const formData = new FormData();
  const fileBuffer = fs.readFileSync(filePath);
  const fileName = path.basename(filePath);
  const contentType = fileName.endsWith('.pdf') ? 'application/pdf' : 
                      fileName.endsWith('.docx') ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' : 
                      'application/msword';
                      
  const fileBlob = new Blob([fileBuffer], { type: contentType });
  formData.append('file', fileBlob, fileName);
  formData.append('filename', fileName);
  
  const response = await fetch(`${BASE_URL}/api/upload`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });
  
  if (!response.ok) {
    const err = await response.text();
    throw new Error(err);
  }
  
  const data = await response.json() as any;
  return data.url;
}

async function importExam(examData: any, token: string) {
  const response = await fetch(`${BASE_URL}/api/ai/exam/bulk-import-document`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(examData)
  });
  
  if (!response.ok) {
    const err = await response.text();
    throw new Error(err);
  }
  
  return await response.json();
}

// Map folder names to standard class levels
function parseClassLevel(folderStr: string): string {
  const str = folderStr.toUpperCase();
  if (str.includes('JSS') || str.includes('J S S')) {
    if (str.includes('1')) return 'JSS 1';
    if (str.includes('2')) return 'JSS 2';
    if (str.includes('3')) return 'JSS 3';
    return 'JSS';
  }
  if (str.includes('SS') || str.includes('S S')) {
    if (str.includes('1')) return 'SS 1';
    if (str.includes('2')) return 'SS 2';
    if (str.includes('3')) return 'SS 3';
    return 'SS';
  }
  if (str.includes('PRIMARY') || str.includes('BASIC')) {
    if (str.includes('1')) return 'Primary 1';
    if (str.includes('2')) return 'Primary 2';
    if (str.includes('3')) return 'Primary 3';
    if (str.includes('4')) return 'Primary 4';
    if (str.includes('5')) return 'Primary 5';
    if (str.includes('6')) return 'Primary 6';
    return 'Primary';
  }
  if (str.includes('NURSERY')) {
    if (str.includes('1')) return 'Nursery 1';
    if (str.includes('2')) return 'Nursery 2';
    if (str.includes('3')) return 'Nursery 3';
    return 'Nursery';
  }
  return folderStr;
}

// Map folder names to term
function parseTerm(folderStr: string): string {
  const str = folderStr.toLowerCase();
  if (str.includes('first') || str.includes('1st')) return '1st Term';
  if (str.includes('second') || str.includes('2nd')) return '2nd Term';
  if (str.includes('third') || str.includes('3rd')) return '3rd Term';
  return '1st Term'; // default
}

async function main() {
  const { SignJWT } = require('jose');
  const secret = new TextEncoder().encode('edureport-ng-default-secret-change-in-production-min-32-chars!');
  const token = await new SignJWT({
    userId: '0082cb3a-8953-4348-9842-fc5c77763706',
    email: 'trustjesusmedia@gmail.com',
    role: 'SCHOOL',
    schoolId: '4c1f2fd2-e09f-4dd7-bd76-1055d5b16901'
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setIssuer('edureport-ng')
    .setExpirationTime('7d')
    .sign(secret);
  if (!token) {
    console.error('Please set ADMIN_TOKEN environment variable');
    process.exit(1);
  }

  console.log('Scanning directory:', EXAMS_DIR);
  const files = getAllFiles(EXAMS_DIR);
  const docFiles = files.filter(f => f.endsWith('.pdf') || f.endsWith('.doc') || f.endsWith('.docx'));
  
  console.log(`Found ${docFiles.length} document files. Starting upload...`);
  
  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < docFiles.length; i++) {
    const file = docFiles[i];
    const fileName = path.basename(file);
    const parts = file.replace(EXAMS_DIR, '').split(path.sep).filter(Boolean);
    
    // Attempt to parse metadata from the path parts
    // parts could be: [ 'Secondary', 'SS', 'Third Term', 'SS1 3RD TERM EXAM (1)', 'YORUBA.docx' ]
    const joinedPath = parts.join(' ');
    
    const subject = fileName.replace(/\.[^/.]+$/, "").trim(); // remove extension
    const classLevel = parseClassLevel(joinedPath);
    const term = parseTerm(joinedPath);
    
    console.log(`[${i+1}/${docFiles.length}] Processing: ${subject} (${classLevel}, ${term})`);
    
    try {
      // 1. Upload to R2
      const fileUrl = await uploadFile(file, token);
      
      // 2. Insert into DB
      await importExam({
        subject,
        classLevel,
        term,
        fileUrl,
        isShared: true,
        examType: 'Terminal Exam'
      }, token);
      
      console.log(`  -> Success! URL: ${fileUrl}`);
      successCount++;
    } catch (err: any) {
      const errMsg = err.response?.data?.error?.message || err.response?.data || err.message;
      console.error(`  -> Failed: ${errMsg}`);
      failCount++;
    }
  }
  
  console.log(`\nFinished! Success: ${successCount}, Failed: ${failCount}`);
}

main().catch(console.error);
