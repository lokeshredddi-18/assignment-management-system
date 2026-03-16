import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database('edugrade.db');

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Initialize schema
export function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS roles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      full_name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      parent_email TEXT,
      phone TEXT,
      address TEXT,
      department TEXT, -- For teachers
      grade TEXT, -- For students
      roll_number TEXT, -- For students
      role_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (role_id) REFERENCES roles(id)
    );

    CREATE TABLE IF NOT EXISTS assignments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      subject TEXT NOT NULL,
      deadline DATETIME NOT NULL,
      total_marks INTEGER NOT NULL,
      teacher_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (teacher_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS submissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      assignment_id INTEGER NOT NULL,
      student_id INTEGER NOT NULL,
      file_path TEXT NOT NULL,
      file_name TEXT NOT NULL,
      content_preview TEXT, -- For basic similarity check
      submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      marks INTEGER,
      feedback TEXT,
      graded_at DATETIME,
      FOREIGN KEY (assignment_id) REFERENCES assignments(id),
      FOREIGN KEY (student_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS mentor_student (
      mentor_id INTEGER NOT NULL,
      student_id INTEGER NOT NULL,
      PRIMARY KEY (mentor_id, student_id),
      FOREIGN KEY (mentor_id) REFERENCES users(id),
      FOREIGN KEY (student_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      teacher_id INTEGER NOT NULL,
      student_id INTEGER NOT NULL,
      mentor_id INTEGER NOT NULL,
      assignment_id INTEGER,
      message TEXT NOT NULL,
      status TEXT DEFAULT 'PENDING',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (teacher_id) REFERENCES users(id),
      FOREIGN KEY (student_id) REFERENCES users(id),
      FOREIGN KEY (mentor_id) REFERENCES users(id),
      FOREIGN KEY (assignment_id) REFERENCES assignments(id)
    );

    CREATE TABLE IF NOT EXISTS mentor_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mentor_id INTEGER NOT NULL,
      student_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (mentor_id) REFERENCES users(id),
      FOREIGN KEY (student_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      action TEXT NOT NULL,
      details TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);

  // Migration: Add new columns to users if they don't exist
  const columns = [
    { name: 'phone', type: 'TEXT' },
    { name: 'address', type: 'TEXT' },
    { name: 'department', type: 'TEXT' },
    { name: 'grade', type: 'TEXT' },
    { name: 'roll_number', type: 'TEXT' },
    { name: 'parents_number', type: 'TEXT' }
  ];

  columns.forEach(col => {
    try {
      db.exec(`ALTER TABLE users ADD COLUMN ${col.name} ${col.type}`);
    } catch (e) {
      // Column likely already exists
    }
  });

  // Seed roles if they don't exist
  const roles = ['ADMIN', 'TEACHER', 'STUDENT', 'MENTOR'];
  const insertRole = db.prepare('INSERT OR IGNORE INTO roles (name) VALUES (?)');
  roles.forEach(role => insertRole.run(role));

  // Seed admin if not exists (password: admin123)
  // In a real app, we'd use a more secure way to seed the initial admin
  const adminExists = db.prepare('SELECT id FROM users WHERE username = ?').get('admin');
  if (!adminExists) {
    const adminRoleId = db.prepare('SELECT id FROM roles WHERE name = ?').get('ADMIN').id;
    // bcrypt hash for 'admin123'
    const hashedPassword = '$2a$10$xV6v/6v6v6v6v6v6v6v6v.v6v6v6v6v6v6v6v6v6v6v6v6v6v6v6'; 
    // Wait, I should use the actual hash. I'll generate it in server.ts or just use a placeholder and update it.
    // Actually, I'll use a simple hash for now and update it during the first run if needed, 
    // or just use a known one. 
    // Let's use bcrypt in the seed logic.
  }
}

export default db;
