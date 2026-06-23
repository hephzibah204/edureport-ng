const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'src/components/reports');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx'));

const replacements = [
  / \|\| 'No comments provided.'/g,
  / \|\| "SUCCESS THROUGH HARDWORK"/g,
  / \|\| "Rigasa, Kaduna."/g,
  / \|\| 'MALE'/g,
  / \|\| "02-Feb-2004"/g,
  / \|\| "SCRABBLE, DEBATE"/g,
  / \|\| 134/g,
  / \|\| 130/g,
  / \|\| 4/g,
  / \|\| "04\/04\/2026"/g,
  / \|\| "04\/09\/2026"/g,
  / \|\| "1st"/g,
  / \|\| 21/g,
  / \|\| 'F'/g,
  / \|\| '8th'/g,
  / \|\| 'Good'/g,
  / \|\| `\$\{student\.name\} is a diligent, studious student and always funny\.`/g,
  / \|\| "MR ADIGUN TIMILEYIN"/g,
  / \|\| "A Very Good Result!!.. Keep it Up!"/g,
  / \|\| "PROMOTED"/g,
  / \|\| "Wed, 09-September-2026"/g,
  / \|\| "Catch Them Young!"/g,
  / \|\| "Gonin Gora, Kaduna State, Nigeria."/g,
  / \|\| 25/g,
  / \|\| "26th"/g,
  / \|\| 'Fail'/g,
  / \|\| `\$\{student\.name\} is showing average performance, but can do better with more focus\.`/g,
  / \|\| "A fair result. Go through more practice assignments next term."/g,
  / \|\| "Wed, May 03, 2026"/g,
  / \|\| 'N\/A'/g,
  / \|\| 'A very good performance overall.'/g,
  / \|\| 'Great work!'/g,
  / \|\| '-'/g,
  / \|\| 'Keep shining like a star!'/g,
  / \|\| 'A'/g,
  / \|\| "Excellent"/g,
  / \|\| "Excellent performance!"/g,
  / \|\| "Gonin Gora, Kaduna State"/g,
  / \|\| "SUCCESS THROUGH EXCELLENCE"/g,
  / \|\| '..................................................................................................'/g
];

files.forEach(f => {
  const filePath = path.join(dir, f);
  let content = fs.readFileSync(filePath, 'utf8');
  replacements.forEach(regex => {
    content = content.replace(regex, '');
  });
  
  // also fix some objects:
  content = content.replace(/\|\| \{ opened: 134, present: 130, absent: 4 \}/g, '|| { opened: 0, present: 0, absent: 0 }');
  
  fs.writeFileSync(filePath, content);
  console.log(`Updated ${f}`);
});
