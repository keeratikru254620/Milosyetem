import jwt from 'jsonwebtoken';

import User from '../models/User.js';
import { env } from '../config/env.js';

export const protect = async (req, res, next) => {
  const header = req.headers.authorization || '';

  if (!header.startsWith('Bearer ')) {
    res.status(401);
    next(new Error('Not authorized'));
    return;
  }

  try {
    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, env.jwtSecret);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      res.status(401);
      next(new Error('User not found'));
      return;
    }

    req.user = user;
    next();
  } catch {
    res.status(401);
    next(new Error('Invalid token'));
  }
};

export const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    res.status(403);
    next(new Error('Admin access required'));
    return;
  }

  next();
};
