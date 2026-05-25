import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database';
import { cacheSet, cacheDel, cacheGet } from '../config/redis';
import { AuthRequest } from '../middlewares/auth.middleware';

// ─── Token Helpers 
// 15 minute access token - short enough to be secure,
// long enough that normal users won't notice refresh happening
const generateAccessToken = (userId: string, role: string): string =>
  jwt.sign({ userId, role }, process.env.JWT_SECRET!, { expiresIn: '15m' });

const generateRefreshToken = (userId: string): string =>
  jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET!, { expiresIn: '7d' });

const createTokenPair = async (userId: string, role: string) => {
  const accessToken = generateAccessToken(userId, role);
  const refreshToken = generateRefreshToken(userId);

 
  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  return { accessToken, refreshToken };
};

// ─── Controllers 

export const register = async (req: Request, res: Response): Promise<void> => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    res.status(400).json({ error: 'Name, email, and password are required' });
    return;
  }

  if (password.length < 8) {
    res.status(400).json({ error: 'Password must be at least 8 characters' });
    return;
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    res.status(409).json({ error: 'Email already registered' });
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { name, email, password: hashedPassword },
    select: { id: true, name: true, email: true, role: true, avatar: true, createdAt: true },
  });

  const { accessToken, refreshToken } = await createTokenPair(user.id, user.role);

  // Cache session
  await cacheSet(`session:${user.id}`, user, 900);

  res.status(201).json({ user, accessToken, refreshToken });
};

export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required' });
    return;
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.password) {
    res.status(401).json({ error: 'Invalid email or password' });
    return;
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    res.status(401).json({ error: 'Invalid email or password' });
    return;
  }

  const safeUser = { id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatar };
  const { accessToken, refreshToken } = await createTokenPair(user.id, user.role);

  // Cache session in Redis (15 min)
  await cacheSet(`session:${user.id}`, safeUser, 900);

  res.json({ user: safeUser, accessToken, refreshToken });
};

export const refreshTokenHandler = async (req: Request, res: Response): Promise<void> => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    res.status(401).json({ error: 'Refresh token required' });
    return;
  }

  try {
    const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as { userId: string };
    const stored = await prisma.refreshToken.findUnique({ where: { token: refreshToken } });

    if (!stored || stored.expiresAt < new Date()) {
      res.status(401).json({ error: 'Invalid or expired refresh token' });
      return;
    }

    
    await prisma.refreshToken.delete({ where: { token: refreshToken } });

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, role: true },
    });
    if (!user) {
      res.status(401).json({ error: 'User not found' });
      return;
    }

    const tokens = await createTokenPair(user.id, user.role);
    res.json(tokens);
  } catch {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
};

export const logout = async (req: AuthRequest, res: Response): Promise<void> => {
  const { refreshToken } = req.body;
  const authHeader = req.headers.authorization;
  const accessToken = authHeader?.split(' ')[1];

  // Blacklist access token until it expires (15 min)
  if (accessToken) {
    await cacheSet(`blacklist:${accessToken}`, true, 900);
  }

 
  if (refreshToken) {
    await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
  }

  if (req.userId) {
    await cacheDel(`session:${req.userId}`);
  }

  res.json({ message: 'Logged out successfully' });
};

export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  
  const cached = await cacheGet(`session:${req.userId}`);
  if (cached) {
    res.json(cached);
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    select: { id: true, name: true, email: true, role: true, avatar: true, createdAt: true },
  });

  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  await cacheSet(`session:${user.id}`, user, 900);
  res.json(user);
};

export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  const { name, avatar } = req.body;

  const user = await prisma.user.update({
    where: { id: req.userId },
    data: { ...(name && { name }), ...(avatar && { avatar }) },
    select: { id: true, name: true, email: true, role: true, avatar: true },
  });

  
  await cacheDel(`session:${req.userId}`);
  await cacheSet(`session:${req.userId}`, user, 900);

  res.json(user);
};
