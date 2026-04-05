'use strict';

/**
 * Seed script — populates MongoDB with initial data.
 * Run from skylearn-backend root:  npm run seed
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });
const mongoose     = require('mongoose');
const connectDB    = require('../config/db');
const Course       = require('../models/Course');
const Announcement = require('../models/Announcement');
const Certificate  = require('../models/Certificate');
const User         = require('../models/User');
const LoginHistory = require('../models/LoginHistory');

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';

// ─── Seed data ────────────────────────────────────────────────────────────────

const courses = [
  {
    title: 'Demo Course 1',
    description:
      'An introductory course covering foundational concepts and methodologies for structured learning.',
    thumbnail: `${BASE_URL}/thumbnails/course-thumb-1.jpg`,
    progress: 0,
    modules: [
      {
        title: 'Demo Module 1: Introduction',
        topics: [
          {
            title: 'Demo Topic 1', completed: false,
            videoUrl: 'https://www.youtube.com/embed/x7X9w_GIm1s',
            notes: `<h2>Introduction to the Course</h2>
<p>Welcome to <strong>Demo Course 1</strong>! This lesson introduces the core concepts you'll explore throughout the course.</p>
<h3>What you'll learn</h3>
<ul>
  <li>Foundational principles of structured learning</li>
  <li>How to navigate the course materials</li>
  <li>Setting goals for your learning journey</li>
</ul>
<h3>Key Terms</h3>
<dl>
  <dt><strong>Structured Learning</strong></dt>
  <dd>An organised approach to learning with defined objectives and measurable outcomes.</dd>
  <dt><strong>Active Recall</strong></dt>
  <dd>A study technique where you attempt to recall information without referring to notes.</dd>
</dl>
<blockquote>
  <p>"The beautiful thing about learning is that no one can take it away from you." — B.B. King</p>
</blockquote>
<p>Take your time with this lesson. Use the mark‑as‑complete button when you are ready to move on.</p>`,
          },
          {
            title: 'Demo Topic 2', completed: false,
            videoUrl: 'https://www.youtube.com/embed/x7X9w_GIm1s',
            notes: `<h2>Core Concepts</h2>
<p>In this lesson we dive deeper into the core concepts introduced in the previous topic.</p>
<h3>Learning Objectives</h3>
<ol>
  <li>Understand the theoretical framework behind the subject</li>
  <li>Identify real-world applications</li>
  <li>Apply concepts in practice exercises</li>
</ol>
<p>Make sure to watch the full video before proceeding to the quiz at the end of this module.</p>`,
          },
          {
            title: 'Demo Topic 3', completed: false,
            videoUrl: 'https://www.youtube.com/embed/x7X9w_GIm1s',
            notes: '<h2>Module Summary</h2><p>A quick recap of everything covered in Module 1 before you move on.</p>',
          },
        ],
      },
      {
        title: 'Demo Module 2: Fundamentals',
        topics: [
          { title: 'Demo Topic 4', completed: false, videoUrl: 'https://www.youtube.com/embed/x7X9w_GIm1s', notes: '<h2>Fundamentals Part 1</h2><p>Deep dive into the fundamantal techniques.</p>' },
          { title: 'Demo Topic 5', completed: false, videoUrl: 'https://www.youtube.com/embed/x7X9w_GIm1s', notes: '' },
          { title: 'Demo Topic 6', completed: false, videoUrl: 'https://www.youtube.com/embed/x7X9w_GIm1s', notes: '' },
        ],
      },
    ],
  },
  {
    title: 'Demo Course 2',
    description:
      'A comprehensive exploration of intermediate topics with practical exercises and assessments.',
    thumbnail: `${BASE_URL}/thumbnails/course-thumb-2.jpg`,
    progress: 0,
    modules: [
      {
        title: 'Demo Module 1: Getting Started',
        topics: [
          { title: 'Demo Topic 1', completed: false, videoUrl: 'https://www.youtube.com/embed/x7X9w_GIm1s', notes: '<h2>Getting Started</h2><p>Everything you need to begin this intermediate course.</p>' },
          { title: 'Demo Topic 2', completed: false, videoUrl: 'https://www.youtube.com/embed/x7X9w_GIm1s', notes: '' },
          { title: 'Demo Topic 3', completed: false, videoUrl: 'https://www.youtube.com/embed/x7X9w_GIm1s', notes: '' },
        ],
      },
      {
        title: 'Demo Module 2: Core Concepts',
        topics: [
          { title: 'Demo Topic 4', completed: false, videoUrl: 'https://www.youtube.com/embed/x7X9w_GIm1s', notes: '' },
          { title: 'Demo Topic 5', completed: false, videoUrl: 'https://www.youtube.com/embed/x7X9w_GIm1s', notes: '' },
        ],
      },
    ],
  },
  {
    title: 'Demo Course 3',
    description:
      'Advanced material designed to deepen understanding and build mastery through guided practice.',
    thumbnail: `${BASE_URL}/thumbnails/course-thumb-3.jpg`,
    progress: 0,
    modules: [
      {
        title: 'Demo Module 1: Overview',
        topics: [
          { title: 'Demo Topic 1', completed: false, videoUrl: 'https://www.youtube.com/embed/x7X9w_GIm1s', notes: '<h2>Advanced Overview</h2><p>An overview of the advanced concepts covered in this course.</p>' },
          { title: 'Demo Topic 2', completed: false, videoUrl: 'https://www.youtube.com/embed/x7X9w_GIm1s', notes: '' },
        ],
      },
    ],
  },
  {
    title: 'Demo Course 4',
    description:
      'A hands-on workshop focusing on applied techniques and real-world problem solving.',
    thumbnail: `${BASE_URL}/thumbnails/course-thumb-4.jpg`,
    progress: 0,
    modules: [
      {
        title: 'Demo Module 1: Basics',
        topics: [
          { title: 'Demo Topic 1', completed: false, videoUrl: 'https://www.youtube.com/embed/x7X9w_GIm1s', notes: '' },
          { title: 'Demo Topic 2', completed: false, videoUrl: 'https://www.youtube.com/embed/x7X9w_GIm1s', notes: '' },
          { title: 'Demo Topic 3', completed: false, videoUrl: 'https://www.youtube.com/embed/x7X9w_GIm1s', notes: '' },
        ],
      },
    ],
  },
  {
    title: 'Demo Course 5',
    description:
      'A specialized track exploring niche areas with curated content and expert guidance.',
    thumbnail: `${BASE_URL}/thumbnails/course-thumb-5.jpg`,
    progress: 0,
    modules: [
      {
        title: 'Demo Module 1: Foundations',
        topics: [
          { title: 'Demo Topic 1', completed: false, videoUrl: 'https://www.youtube.com/embed/x7X9w_GIm1s', notes: '' },
          { title: 'Demo Topic 2', completed: false, videoUrl: 'https://www.youtube.com/embed/x7X9w_GIm1s', notes: '' },
        ],
      },
    ],
  },
];

const announcements = [
  {
    title: 'Platform Update',
    description:
      "We've improved performance and added new accessibility features across the platform.",
    date: '2026-03-08',
  },
  {
    title: 'New Courses Available',
    description:
      'Five new courses have been added to the catalog covering emerging topics.',
    date: '2026-03-05',
  },
  {
    title: 'Learning Tips',
    description:
      'Discover effective study techniques to maximize your retention and understanding.',
    date: '2026-03-01',
  },
];

const certificates = [
  { courseTitle: 'Demo Course 1 Certificate', completionDate: '2026-02-15' },
  { courseTitle: 'Demo Course 3 Certificate', completionDate: '2026-03-01' },
];

// Demo users (plain-text passwords hashed at seed time)
const usersRaw = [
  { name: 'Admin User',   email: 'admin@example.com',   password: 'Admin123!',   role: 'admin'   },
  { name: 'Student User', email: 'student@example.com', password: 'Student123!', role: 'student' },
  { name: 'Demo User',    email: 'demo@example.com',    password: 'Demo123!',    role: 'student' },
];

// ─── Seeder ──────────────────────────────────────────────────────────────────

const seed = async () => {
  await connectDB();

  // Clear existing data and rebuild indexes cleanly
  await Promise.all([
    Course.deleteMany({}),
    Announcement.deleteMany({}),
    Certificate.deleteMany({}),
    LoginHistory.deleteMany({}),
  ]);
  // Drop and re-sync User indexes so sparse:true on googleId takes effect on Atlas
  await User.deleteMany({});
  await User.collection.dropIndexes().catch(() => {}); // ignore if no indexes
  await User.syncIndexes();

  // Hash passwords and create users
  const userDocs = await Promise.all(
    usersRaw.map(async ({ name, email, password, role }) => {
      const hash = await User.hashPassword(password);
      return User.create({ name, email, password: hash, role });
    })
  );

  // Sample login history for the first user
  const demoLoginHistory = [
    { userId: userDocs[1]._id, ip: '192.168.1.10', userAgent: 'Mozilla/5.0 (Windows NT 10.0) Chrome/120', method: 'email',  createdAt: new Date('2026-03-28T09:00:00Z') },
    { userId: userDocs[1]._id, ip: '192.168.1.10', userAgent: 'Mozilla/5.0 (Windows NT 10.0) Chrome/120', method: 'email',  createdAt: new Date('2026-03-29T14:22:00Z') },
    { userId: userDocs[1]._id, ip: '10.0.0.5',     userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17) Safari', method: 'google', createdAt: new Date('2026-04-01T08:15:00Z') },
    { userId: userDocs[0]._id, ip: '127.0.0.1',    userAgent: 'Mozilla/5.0 (Macintosh) Chrome/120',         method: 'email',  createdAt: new Date('2026-04-02T11:00:00Z') },
  ];

  // Insert fresh data — compute lessonsCount from actual topics
  const coursesWithCount = courses.map((c) => ({
    ...c,
    lessonsCount: c.modules.reduce((sum, m) => sum + m.topics.length, 0),
  }));

  await Promise.all([
    Course.insertMany(coursesWithCount),
    Announcement.insertMany(announcements),
    Certificate.insertMany(certificates),
    LoginHistory.insertMany(demoLoginHistory),
  ]);

  console.log(`Seeded: ${courses.length} courses, ${announcements.length} announcements, ${certificates.length} certificates`);
  console.log(`Seeded: ${userDocs.length} users`);
  console.log('\nDemo credentials:');
  usersRaw.forEach(({ email, password, role }) =>
    console.log(`  [${role}]  ${email}  /  ${password}`)
  );

  await mongoose.disconnect();
  console.log('\nDisconnected. Seeding complete.');
};

seed().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
