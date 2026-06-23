const fs = require('fs');
const file = 'C:/Users/hephz/Documents/CODEBASE/edureport-ng/edureport-ng-next/functions/api/[[route]].ts';
let content = fs.readFileSync(file, 'utf8');

const oldCode = `  headers.set("etag", object.httpEtag);
  headers.set("Access-Control-Allow-Origin", origin);
  headers.set("Access-Control-Allow-Credentials", "true");
  
  let downloadFilename = key.split('/').pop() || "download";
  
  // If the file key ends with .bin, but has a different content type, force the download filename to be .docx
  // so that the user gets the right extension on their computer.`;

const newCode = `  headers.set("etag", object.httpEtag);
  headers.set("Access-Control-Allow-Origin", origin);
  headers.set("Access-Control-Allow-Credentials", "true");
  
  let downloadFilename = key.split('/').pop() || "download";
  
  // Enforce correct Content-Type based on extension to prevent WPS Office corruption errors
  if (downloadFilename.endsWith('.docx')) {
    headers.set("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
  } else if (downloadFilename.endsWith('.pdf')) {
    headers.set("Content-Type", "application/pdf");
  } else if (downloadFilename.endsWith('.doc')) {
    headers.set("Content-Type", "application/msword");
  } else if (downloadFilename.endsWith('.xls')) {
    headers.set("Content-Type", "application/vnd.ms-excel");
  } else if (downloadFilename.endsWith('.xlsx')) {
    headers.set("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  }
  
  // If the file key ends with .bin, but has a different content type, force the download filename to be .docx
  // so that the user gets the right extension on their computer.`;

content = content.replace(oldCode, newCode);
fs.writeFileSync(file, content);
console.log("Done");
