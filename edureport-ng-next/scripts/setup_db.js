const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'local.sqlite');
const sqlPath = path.join(__dirname, '../php-backend/migrations/sqlite_init.sql');

// Delete existing db if any
if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);

const db = new Database(dbPath);
const sql = fs.readFileSync(sqlPath, 'utf-8');

try {
  db.exec(sql);
  console.log('Database initialized successfully at', dbPath);
} catch (e) {
  console.error('Error executing SQL:', e);
}
db.close();
