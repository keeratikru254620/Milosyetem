import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import User from '../models/User.js';
import { env } from '../config/env.js';

const signToken = (userId) => jwt.sign({ id: userId }, env.jwtSecret, { expiresIn: '1d' });

const sanitizeUser = (user) => ({
  _id: String(user._id),
  username: user.username,
  email: user.email,
  name: user.name,
  role: user.role,
  avatar: user.avatar,
  phone: user.phone,
});

export const register = async (req, res, next) => {
  try {
    const { username, email, password, name, role = 'general', phone } = req.body;

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

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      name,
      role,
      phone,
    });

    res.status(201).json({
      user: sanitizeUser(user),
      token: signToken(user._id),
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400);
      throw new Error('username and password are required');
    }

    const user = await User.findOne({
      $or: [{ username }, { email: username }],
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      res.status(401);
      throw new Error('Invalid credentials');
    }

    res.json({
      user: sanitizeUser(user),
      token: signToken(user._id),
    });
  } catch (error) {
    next(error);
  }
};

export const getProfile = async (req, res) => {
  res.json({
    user: sanitizeUser(req.user),
  });
};
