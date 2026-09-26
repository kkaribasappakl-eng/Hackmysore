// server/middleware/auth.js
import crypto from 'node:crypto';
import { db } from '../db.js';

const JWT_SECRET = process.env.AUTH_SECRET || 'signalcraft-production-jwt-secret-key-2026';

/**
 * Generate a cryptographically signed HMAC-SHA256 token for user authentication.
 * Zero external dependencies: uses Node.js standard library crypto.
 */
export function generateToken(user) {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days validity
  };

  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(encodedPayload)
    .digest('base64url');

  return `${encodedPayload}.${signature}`;
}

/**
 * Decode and verify token signature and expiration.
 */
export function verifyTokenString(token) {
  if (!token || typeof token !== 'string') return null;

  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [encodedPayload, signature] = parts;
  const expectedSignature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(encodedPayload)
    .digest('base64url');

  if (signature !== expectedSignature) {
    return null; // Invalid signature
  }

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8'));
    if (payload.exp && Date.now() > payload.exp) {
      return null; // Expired
    }
    return payload;
  } catch {
    return null;
  }
}

/**
 * Express middleware to authenticate token from Authorization header: Bearer <token>
 */
export function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({
      success: false,
      message: 'Access denied: No authorization token provided'
    });
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
    return res.status(401).json({
      success: false,
      message: 'Access denied: Malformed authorization header (expected Bearer <token>)'
    });
  }

  const token = parts[1];
  const payload = verifyTokenString(token);
  if (!payload) {
    return res.status(401).json({
      success: false,
      message: 'Access denied: Invalid or expired token'
    });
  }

  req.user = payload;
  next();
}

/**
 * Middleware factory to enforce specific roles (BUILDER, REVIEWER, RECRUITER).
 * Example: requireRole(['BUILDER']) or requireRole(['REVIEWER', 'RECRUITER'])
 */
export function requireRole(allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    const userRole = String(req.user.role).toUpperCase();

    if (!roles.map(r => r.toUpperCase()).includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Access restricted to [${roles.join(', ')}] role. Current user role: ${req.user.role}`
      });
    }

    next();
  };
}

/**
 * Optional token extraction middleware (does not fail if missing).
 */
export function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (authHeader) {
    const parts = authHeader.split(' ');
    if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
      const payload = verifyTokenString(parts[1]);
      if (payload) {
        req.user = payload;
      }
    }
  }
  next();
}
