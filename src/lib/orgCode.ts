import crypto from 'crypto';

export function generateOrgCode(prefix = 'SV'){
  // 6 random bytes => 8 base64url chars when encoded
  const id = crypto.randomBytes(6).toString('base64url').toUpperCase();
  return `${prefix}-${id}`;
}