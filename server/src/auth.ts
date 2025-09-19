import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { User, AuthResponse, LoginRequest, RegisterRequest } from './types';
import { store } from './store';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export function generateToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '24h' });
}

export function verifyToken(token: string): string | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    return decoded.userId;
  } catch (error) {
    return null;
  }
}

export async function registerUser(username: string, password: string): Promise<AuthResponse> {
  // Check if user already exists
  const existingUser = store.getUserByUsername(username);
  if (existingUser) {
    throw new Error('User already exists');
  }

  // Validate password
  if (password.length < 6) {
    throw new Error('Password must be at least 6 characters long');
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create new user
  const user = store.addUser(username, hashedPassword);

  // Set user as online
  store.setUserOnline(user.id, true);

  const token = generateToken(user.id);
  
  return {
    token,
    user: {
      ...user,
      isOnline: true,
    },
  };
}

export async function loginUser(username: string, password: string): Promise<AuthResponse> {
  // Find user
  const user = store.getUserByUsername(username);
  if (!user) {
    throw new Error('Invalid username or password');
  }

  // Check if user has password (registered user)
  if (!user.password) {
    throw new Error('Please register first');
  }

  // Verify password
  const isValidPassword = await bcrypt.compare(password, user.password);
  if (!isValidPassword) {
    throw new Error('Invalid username or password');
  }

  // Set user as online
  store.setUserOnline(user.id, true);

  const token = generateToken(user.id);
  
  return {
    token,
    user: {
      ...user,
      isOnline: true,
    },
  };
}
