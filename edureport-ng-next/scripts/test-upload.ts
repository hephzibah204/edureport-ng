import fs from 'fs';
import path from 'path';

const BASE_URL = 'https://edureport-ng.pages.dev';

async function testUpload(token: string) {
  const filePath = 'C:/Users/hephz/Documents/CODEBASE/edureport-ng/Exam Questions/Secondary/JSS/First Term/JSS1 IST TERM Exam questions/AGRICULTURAL SCIENCE EXAMINATION.docx';
  const formData = new FormData();
  const fileBuffer = fs.readFileSync(filePath);
  const fileName = path.basename(filePath);
  
  // Try using global File object
  const file = new File([fileBuffer], fileName, { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
  formData.append('file', file);
  formData.append('filename', fileName);
  
  console.log('Uploading file of size:', file.size);
  
  const response = await fetch(`${BASE_URL}/api/upload`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });
  
  const data = await response.json() as any;
  console.log('Upload response:', data);
  
  // Now fetch it back
  if (data.url) {
    const dlResponse = await fetch(`${BASE_URL}${data.url}`);
    const arrayBuffer = await dlResponse.arrayBuffer();
    console.log('Downloaded size:', arrayBuffer.byteLength);
  }
}

// Read token
const dbRows = require('child_process').execSync('npx wrangler d1 execute edureport-db --remote --command="SELECT * FROM sessions LIMIT 1" --json').toString();
const token = JSON.parse(dbRows)[0].results[0].token;
testUpload(token).catch(console.error);
