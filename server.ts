import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import fs from 'fs';
import db, { initDb } from './db.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JWT_SECRET = process.env.JWT_SECRET || 'edugrade-secret-key-2026';
const PORT = 3000;

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOC, and DOCX are allowed.'));
    }
  }
});

async function startServer() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  // Health check route
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  try {
    initDb();
  } catch (error) {
    console.error('Failed to initialize database:', error);
  }

  // Seed initial users if not exists
  const seedUsers = async () => {
    const roles = ['ADMIN', 'TEACHER', 'STUDENT', 'MENTOR'];
    for (const roleName of roles) {
      const role = db.prepare('SELECT id FROM roles WHERE name = ?').get(roleName);
      const username = roleName.toLowerCase();
      const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
      
      if (!user) {
        const hashedPassword = await bcrypt.hash(username + '123', 10);
        db.prepare('INSERT INTO users (username, password, full_name, email, role_id) VALUES (?, ?, ?, ?, ?)')
          .run(username, hashedPassword, `${roleName.charAt(0) + roleName.slice(1).toLowerCase()} User`, `${username}@edugrade.edu`, role.id);
        console.log(`${roleName} user seeded: ${username} / ${username}123`);
      }
    }
  };
  await seedUsers();

  // Middleware for Auth
  const authenticateToken = (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: 'Access denied' });

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) return res.status(403).json({ error: 'Invalid token' });
      req.user = user;
      next();
    });
  };

  const authorize = (roles: string[]) => {
    return (req: any, res: any, next: any) => {
      if (!roles.includes(req.user.role)) {
        return res.status(403).json({ error: 'Unauthorized' });
      }
      next();
    };
  };

  const logAudit = (userId: number | null, action: string, details: string) => {
    db.prepare('INSERT INTO audit_logs (user_id, action, details) VALUES (?, ?, ?)')
      .run(userId, action, details);
  };

  // --- Auth Routes ---
  app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    try {
      const user: any = db.prepare(`
        SELECT u.*, r.name as role 
        FROM users u 
        JOIN roles r ON u.role_id = r.id 
        WHERE u.username = ?
      `).get(username);

      if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      logAudit(user.id, 'LOGIN', 'User logged in successfully');
      res.json({ 
        token, 
        user: { 
          id: user.id, 
          username: user.username, 
          role: user.role, 
          fullName: user.full_name,
          email: user.email,
          phone: user.phone,
          parentsNumber: user.parents_number
        } 
      });
    } catch (error) {
      res.status(500).json({ error: 'Login failed' });
    }
  });

  app.post('/api/auth/register', async (req, res) => {
    const { username, password, fullName, email, role } = req.body;
    
    if (!['STUDENT', 'TEACHER'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role selection' });
    }

    try {
      const existing = db.prepare('SELECT id FROM users WHERE username = ? OR email = ?').get(username, email);
      if (existing) {
        return res.status(400).json({ error: 'Username or email already exists' });
      }

      const roleData = db.prepare('SELECT id FROM roles WHERE name = ?').get(role);
      const hashedPassword = await bcrypt.hash(password, 10);
      
      const result = db.prepare('INSERT INTO users (username, password, full_name, email, role_id) VALUES (?, ?, ?, ?, ?)')
        .run(username, hashedPassword, fullName, email, roleData.id);

      logAudit(Number(result.lastInsertRowid), 'REGISTER', `New ${role} account created: ${username}`);
      res.json({ message: 'Account created successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Registration failed' });
    }
  });

  // --- Admin Routes ---
  app.get('/api/admin/users', authenticateToken, authorize(['ADMIN']), (req, res) => {
    const users = db.prepare(`
      SELECT u.id, u.username, u.full_name as fullName, u.email, r.name as role,
             u.phone, u.address, u.department, u.grade, u.roll_number, u.parents_number as parentsNumber
      FROM users u 
      JOIN roles r ON u.role_id = r.id
    `).all();
    res.json(users);
  });

  app.post('/api/admin/users', authenticateToken, authorize(['ADMIN']), async (req, res) => {
    const { username, password, fullName, email, role, phone, address, department, grade, rollNumber, parentsNumber } = req.body;
    try {
      const roleId = db.prepare('SELECT id FROM roles WHERE name = ?').get(role).id;
      const hashedPassword = await bcrypt.hash(password, 10);
      db.prepare(`
        INSERT INTO users (username, password, full_name, email, role_id, phone, address, department, grade, roll_number, parents_number) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(username, hashedPassword, fullName, email, roleId, phone, address, department, grade, rollNumber, parentsNumber);
      logAudit((req as any).user.id, 'CREATE_USER', `Created user ${username} with role ${role}`);
      res.json({ message: 'User created successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to create user' });
    }
  });

  app.delete('/api/admin/users/:id', authenticateToken, authorize(['ADMIN']), (req, res) => {
    db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
    logAudit((req as any).user.id, 'DELETE_USER', `Deleted user ID ${req.params.id}`);
    res.json({ message: 'User deleted' });
  });

  app.get('/api/admin/mentors', authenticateToken, authorize(['ADMIN']), (req, res) => {
    const mentors = db.prepare(`
      SELECT u.id, u.full_name as full_name 
      FROM users u 
      JOIN roles r ON u.role_id = r.id 
      WHERE r.name = 'MENTOR'
    `).all();
    res.json(mentors);
  });

  app.get('/api/admin/students', authenticateToken, authorize(['ADMIN']), (req, res) => {
    const students = db.prepare(`
      SELECT u.id, u.full_name as full_name 
      FROM users u 
      JOIN roles r ON u.role_id = r.id 
      WHERE r.name = 'STUDENT'
    `).all();
    res.json(students);
  });

  app.post('/api/admin/assign-mentor', authenticateToken, authorize(['ADMIN']), (req, res) => {
    const { mentorId, studentId } = req.body;
    db.prepare('INSERT OR REPLACE INTO mentor_student (mentor_id, student_id) VALUES (?, ?)')
      .run(mentorId, studentId);
    logAudit((req as any).user.id, 'ASSIGN_MENTOR', `Assigned mentor ${mentorId} to student ${studentId}`);
    res.json({ message: 'Mentor assigned' });
  });

  // --- Teacher Routes ---
  app.get('/api/teacher/students', authenticateToken, authorize(['TEACHER']), (req, res) => {
    const students = db.prepare(`
      SELECT u.id, u.full_name as fullName, u.email,
             (SELECT COUNT(*) FROM submissions WHERE student_id = u.id) as submissionCount
      FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE r.name = 'STUDENT'
    `).all();
    res.json(students);
  });

  app.get('/api/teacher/assignments', authenticateToken, authorize(['TEACHER']), (req, res) => {
    const assignments = db.prepare('SELECT * FROM assignments WHERE teacher_id = ?').all((req as any).user.id);
    res.json(assignments);
  });

  app.post('/api/teacher/assignments', authenticateToken, authorize(['TEACHER']), (req, res) => {
    const { title, description, subject, deadline, totalMarks } = req.body;
    db.prepare('INSERT INTO assignments (title, description, subject, deadline, total_marks, teacher_id) VALUES (?, ?, ?, ?, ?, ?)')
      .run(title, description, subject, deadline, totalMarks, (req as any).user.id);
    logAudit((req as any).user.id, 'CREATE_ASSIGNMENT', `Created assignment: ${title}`);
    res.json({ message: 'Assignment created' });
  });

  app.get('/api/teacher/submissions/:assignmentId', authenticateToken, authorize(['TEACHER']), (req, res) => {
    const assignment = db.prepare('SELECT * FROM assignments WHERE id = ?').get(req.params.assignmentId);
    const submissions = db.prepare(`
      SELECT s.*, u.full_name as student_name 
      FROM submissions s 
      JOIN users u ON s.student_id = u.id 
      WHERE s.assignment_id = ?
    `).all(req.params.assignmentId);
    res.json({ assignment, submissions });
  });

  app.post('/api/teacher/evaluate', authenticateToken, authorize(['TEACHER']), (req, res) => {
    const { submissionId, marks, feedback } = req.body;
    db.prepare('UPDATE submissions SET marks = ?, feedback = ?, graded_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(marks, feedback, submissionId);
    logAudit((req as any).user.id, 'EVALUATE_SUBMISSION', `Evaluated submission ID ${submissionId}`);
    res.json({ message: 'Evaluation saved' });
  });

  // --- Student Routes ---
  app.get('/api/student/assignments', authenticateToken, authorize(['STUDENT']), (req, res) => {
    const assignments = db.prepare(`
      SELECT a.*, s.marks, s.feedback, s.submitted_at, s.graded_at, s.id as submission_id
      FROM assignments a
      LEFT JOIN submissions s ON a.id = s.assignment_id AND s.student_id = ?
    `).all((req as any).user.id);
    res.json(assignments);
  });

  app.post('/api/student/submit', authenticateToken, authorize(['STUDENT']), upload.single('file'), (req, res) => {
    const { assignmentId } = req.body;
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No file uploaded' });

    // Basic similarity check (plagiarism) - just checking if content matches any other submission for same assignment
    // In a real app, we'd read the file content. Here we'll just simulate it or use filename as a proxy for demo.
    const existing = db.prepare('SELECT id FROM submissions WHERE assignment_id = ? AND file_name = ? AND student_id != ?')
      .get(assignmentId, file.originalname, (req as any).user.id);
    
    const similarityNote = existing ? 'Warning: Similar file name detected in another submission.' : '';

    // Check if resubmission
    const prev = db.prepare('SELECT id FROM submissions WHERE assignment_id = ? AND student_id = ?').get(assignmentId, (req as any).user.id);
    
    if (prev) {
      db.prepare('UPDATE submissions SET file_path = ?, file_name = ?, submitted_at = CURRENT_TIMESTAMP WHERE id = ?')
        .run(file.path, file.originalname, prev.id);
    } else {
      db.prepare('INSERT INTO submissions (assignment_id, student_id, file_path, file_name) VALUES (?, ?, ?, ?)')
        .run(assignmentId, (req as any).user.id, file.path, file.originalname);
    }

    logAudit((req as any).user.id, 'SUBMIT_ASSIGNMENT', `Submitted assignment ID ${assignmentId}`);
    res.json({ message: 'Submission successful', similarityNote });
  });

  // --- Mentor Routes ---
  app.get('/api/mentor/students', authenticateToken, authorize(['MENTOR']), (req, res) => {
    const students = db.prepare(`
      SELECT 
        u.id, 
        u.full_name as fullName, 
        u.email,
        (
          SELECT COUNT(*) 
          FROM assignments a
          LEFT JOIN submissions s ON a.id = s.assignment_id AND s.student_id = u.id
          WHERE (s.submitted_at > a.deadline) OR (s.id IS NULL AND a.deadline < datetime('now'))
        ) as lateCount
      FROM users u 
      JOIN mentor_student ms ON u.id = ms.student_id 
      WHERE ms.mentor_id = ?
    `).all((req as any).user.id);
    res.json(students);
  });

  app.post('/api/mentor/add-student', authenticateToken, authorize(['MENTOR']), (req, res) => {
    const { email } = req.body;
    const mentorId = (req as any).user.id;

    if (!email || !email.toLowerCase().endsWith('@gmail.com')) {
      return res.status(400).json({ error: 'Please enter a valid Gmail address (ending in @gmail.com)' });
    }

    try {
      // Find student by email
      const student: any = db.prepare(`
        SELECT u.id, u.full_name as fullName, r.name as role 
        FROM users u 
        JOIN roles r ON u.role_id = r.id 
        WHERE u.email = ?
      `).get(email);

      if (!student) {
        return res.status(404).json({ error: 'Student with this email not found' });
      }

      if (student.role !== 'STUDENT') {
        return res.status(400).json({ error: 'This user is not a student' });
      }

      // Link mentor and student
      db.prepare('INSERT OR IGNORE INTO mentor_student (mentor_id, student_id) VALUES (?, ?)')
        .run(mentorId, student.id);

      logAudit(mentorId, 'MENTOR_ADD_STUDENT', `Mentor added student ${email} (ID: ${student.id})`);
      res.json({ message: 'Student added successfully', studentName: student.fullName });
    } catch (error) {
      res.status(500).json({ error: 'Failed to add student' });
    }
  });

  app.get('/api/mentor/student-performance/:studentId', authenticateToken, authorize(['MENTOR']), (req, res) => {
    const performance = db.prepare(`
      SELECT a.title, a.subject, s.marks, a.total_marks, s.submitted_at, s.graded_at, a.deadline
      FROM assignments a
      JOIN submissions s ON a.id = s.assignment_id
      WHERE s.student_id = ? AND s.marks IS NOT NULL
    `).all(req.params.studentId);
    res.json(performance);
  });

  app.post('/api/mentor/send-message', authenticateToken, authorize(['MENTOR']), (req, res) => {
    const { studentId, content } = req.body;
    const mentorId = (req as any).user.id;
    try {
      db.prepare('INSERT INTO mentor_messages (mentor_id, student_id, content) VALUES (?, ?, ?)')
        .run(mentorId, studentId, content);
      logAudit(mentorId, 'MENTOR_MESSAGE_SENT', `Mentor sent message to student ID ${studentId}`);
      res.json({ message: 'Message sent successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to send message' });
    }
  });

  app.get('/api/student/unread-messages', authenticateToken, authorize(['STUDENT']), (req, res) => {
    const studentId = (req as any).user.id;
    const messages = db.prepare(`
      SELECT m.*, u.full_name as mentor_name
      FROM mentor_messages m
      JOIN users u ON m.mentor_id = u.id
      WHERE m.student_id = ? AND m.is_read = 0
      ORDER BY m.created_at DESC
    `).all(studentId);
    res.json(messages);
  });

  app.post('/api/student/mark-read/:id', authenticateToken, authorize(['STUDENT']), (req, res) => {
    const messageId = req.params.id;
    const studentId = (req as any).user.id;
    try {
      db.prepare('UPDATE mentor_messages SET is_read = 1 WHERE id = ? AND student_id = ?')
        .run(messageId, studentId);
      res.json({ message: 'Message marked as read' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to mark message as read' });
    }
  });

  app.get('/api/student/assignment-stats', authenticateToken, authorize(['STUDENT']), (req, res) => {
    const studentId = (req as any).user.id;
    try {
      const stats = db.prepare(`
        SELECT 
          (SELECT COUNT(*) FROM assignments) as total,
          (SELECT COUNT(*) FROM submissions WHERE student_id = ?) as submitted,
          (SELECT COUNT(*) FROM submissions WHERE student_id = ? AND graded_at IS NOT NULL) as graded,
          (
            SELECT COUNT(*) 
            FROM assignments a
            LEFT JOIN submissions s ON a.id = s.assignment_id AND s.student_id = ?
            WHERE (s.submitted_at > a.deadline) OR (s.id IS NULL AND a.deadline < datetime('now'))
          ) as lateCount
      `).get(studentId, studentId, studentId) as any;

      const pending = Math.max(0, (stats?.total || 0) - (stats?.submitted || 0));
      
      res.json({
        pending,
        submitted: stats?.submitted || 0,
        graded: stats?.graded || 0,
        lateCount: stats?.lateCount || 0
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to fetch assignment stats' });
    }
  });

  // --- Analytics & Export ---
  app.get('/api/analytics/teacher-summary', authenticateToken, authorize(['TEACHER']), (req, res) => {
    const summary = db.prepare(`
      SELECT 
        a.title, 
        COUNT(s.id) as submission_count,
        AVG(s.marks) as avg_marks,
        a.total_marks
      FROM assignments a
      LEFT JOIN submissions s ON a.id = s.assignment_id
      WHERE a.teacher_id = ?
      GROUP BY a.id
    `).all((req as any).user.id);
    res.json(summary);
  });

  app.get('/api/export/marks/:assignmentId', authenticateToken, authorize(['TEACHER', 'ADMIN']), (req, res) => {
    const data = db.prepare(`
      SELECT u.full_name, u.email, s.marks, a.total_marks, s.submitted_at
      FROM submissions s
      JOIN users u ON s.student_id = u.id
      JOIN assignments a ON s.assignment_id = a.id
      WHERE s.assignment_id = ?
    `).all(req.params.assignmentId);

    let csv = 'Student Name,Email,Marks,Total Marks,Submitted At\n';
    data.forEach((row: any) => {
      csv += `${row.full_name},${row.email},${row.marks || 'N/A'},${row.total_marks},${row.submitted_at}\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=marks_assignment_${req.params.assignmentId}.csv`);
    res.send(csv);
  });

  app.get('/api/export/assignments-summary', authenticateToken, authorize(['TEACHER']), (req, res) => {
    const teacherId = (req as any).user.id;
    const data = db.prepare(`
      SELECT 
        a.title, 
        a.subject, 
        a.deadline, 
        a.total_marks,
        COUNT(s.id) as submission_count
      FROM assignments a
      LEFT JOIN submissions s ON a.id = s.assignment_id
      WHERE a.teacher_id = ?
      GROUP BY a.id
      ORDER BY a.created_at DESC
    `).all(teacherId);

    let csv = 'Title,Subject,Deadline,Total Marks,Submission Count\n';
    data.forEach((row: any) => {
      csv += `"${row.title}","${row.subject}","${row.deadline}",${row.total_marks},${row.submission_count}\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=assignments_summary.csv');
    res.send(csv);
  });

  app.get('/api/audit-logs', authenticateToken, authorize(['ADMIN']), (req, res) => {
    const logs = db.prepare(`
      SELECT l.*, u.username 
      FROM audit_logs l 
      LEFT JOIN users u ON l.user_id = u.id 
      ORDER BY l.timestamp DESC LIMIT 100
    `).all();
    res.json(logs);
  });

  // --- New Dashboard & Reporting Routes ---
  app.get('/api/dashboard/members', authenticateToken, (req, res) => {
    const stats = db.prepare(`
      SELECT r.name as role, COUNT(u.id) as count
      FROM roles r
      LEFT JOIN users u ON r.id = u.role_id
      GROUP BY r.id
    `).all();
    res.json(stats);
  });

  app.get('/api/teacher/student-assignment-status/:assignmentId', authenticateToken, authorize(['TEACHER']), (req, res) => {
    const assignmentId = req.params.assignmentId;
    const assignment: any = db.prepare('SELECT deadline FROM assignments WHERE id = ?').get(assignmentId);
    
    if (!assignment) return res.status(404).json({ error: 'Assignment not found' });

    // Get all students and their submission status for this assignment
    const status = db.prepare(`
      SELECT 
        u.id as student_id,
        u.full_name,
        u.email,
        s.submitted_at,
        CASE 
          WHEN s.submitted_at IS NULL THEN 'PENDING'
          WHEN s.submitted_at > ? THEN 'LATE'
          ELSE 'ON_TIME'
        END as status,
        ms.mentor_id
      FROM users u
      JOIN roles r ON u.role_id = r.id
      LEFT JOIN submissions s ON u.id = s.student_id AND s.assignment_id = ?
      LEFT JOIN mentor_student ms ON u.id = ms.student_id
      WHERE r.name = 'STUDENT'
    `).all(assignment.deadline, assignmentId);

    res.json(status);
  });

  app.post('/api/teacher/report-student', authenticateToken, authorize(['TEACHER']), (req, res) => {
    const { studentId, assignmentId, reason } = req.body;
    const teacherId = (req as any).user.id;

    try {
      // Find the mentor for this student
      const mentorLink: any = db.prepare('SELECT mentor_id FROM mentor_student WHERE student_id = ?').get(studentId);
      
      if (!mentorLink) {
        return res.status(400).json({ error: 'This student does not have an assigned mentor.' });
      }

      db.prepare(`
        INSERT INTO reports (teacher_id, student_id, mentor_id, assignment_id, message)
        VALUES (?, ?, ?, ?, ?)
      `).run(teacherId, studentId, mentorLink.mentor_id, assignmentId, reason);

      logAudit(teacherId, 'REPORT_CREATED', `Teacher reported student ID ${studentId} to mentor ID ${mentorLink.mentor_id}`);
      res.json({ message: 'Report sent to mentor successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to create report' });
    }
  });

  app.get('/api/mentor/reports', authenticateToken, authorize(['MENTOR']), (req, res) => {
    const mentorId = (req as any).user.id;
    const reports = db.prepare(`
      SELECT 
        r.*,
        t.full_name as teacher_name,
        s.full_name as student_name,
        s.email as student_email,
        s.phone as student_phone,
        s.parents_number as student_parents_number,
        a.title as assignment_title
      FROM reports r
      JOIN users t ON r.teacher_id = t.id
      JOIN users s ON r.student_id = s.id
      LEFT JOIN assignments a ON r.assignment_id = a.id
      WHERE r.mentor_id = ?
      ORDER BY r.created_at DESC
    `).all(mentorId);
    res.json(reports);
  });

  // File download
  app.get('/api/files/download/:id', authenticateToken, (req, res) => {
    const submission: any = db.prepare('SELECT file_path, file_name FROM submissions WHERE id = ?').get(req.params.id);
    if (!submission) return res.status(404).json({ error: 'File not found' });
    res.download(submission.file_path, submission.file_name);
  });

  // Vite middleware for development
  const isProduction = process.env.NODE_ENV === 'production' && fs.existsSync(path.join(__dirname, 'dist'));

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    
    // SPA fallback for development
    app.use('*', async (req, res, next) => {
      const url = req.originalUrl;
      try {
        let template = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});
