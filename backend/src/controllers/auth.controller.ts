import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../utils/db';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_123';

export const blacklistedTokens = new Set<string>();

export const register = async (req: Request, res: Response) => {
  try {
    const { email, displayName, password } = req.body;

    if (!email || !displayName || !password) {
      return res.status(400).json({ error: 'Bad Request', message: 'Missing required fields' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ error: 'Conflict', message: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        displayName,
        password: hashedPassword,
        // Role is default CUSTOMER as per schema
      },
    });

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '24h' });

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: { id: user.id, email: user.email, displayName: user.displayName, role: user.role }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Something went wrong' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Invalid email or password' });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: 'Forbidden', message: 'Account is deactivated' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Invalid email or password' });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '24h' });

    res.json({
      message: 'Login successful',
      token,
      user: { id: user.id, email: user.email, displayName: user.displayName, role: user.role }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Something went wrong' });
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      // Blacklist token in memory
      blacklistedTokens.add(token);
    }
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Something went wrong' });
  }
};

export const getProfile = async (req: any, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, email: true, displayName: true, role: true, isActive: true }
    });
    if (!user) {
       return res.status(404).json({ error: 'Not Found', message: 'User not found' });
    }
    res.json({ user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Something went wrong' });
  }
};
