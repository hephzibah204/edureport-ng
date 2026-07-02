const fs = require('fs');
const { execSync } = require('child_process');

const bucketKeys = JSON.parse(fs.readFileSync('C:/Users/hephz/Documents/CODEBASE/temp-r2-list/bucket_list.json', 'utf8'));
const exams = JSON.parse(fs.readFileSync('clean_exams.json', 'utf8'));

// Filter bucket keys to only those in the "Exam Questions/" folder structure
const examFiles = bucketKeys.filter(k => k.startsWith('Exam Questions/') && (k.endsWith('.docx') || k.endsWith('.doc') || k.endsWith('.pdf') || k.endsWith('.rtf')));

console.log(`Found ${examFiles.length} readable exam files in bucket.`);

// Function to normalize strings for comparison
function normalize(str) {
  if (!str) return '';
  return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function matchFile(exam) {
  const normSubject = normalize(exam.subject);
  const normClass = normalize(exam.class_level);
  const normTerm = normalize(exam.term).replace('1st', 'first').replace('2nd', 'second').replace('3rd', 'third');
  
  let bestMatch = null;
  let bestScore = 0;
  
  for (const file of examFiles) {
    const normFile = normalize(file);
    
    // Exact text match in filename or path is too strict, let's use a scoring system
    let score = 0;
    
    // Check subject
    const subjectWords = exam.subject.toLowerCase().split(/\W+/).filter(w => w.length > 2);
    let subjectMatch = false;
    for (const w of subjectWords) {
      if (file.toLowerCase().includes(w)) {
        score += 10;
        subjectMatch = true;
      }
    }
    
    // Check class
    if (normFile.includes(normClass) || (exam.class_level.includes('JSS') && normFile.includes('jss')) || (exam.class_level.includes('SS') && normFile.includes('ss')) || (exam.class_level.includes('Basic') && normFile.includes('basic'))) {
      score += 20;
    }
    
    // Check term
    if (normFile.includes(normTerm) || (exam.term.includes('1st') && normFile.includes('1st')) || (exam.term.includes('2nd') && normFile.includes('2nd')) || (exam.term.includes('3rd') && normFile.includes('3rd'))) {
      score += 20;
    }
    
    if (subjectMatch && score > bestScore) {
      bestScore = score;
      bestMatch = file;
    }
  }
  
  return bestMatch;
}

let matched = 0;
let queries = [];

for (const exam of exams) {
  // if it already has the new path, skip
  if (exam.file_url && exam.file_url.includes('Exam Questions/')) {
    continue;
  }
  
  const match = matchFile(exam);
  if (match) {
    matched++;
    const newFileUrl = `/api/files/${encodeURIComponent(match).replace(/%2F/g, '/')}`;
    queries.push(`UPDATE exams SET file_url = '${newFileUrl.replace(/'/g, "''")}' WHERE id = '${exam.id}';`);
  } else {
    // console.log(`No match for: ${exam.subject} - ${exam.class_level} - ${exam.term}`);
  }
}

console.log(`Matched ${matched} out of ${exams.length} exams.`);

if (queries.length > 0) {
  fs.writeFileSync('update-exams.sql', queries.join('\n'));
  console.log('Saved queries to update-exams.sql');
}
