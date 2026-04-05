'use strict';

const User         = require('../models/User');
const Course       = require('../models/Course');
const LoginHistory = require('../models/LoginHistory');
const UserProgress = require('../models/UserProgress');

// ─── Dashboard Stats ──────────────────────────────────────────────────────────
const getStats = async (req, res, next) => {
  try {
    const now        = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo    = new Date(now - 7 * 24 * 60 * 60 * 1000);

    const [
      totalUsers, adminCount, totalCourses,
      loginsToday, loginsThisWeek, totalLogins, newUsersThisWeek,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'admin' }),
      Course.countDocuments(),
      LoginHistory.countDocuments({ createdAt: { $gte: todayStart } }),
      LoginHistory.countDocuments({ createdAt: { $gte: weekAgo } }),
      LoginHistory.countDocuments(),
      User.countDocuments({ createdAt: { $gte: weekAgo } }),
    ]);

    // Logins per day for the last 7 days
    const loginsByDay = await LoginHistory.aggregate([
      { $match: { createdAt: { $gte: weekAgo } } },
      {
        $group: {
          _id:   { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { date: '$_id', count: 1, _id: 0 } },
    ]);

    // Total modules + topics across all courses
    const courseAgg = await Course.aggregate([
      {
        $project: {
          moduleCount: { $size: '$modules' },
          topicCount: {
            $sum: { $map: { input: '$modules', as: 'm', in: { $size: '$$m.topics' } } },
          },
        },
      },
      {
        $group: {
          _id: null,
          totalModules: { $sum: '$moduleCount' },
          totalTopics:  { $sum: '$topicCount' },
        },
      },
    ]);

    const cs = courseAgg[0] || { totalModules: 0, totalTopics: 0 };

    const recentActivity = await LoginHistory.find()
      .sort({ createdAt: -1 })
      .limit(8)
      .populate('userId', 'name email')
      .lean();

    res.json({
      users:   { total: totalUsers, admins: adminCount, students: totalUsers - adminCount, newThisWeek: newUsersThisWeek },
      courses: { total: totalCourses, totalModules: cs.totalModules, totalTopics: cs.totalTopics },
      logins:  { today: loginsToday, thisWeek: loginsThisWeek, total: totalLogins },
      loginsByDay,
      recentActivity: recentActivity.map((l) => ({
        id:        l._id,
        user:      l.userId ? { name: l.userId.name, email: l.userId.email } : { name: 'Deleted User', email: '' },
        ip:        l.ip,
        method:    l.method,
        userAgent: l.userAgent,
        createdAt: l.createdAt,
      })),
    });
  } catch (err) {
    next(err);
  }
};

// ─── Users ────────────────────────────────────────────────────────────────────
const getUsers = async (req, res, next) => {
  try {
    const users    = await User.find().select('-password').sort({ createdAt: -1 }).lean();
    const userIds  = users.map((u) => u._id);

    const lastLogins = await LoginHistory.aggregate([
      { $match: { userId: { $in: userIds } } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id:        '$userId',
          lastLogin:  { $first: '$createdAt' },
          lastIp:     { $first: '$ip' },
          loginCount: { $sum: 1 },
        },
      },
    ]);

    const loginMap = Object.fromEntries(lastLogins.map((l) => [l._id.toString(), l]));

    res.json(
      users.map((u) => {
        const info = loginMap[u._id.toString()] || {};
        return {
          id:         u._id,
          name:       u.name,
          email:      u.email,
          role:       u.role,
          avatar:     u.avatar || null,
          hasGoogle:  !!u.googleId,
          createdAt:  u.createdAt,
          lastLogin:  info.lastLogin  || null,
          lastIp:     info.lastIp     || null,
          loginCount: info.loginCount || 0,
        };
      })
    );
  } catch (err) {
    next(err);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const allowed = ['name', 'role'];
    const updates = {};
    for (const k of allowed) {
      if (req.body[k] !== undefined) updates[k] = req.body[k];
    }
    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true }).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    next(err);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    if (req.params.id === req.user.sub) {
      return res.status(400).json({ error: 'You cannot delete your own account' });
    }
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    await Promise.all([
      LoginHistory.deleteMany({ userId: req.params.id }),
      UserProgress.deleteMany({ userId: req.params.id }),
    ]);
    res.json({ message: 'User deleted' });
  } catch (err) {
    next(err);
  }
};

