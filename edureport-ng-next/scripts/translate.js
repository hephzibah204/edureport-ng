const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '../public');
const appDir = path.join(__dirname, '../app');

const filesToTranslate = [
  { file: 'index.html', route: '' }, // root page.tsx
  { file: 'register.html', route: 'register' },
  { file: 'admin.html', route: 'admin' },
  { file: 'teacher.html', route: 'teacher' },
  { file: 'portal.html', route: 'portal' },
  { file: 'exammaker.html', route: 'exammaker' },
  { file: 'app.html', route: 'app' } 
];

filesToTranslate.forEach(({ file, route }) => {
  const filePath = path.join(publicDir, file);
  if (!fs.existsSync(filePath)) {
    console.log(`Skipping ${file}, not found in public/`);
    return;
  }

  const htmlContent = fs.readFileSync(filePath, 'utf-8');

  // Extract <style> block
  const styleMatch = htmlContent.match(/<style>([\s\S]*?)<\/style>/i);
  const styleContent = styleMatch ? styleMatch[1] : '';

  // Extract <body> content
  let bodyContent = '';
  const bodyMatch = htmlContent.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (bodyMatch) {
    bodyContent = bodyMatch[1];
  } else {
    // Fallback if no body tag
    bodyContent = htmlContent;
  }

  // Remove script tags from body to prevent duplicate execution 
  // Next.js dangerouslySetInnerHTML doesn't run scripts easily anyway
  bodyContent = bodyContent.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  // Escape backticks and ${}
  const escapedBody = bodyContent.replace(/`/g, '\\`').replace(/\$/g, '\\$');
  const escapedStyle = styleContent.replace(/`/g, '\\`').replace(/\$/g, '\\$');

  const componentName = file.replace('.html', '').charAt(0).toUpperCase() + file.replace('.html', '').slice(1) + 'Page';

  const tsxContent = `"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ${componentName === 'IndexPage' ? 'HomePage' : componentName}() {
  const router = useRouter();

  useEffect(() => {
    // Basic auth/routing simulation can be added here later
    // Since we are using dangerouslySetInnerHTML, inline scripts won't execute.
    // Full logic will be migrated into this useEffect or React events.
  }, []);

  return (
    <>
      <link rel="stylesheet" href="/shared.css" />
      {/* Inject Extracted Page Styles */}
      <style dangerouslySetInnerHTML={{ __html: \`${escapedStyle}\` }} />
      
      {/* Inject Raw HTML Body */}
      <div dangerouslySetInnerHTML={{ __html: \`${escapedBody}\` }} />
    </>
  );
}
`;

  const routeDir = path.join(appDir, route);
  if (!fs.existsSync(routeDir)) {
    fs.mkdirSync(routeDir, { recursive: true });
  }

  const outPath = path.join(routeDir, 'page.tsx');
  fs.writeFileSync(outPath, tsxContent);
  console.log(`Translated ${file} -> ${route === '' ? 'app/page.tsx' : 'app/' + route + '/page.tsx'}`);
});
