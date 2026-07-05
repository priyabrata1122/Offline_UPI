import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { Account } from '../models/Account.js';
import env from '../config/env.js';

export class AuthController {
  static async register(req, res) {
    try {
      const { username, password, holderName } = req.body;

      if (!username || !password) {
        res.status(400).json({ success: false, message: 'Username and password are required' });
        return;
      }

      const existingUser = await User.findOne({ username });
      if (existingUser) {
        res.status(400).json({ success: false, message: 'Username already exists' });
        return;
      }

      const vpa = `${username.toLowerCase()}@demo`;

      const existingAccount = await Account.findOne({ vpa });
      if (existingAccount) {
        res.status(400).json({ success: false, message: 'VPA already registered' });
        return;
      }

      const account = new Account({
        vpa,
        holderName: holderName || username,
        balance: 1000.0,
      });
      await account.save();

      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      const user = new User({
        username,
        passwordHash,
        vpa,
      });
      await user.save();

      const token = jwt.sign({ id: user._id, username: user.username, vpa: user.vpa }, env.JWT_SECRET, {
        expiresIn: env.JWT_EXPIRES_IN,
      });

      res.status(201).json({
        success: true,
        token,
        user: {
          id: user._id,
          username: user.username,
          vpa: user.vpa,
        },
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async login(req, res) {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        res.status(400).json({ success: false, message: 'Username and password are required' });
        return;
      }

      const user = await User.findOne({ username });
      if (!user) {
        res.status(400).json({ success: false, message: 'Invalid credentials' });
        return;
      }

      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) {
        res.status(400).json({ success: false, message: 'Invalid credentials' });
        return;
      }

      const token = jwt.sign({ id: user._id, username: user.username, vpa: user.vpa }, env.JWT_SECRET, {
        expiresIn: env.JWT_EXPIRES_IN,
      });

      res.json({
        success: true,
        token,
        user: {
          id: user._id,
          username: user.username,
          vpa: user.vpa,
        },
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getMe(req, res) {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Not authorized' });
        return;
      }

      const user = await User.findById(req.user.id).select('-passwordHash');
      if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }

      const account = await Account.findOne({ vpa: user.vpa });

      res.json({
        success: true,
        user,
        account,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}
export default AuthController;