// ─── Courses ──────────────────────────────────────────────────────────────────

/** Serialize a Mongoose course doc (or lean object) into the shape the admin UI expects. */
const formatCourse = (c) => ({
  id:           c._id,
  title:        c.title,
  description:  c.description,
  thumbnail:    c.thumbnail,
  lessonsCount: c.lessonsCount,
  moduleCount:  c.modules.length,
  topicCount:   c.modules.reduce((sum, m) => sum + m.topics.length, 0),
  createdAt:    c.createdAt,
  updatedAt:    c.updatedAt,
  modules: c.modules.map((m) => ({
    id:     m._id,
    title:  m.title,
    topics: m.topics.map((t) => ({
      id:       t._id,
      title:    t.title,
      videoUrl: t.videoUrl,
      completed: t.completed,
      notes:    t.notes || '',
    })),
  })),
});

const getCourses = async (req, res, next) => {
  try {
    const courses = await Course.find().sort({ createdAt: -1 }).lean();
    res.json(courses.map(formatCourse));
  } catch (err) {
    next(err);
  }
};

const createCourse = async (req, res, next) => {
  try {
    const { title, description, thumbnail } = req.body;
    if (!title) return res.status(400).json({ error: 'Title is required' });
    const course = await Course.create({
      title, description: description || '', thumbnail: thumbnail || '', modules: [],
    });
    res.status(201).json(course);
  } catch (err) {
    next(err);
  }
};

const updateCourse = async (req, res, next) => {
  try {
    const allowed = ['title', 'description', 'thumbnail'];
    const updates = {};
    for (const k of allowed) {
      if (req.body[k] !== undefined) updates[k] = req.body[k];
    }
    const course = await Course.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!course) return res.status(404).json({ error: 'Course not found' });
    res.json(course);
  } catch (err) {
    next(err);
  }
};

const deleteCourse = async (req, res, next) => {
  try {
    const course = await Course.findByIdAndDelete(req.params.id);
    if (!course) return res.status(404).json({ error: 'Course not found' });
    await UserProgress.deleteMany({ courseId: req.params.id });
    res.json({ message: 'Course deleted' });
  } catch (err) {
    next(err);
  }
};

// ─── Module management ────────────────────────────────────────────────────────
const addModule = async (req, res, next) => {
  try {
    const { title } = req.body;
    if (!title) return res.status(400).json({ error: 'Title is required' });
    const course = await Course.findByIdAndUpdate(
      req.params.id,
      { $push: { modules: { title, topics: [] } } },
      { new: true }
    );
    if (!course) return res.status(404).json({ error: 'Course not found' });
    res.status(201).json(formatCourse(course.toObject()));
  } catch (err) {
    next(err);
  }
};

const deleteModule = async (req, res, next) => {
  try {
    const course = await Course.findByIdAndUpdate(
      req.params.id,
      { $pull: { modules: { _id: req.params.moduleId } } },
      { new: true }
    );
    if (!course) return res.status(404).json({ error: 'Course not found' });
    res.json(formatCourse(course.toObject()));
  } catch (err) {
    next(err);
  }
};

// ─── Topic management ─────────────────────────────────────────────────────────
const addTopic = async (req, res, next) => {
  try {
    const { title, videoUrl } = req.body;
    if (!title) return res.status(400).json({ error: 'Title is required' });
    const course = await Course.findOneAndUpdate(
      { _id: req.params.id, 'modules._id': req.params.moduleId },
      { $push: { 'modules.$.topics': { title, videoUrl: videoUrl || '', completed: false } } },
      { new: true }
    );
    if (!course) return res.status(404).json({ error: 'Course or module not found' });
    const count = course.modules.reduce((s, m) => s + m.topics.length, 0);
    await Course.findByIdAndUpdate(req.params.id, { lessonsCount: count });
    res.status(201).json(formatCourse(course.toObject()));
  } catch (err) {
    next(err);
  }
};

