const fs = require('fs');
const path = require('path');
const mammoth = require('mammoth');

// Target API server config
const API_BASE_URL = process.argv[2] || process.env.API_BASE_URL || 'http://127.0.0.1:8788';
const ADMIN_EMAIL = process.argv[3] || 'demo@reportsheet.com.ng';
const ADMIN_PASSWORD = process.argv[4] || 'demo';
const EXAM_DIR = 'C:\\Users\\hephz\\Documents\\CODEBASE\\edureport-ng\\Exam Questions';

async function main() {
  console.log('==================================================');
  console.log('  EduReport NG — Local Exam Questions Importer');
  console.log('==================================================');
  console.log(`Target Server: ${API_BASE_URL}`);
  console.log(`Exam Directory: ${EXAM_DIR}\n`);

  if (!fs.existsSync(EXAM_DIR)) {
    console.error(`Error: Exam directory not found at "${EXAM_DIR}"`);
    process.exit(1);
  }

  // 1. Authenticate with local dev server
  console.log('Authenticating as admin...');
  let token = '';
  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
    });
    
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error?.message || 'Login failed');
    }
    
    const data = await res.json();
    token = data.token;
    console.log('Successfully authenticated with server!\n');
  } catch (err) {
    console.error(`Authentication failed: ${err.message}`);
    console.error('Make sure your local dev server (wrangler pages dev) is running on the target port.');
    process.exit(1);
  }

  // 2. Scan for .docx files
  console.log('Scanning directories for exams...');
  const files = findDocxFiles(EXAM_DIR);
  console.log(`Found ${files.length} .docx files to process.\n`);

  if (files.length === 0) {
    console.log('No files to import.');
    return;
  }

  // 3. Process each file
  let successCount = 0;
  let failCount = 0;

  for (const file of files) {
    const relativePath = path.relative(EXAM_DIR, file);
    console.log(`Processing: ${relativePath}`);
    
    // Parse metadata from folder path
    const meta = parsePathMetadata(file);
    if (!meta) {
      console.log(`⚠️  Skipping: Could not determine metadata for path structure.`);
      failCount++;
      continue;
    }

    console.log(`   └─ Metadata: Class: ${meta.classLevel} | Subject: ${meta.subject} | Term: ${meta.term}`);

    try {
      // Extract text from docx
      const result = await mammoth.extractRawText({ path: file });
      const textContent = result.value.trim();
      
      if (!textContent) {
        throw new Error('Document is empty or has no readable text.');
      }

      console.log(`   └─ Parsed ${textContent.length} characters.`);

      // Upload file to bucket
      console.log(`   └─ Uploading physical document to bucket...`);
      const fileData = fs.readFileSync(file);
      const blob = new Blob([fileData], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
      const formData = new FormData();
      formData.append('file', blob, path.basename(file));

      const uploadRes = await fetch(`${API_BASE_URL}/api/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!uploadRes.ok) {
        throw new Error(`Failed to upload file to bucket (${uploadRes.status})`);
      }

      const uploadResult = await uploadRes.json();
      const fileUrl = uploadResult.url;
      console.log(`   └─ Uploaded! URL: ${fileUrl}`);

      console.log(`   └─ Sending text and fileUrl to AI parser...`);

      // Post to Import API
      const res = await fetch(`${API_BASE_URL}/api/ai/exam/import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          subject: meta.subject,
          classLevel: meta.classLevel,
          term: meta.term,
          session: '2025/2026',
          examType: 'Terminal Exam',
          duration: '1 Hour',
          textContent: textContent,
          fileUrl: fileUrl
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message || `API error (${res.status})`);
      }

      const importData = await res.json();
      console.log(`   ✅ Successfully imported! Exam ID: ${importData.id} (${importData.questions?.length || 0} questions parsed)\n`);
      successCount++;
    } catch (err) {
      console.error(`   ❌ Failed to import "${meta.subject}": ${err.message}\n`);
      failCount++;
    }
  }

  console.log('==================================================');
  console.log('  Import Summary');
  console.log('==================================================');
  console.log(`Total Scanned:  ${files.length}`);
  console.log(`Successfully Imported: ${successCount}`);
  console.log(`Failed/Skipped:        ${failCount}`);
  console.log('==================================================');
}

function findDocxFiles(dir, filesList = []) {
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      findDocxFiles(fullPath, filesList);
    } else {
      const ext = path.extname(item).toLowerCase();
      if (ext === '.docx') {
        filesList.push(fullPath);
      } else if (ext === '.doc') {
        console.warn(`⚠️  Warning: Found legacy Word file: "${item}" (skipping). Please convert it to .docx.`);
      }
    }
  }
  return filesList;
}

function parsePathMetadata(filePath) {
  // Normalize path separators
  const normPath = filePath.replace(/\\/g, '/');
  const parts = normPath.split('/');

  // Subject is the filename without extension
  const filename = path.basename(filePath, path.extname(filePath));
  // Clean subject name, removing JSS/SS text from it if present
  let subject = filename
    .replace(/jss\s*\d/gi, '')
    .replace(/ss\s*\d/gi, '')
    .replace(/2nd\s*term/gi, '')
    .replace(/2nd\s*term\s*exam/gi, '')
    .replace(/marking\s*guide/gi, '')
    .replace(/[._-]/g, ' ')
    .trim();
  
  // Titlecase subject
  subject = subject.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
  
  if (subject === 'Maths') subject = 'Mathematics';

  // Determine Term from path
  let term = '2nd Term';
  if (normPath.toLowerCase().includes('first term') || normPath.toLowerCase().includes('1st term')) {
    term = '1st Term';
  } else if (normPath.toLowerCase().includes('third term') || normPath.toLowerCase().includes('3rd term')) {
    term = '3rd Term';
  }

  // Determine Class Level from path (looking for JSS1, JSS2, SS1, etc. in folder names)
  let classLevel = 'JSS 1';
  const match = normPath.match(/(jss\s*\d|ss\s*\d)/i);
  if (match) {
    const rawMatch = match[0].toUpperCase();
    const prefix = rawMatch.startsWith('JSS') ? 'JSS' : 'SS';
    const num = rawMatch.replace(/\D/g, '');
    classLevel = `${prefix} ${num}`;
  } else {
    // Fallback based on other path indicators
    if (normPath.toLowerCase().includes('nursery')) {
      classLevel = 'Nursery';
    } else if (normPath.toLowerCase().includes('primary')) {
      classLevel = 'Primary 1';
    }
  }

  return { subject, classLevel, term };
}

main();
