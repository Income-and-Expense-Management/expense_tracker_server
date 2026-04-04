const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-default-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

class JwtUtils {
  generateToken(payload) {
    console.log('JwtUtils.generateToken for payload keys:', Object.keys(payload));
    const token = jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });
    // Do NOT log the token value itself
    console.log('JwtUtils.generateToken completed for userId:', payload.userId);
    return token;
  }

  verifyToken(token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      console.log('JwtUtils.verifyToken success for userId:', decoded.userId);
      return decoded;
    } catch (error) {
      console.log('JwtUtils.verifyToken error:', error.message);
      throw new Error('Token không hợp lệ hoặc đã hết hạn');
    }
  }

  decodeToken(token) {
    const decoded = jwt.decode(token);
    console.log('JwtUtils.decodeToken result keys:', decoded ? Object.keys(decoded) : null);
    return decoded;
  }
}

module.exports = new JwtUtils();