const deleteTopic = async (req, res, next) => {
  try {
    const course = await Course.findOneAndUpdate(
      { _id: req.params.id, 'modules._id': req.params.moduleId },
      { $pull: { 'modules.$.topics': { _id: req.params.topicId } } },
      { new: true }
    );
    if (!course) return res.status(404).json({ error: 'Course or module not found' });
    const count = course.modules.reduce((s, m) => s + m.topics.length, 0);
    await Course.findByIdAndUpdate(req.params.id, { lessonsCount: count });
    res.json(formatCourse(course.toObject()));
  } catch (err) {
    next(err);
  }
};

// ─── Login Activity ───────────────────────────────────────────────────────────
const getActivity = async (req, res, next) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));
    const skip  = (page - 1) * limit;

    const [records, total] = await Promise.all([
      LoginHistory.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'name email')
        .lean(),
      LoginHistory.countDocuments(),
    ]);

    res.json({
      data: records.map((l) => ({
        id:        l._id,
        user:      l.userId ? { id: l.userId._id, name: l.userId.name, email: l.userId.email } : null,
        ip:        l.ip,
        method:    l.method,
        userAgent: l.userAgent,
        createdAt: l.createdAt,
      })),
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    });
  } catch (err) {
    next(err);
  }
};

// ─── Suspicious Activity ──────────────────────────────────────────────────────
const getSuspiciousActivity = async (req, res, next) => {
  try {
    const results = await LoginHistory.aggregate([
      {
        $group: {
          _id:          '$userId',
          distinctIPs:  { $addToSet: '$ip' },
          totalLogins:  { $sum: 1 },
          lastLogin:    { $max: '$createdAt' },
          firstLogin:   { $min: '$createdAt' },
          methods:      { $addToSet: '$method' },
          recentLogins: {
            $push: { ip: '$ip', method: '$method', userAgent: '$userAgent', createdAt: '$createdAt' },
          },
        },
      },
      // Only keep users with 2+ distinct IPs
      { $match: { $expr: { $gt: [{ $size: '$distinctIPs' }, 1] } } },
      {
        $lookup: {
          from:         'users',
          localField:   '_id',
          foreignField: '_id',
          as:           'user',
        },
      },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          userId:      '$_id',
          _id:         0,
          name:        { $ifNull: ['$user.name',  'Deleted User'] },
          email:       { $ifNull: ['$user.email', ''] },
          role:        { $ifNull: ['$user.role',  'unknown'] },
          distinctIPs: 1,
          ipCount:     { $size: '$distinctIPs' },
          totalLogins: 1,
          lastLogin:   1,
          firstLogin:  1,
          methods:     1,
          riskLevel: {
            $switch: {
              branches: [
                { case: { $gte: [{ $size: '$distinctIPs' }, 5] }, then: 'critical' },
                { case: { $gte: [{ $size: '$distinctIPs' }, 3] }, then: 'high' },
              ],
              default: 'medium',
            },
          },
          recentLogins: { $slice: ['$recentLogins', -10] },
        },
      },
      { $sort: { ipCount: -1, lastLogin: -1 } },
    ]);

    res.json(results);
  } catch (err) {
    next(err);
  }
};

// ─── Topic Notes ──────────────────────────────────────────────────────────────
/**
 * PUT /api/admin/courses/:id/modules/:moduleId/topics/:topicId/notes
 * Body: { notes: "<p>HTML content…</p>" }
 * Stores HTML notes for a topic. Admin-only.
 */
const updateTopicNotes = async (req, res, next) => {
  try {
    const { notes } = req.body;
    if (notes === undefined) return res.status(400).json({ error: 'notes field is required' });

    // Use the positional-all operator to target the specific topic inside a specific module
    const result = await Course.findOneAndUpdate(
      {
        _id: req.params.id,
        'modules._id': req.params.moduleId,
        'modules.topics._id': req.params.topicId,
      },
      { $set: { 'modules.$[mod].topics.$[topic].notes': notes } },
      {
        arrayFilters: [
          { 'mod._id': req.params.moduleId },
          { 'topic._id': req.params.topicId },
        ],
        new: true,
      }
    );

    if (!result) return res.status(404).json({ error: 'Course, module, or topic not found' });
    res.json({ message: 'Notes updated' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getStats,
  getUsers, updateUser, deleteUser,
  getCourses, createCourse, updateCourse, deleteCourse,
  addModule, deleteModule,
  addTopic, deleteTopic,
  updateTopicNotes,
  getActivity,
  getSuspiciousActivity,
};
