import bcrypt from 'bcryptjs';

import User from '../models/User.js';

const sanitizeUser = (user) => ({
  _id: String(user._id),
  username: user.username,
  email: user.email,
  name: user.name,
  role: user.role,
  avatar: user.avatar,
  phone: user.phone,
});

const canManageTargetUser = (requestUser, targetUserId) =>
  requestUser?.role === 'admin' || String(requestUser?._id) === String(targetUserId);

export const listUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-password').sort({ name: 1 });
    res.json(users.map(sanitizeUser));
  } catch (error) {
    next(error);
  }
};

export const createUser = async (req, res, next) => {
  try {
    if (req.user?.role !== 'admin') {
      res.status(403);
      throw new Error('Admin access required');
    }

    const { username, email, password, name, role = 'general', phone, avatar } = req.body;

    if (!username || !password || !name) {
      res.status(400);
      throw new Error('username, password and name are required');
    }

    const existingUser = await User.findOne({
      $or: [{ username }, ...(email ? [{ email }] : [])],
    });

    if (existingUser) {
      res.status(409);
      throw new Error('User already exists');
    }

    const user = await User.create({
      username,
      email,
      password: await bcrypt.hash(password, 10),
      name,
      role,
      phone,
      avatar,
    });

    res.status(201).json(sanitizeUser(user));
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!canManageTargetUser(req.user, id)) {
      res.status(403);
      throw new Error('Not allowed to update this user');
    }

    const user = await User.findById(id);

    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    const { name, role, password, avatar, phone, email } = req.body;

    if (name !== undefined) user.name = name;
    if (avatar !== undefined) user.avatar = avatar;
    if (phone !== undefined) user.phone = phone;
    if (email !== undefined) user.email = email;

    if (password) {
      user.password = await bcrypt.hash(password, 10);
    }

    if (req.user?.role === 'admin' && role) {
      user.role = role;
    }

    await user.save();
    res.json(sanitizeUser(user));
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    if (req.user?.role !== 'admin') {
      res.status(403);
      throw new Error('Admin access required');
    }

    const { id } = req.params;

    if (String(req.user._id) === String(id)) {
      res.status(400);
      throw new Error('Cannot delete your own account');
    }

    const user = await User.findByIdAndDelete(id);

    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};
