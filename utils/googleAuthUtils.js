import { OAuth2Client } from 'google-auth-library';
import { logger } from './logger.js';

/**
 * Google Auth Utility - Verify Google ID tokens
 * 
 * This utility verifies Google ID tokens sent from Android app
 * using the Credential Manager API.
 */

// Google OAuth2 Client ID từ Google Cloud Console
// Đây là Web Client ID (không phải Android Client ID)
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

const client = new OAuth2Client(GOOGLE_CLIENT_ID);

/**
 * Verify Google ID Token
 * 
 * @param {string} idToken - Google ID token from Android app
 * @returns {Promise<Object>} - Decoded token payload
 * @throws {Error} - If token is invalid
 */
async function verifyGoogleToken(idToken) {
  try {
    logger.info('GoogleAuth: Verifying ID token...');
    
    const ticket = await client.verifyIdToken({
      idToken: idToken,
      audience: GOOGLE_CLIENT_ID,
    });
    
    const payload = ticket.getPayload();
    
    logger.info('GoogleAuth: Token verified successfully');
    logger.debug('GoogleAuth: Email:', payload.email);
    logger.debug('GoogleAuth: Name:', payload.name);
    
    return {
      googleId: payload.sub,           // Unique Google user ID
      email: payload.email,
      emailVerified: payload.email_verified,
      name: payload.name,
      picture: payload.picture,
      givenName: payload.given_name,
      familyName: payload.family_name,
    };
  } catch (error) {
    logger.error('GoogleAuth: Token verification failed:', error.message);
    throw new Error('Google token không hợp lệ');
  }
}

/**
 * Verify Google ID Token (Lenient mode)
 * 
 * Sometimes the token verification fails due to clock skew or
 * audience mismatch (Android vs Web client ID).
 * This method tries standard verification first, then falls back
 * to manual JWT decoding if needed.
 * 
 * @param {string} idToken - Google ID token from Android app
 * @param {string} email - Email from Android (for validation)
 * @returns {Promise<Object>} - User info
 */
async function verifyGoogleTokenLenient(idToken, email) {
  try {
    // Try standard verification first
    return await verifyGoogleToken(idToken);
  } catch (error) {
    logger.info('GoogleAuth: Standard verification failed, trying lenient mode...');
    
    // Fallback: Decode JWT without verification (for development only!)
    // In production, you should configure proper client IDs
    if (process.env.NODE_ENV === 'development' && process.env.GOOGLE_AUTH_LENIENT === 'true') {
      logger.warn('GoogleAuth: WARNING - Using lenient mode (development only!)');
      
      // Decode the JWT payload (middle part)
      const parts = idToken.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid token format');
      }
      
      const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
      
      // Validate email matches
      if (payload.email !== email) {
        throw new Error('Email mismatch');
      }
      
      return {
        googleId: payload.sub,
        email: payload.email,
        emailVerified: payload.email_verified,
        name: payload.name,
        picture: payload.picture,
        givenName: payload.given_name,
        familyName: payload.family_name,
      };
    }
    
    throw error;
  }
}

export default {
  verifyGoogleToken,
  verifyGoogleTokenLenient,
};
