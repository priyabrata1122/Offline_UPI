import jwt from 'jsonwebtoken';
import env from '../config/env.js';

export function protect(req, res, next) {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    res.status(401).json({ success: false, message: 'Not authorized, token required' });
    return;
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);

    req.user = {
      id: decoded.id,
      username: decoded.username,
      vpa: decoded.vpa,
    };

    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Not authorized, invalid token' });
    return;
  }
}
