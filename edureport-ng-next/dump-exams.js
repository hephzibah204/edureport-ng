const { execSync } = require('child_process');
const fs = require('fs');

try {
  let stdout;
  try {
    stdout = execSync('npx wrangler d1 execute edureport-db --remote --command="SELECT id, subject, class_level, term, file_url FROM exams" --json', { encoding: 'utf8' });
  } catch (err) {
    stdout = err.stdout;
  }
  
  // Extract JSON array using regex
  const match = stdout.match(/\[\s*\{[\s\S]*\}\s*\]/);
  if (match) {
    const data = JSON.parse(match[0]);
    if (data[0] && data[0].results) {
      fs.writeFileSync('clean_exams.json', JSON.stringify(data[0].results, null, 2));
      console.log('Successfully saved ' + data[0].results.length + ' exams.');
    } else {
      console.error("No results in data:", JSON.stringify(data));
    }
  } else {
    console.error("No JSON array found in stdout:", stdout);
  }
} catch (e) {
  console.error(e.message);
}
