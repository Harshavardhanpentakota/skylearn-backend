'use strict';

const Announcement = require('../models/Announcement');
const mongoose     = require('mongoose');

// For authenticated users: returns announcements relevant to their role with read status
const findAllForUser = async (userId, role = 'student') => {
  const query = { $or: [{ targetRole: 'all' }, { targetRole: role }] };
  const announcements = await Announcement.find(query).sort({ createdAt: -1 });
  const uid = userId.toString();
  return announcements.map((a) => ({
    ...a.toJSON(),
    isRead: a.readBy.some((id) => id.toString() === uid),
  }));
};

// For admin: returns all announcements
const findAll = () => Announcement.find().sort({ createdAt: -1 });

// Count unread announcements for a user
const getUnreadCount = async (userId, role = 'student') => {
  const roleFilter = { $or: [{ targetRole: 'all' }, { targetRole: role }] };
  return Announcement.countDocuments({
    ...roleFilter,
    readBy: { $ne: new mongoose.Types.ObjectId(String(userId)) },
  });
};

// Mark a single announcement as read by a user
const markRead = (announcementId, userId) =>
  Announcement.findByIdAndUpdate(
    announcementId,
    { $addToSet: { readBy: userId } },
    { new: true }
  );

// Admin CRUD
const create = ({ title, description, date, targetRole, createdBy }) =>
  Announcement.create({
    title,
    description: description || '',
    date: date || new Date().toISOString().split('T')[0],
    targetRole: targetRole || 'all',
    createdBy: createdBy || null,
  });

const update = (id, data) =>
  Announcement.findByIdAndUpdate(id, data, { new: true, runValidators: true });

const remove = (id) => Announcement.findByIdAndDelete(id);

module.exports = { findAllForUser, findAll, getUnreadCount, markRead, create, update, remove };
