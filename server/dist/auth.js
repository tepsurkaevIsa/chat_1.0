"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateToken = generateToken;
exports.verifyToken = verifyToken;
exports.registerUser = registerUser;
exports.loginUser = loginUser;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const store_1 = require("./store");
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
function generateToken(userId) {
    return jsonwebtoken_1.default.sign({ userId }, JWT_SECRET, { expiresIn: '24h' });
}
function verifyToken(token) {
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        return decoded.userId;
    }
    catch (error) {
        return null;
    }
}
async function registerUser(username, password) {
    // Check if user already exists
    const existingUser = store_1.store.getUserByUsername(username);
    if (existingUser) {
        throw new Error('User already exists');
    }
    // Validate password
    if (password.length < 6) {
        throw new Error('Password must be at least 6 characters long');
    }
    // Hash password
    const hashedPassword = await bcryptjs_1.default.hash(password, 10);
    // Create new user
    const user = store_1.store.addUser(username, hashedPassword);
    // Set user as online
    store_1.store.setUserOnline(user.id, true);
    const token = generateToken(user.id);
    const { password: _pw, ...publicUser } = user;
    return {
        token,
        user: {
            ...publicUser,
            isOnline: true,
        },
    };
}
async function loginUser(username, password) {
    // Find user
    const user = store_1.store.getUserByUsername(username);
    if (!user) {
        throw new Error('Invalid username or password');
    }
    // Check if user has password (registered user)
    if (!user.password) {
        throw new Error('Please register first');
    }
    // Verify password
    const isValidPassword = await bcryptjs_1.default.compare(password, user.password);
    if (!isValidPassword) {
        throw new Error('Invalid username or password');
    }
    // Set user as online
    store_1.store.setUserOnline(user.id, true);
    const token = generateToken(user.id);
    const { password: _pw, ...publicUser } = user;
    return {
        token,
        user: {
            ...publicUser,
            isOnline: true,
        },
    };
}
