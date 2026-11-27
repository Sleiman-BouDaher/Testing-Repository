const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const dbPath = path.join(__dirname, 'workshops.db');
const db = new Database(dbPath);

// Enforce foreign key constraints
db.pragma('foreign_keys = ON');

// Run schema.sql on every startup (safe/idempotent)
const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
db.exec(schema);

module.exports = db;
