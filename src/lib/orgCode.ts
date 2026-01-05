import crypto from 'crypto';

<<<<<<< HEAD
/**
 * Generate organization code in format: SV-XXXX
 * Where XXXX is 4 characters, first 2 are org identity, last 2 are also org identity
 */
export function generateOrgCode(prefix = 'SV'): string {
  // Generate 2 random alphanumeric characters for org identity
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let identity = '';
  for (let i = 0; i < 2; i++) {
    identity += chars[Math.floor(Math.random() * chars.length)];
  }
  // Format: SV-XXXX where XXXX = identity + identity (4 chars total)
  return `${prefix}-${identity}${identity}`;
}

/**
 * Generate member code in format: XXXXX (5 characters)
 * First 2 characters are organization identity (from orgCode)
 * Last 3 characters are unique member identifier
 */
export function generateMemberCode(orgIdentity: string): string {
  // Extract org identity from orgCode (last 2 chars before the last 2)
  // If orgCode is SV-XXXX, identity is first 2 of XXXX
  const orgId = orgIdentity.substring(0, 2).toUpperCase();
  
  // Generate 3 unique characters for member
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let memberId = '';
  for (let i = 0; i < 3; i++) {
    memberId += chars[Math.floor(Math.random() * chars.length)];
  }
  
  // Format: XXXXX (orgIdentity(2) + memberId(3))
  return `${orgId}${memberId}`;
}

/**
 * Extract organization identity from orgCode
 * If orgCode is SV-XXXX, returns first 2 characters of XXXX
 */
export function extractOrgIdentity(orgCode: string): string {
  // Format: SV-XXXX
  const parts = orgCode.split('-');
  if (parts.length === 2 && parts[1].length === 4) {
    return parts[1].substring(0, 2).toUpperCase();
  }
  // Fallback: generate random identity if format is wrong
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let identity = '';
  for (let i = 0; i < 2; i++) {
    identity += chars[Math.floor(Math.random() * chars.length)];
  }
  return identity;
=======
export function generateOrgCode(prefix = 'SV'){
  // 6 random bytes => 8 base64url chars when encoded
  const id = crypto.randomBytes(6).toString('base64url').toUpperCase();
  return `${prefix}-${id}`;
>>>>>>> 6c7180de8b91f8b1e67e5630306b7f3e7c27ebf7
}