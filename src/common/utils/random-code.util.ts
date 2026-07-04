import { randomBytes } from 'crypto';

export function generateInvitationCode(length = 8): string {
  return randomBytes(8)
    .toString('base64url')
    .replace(/[^a-zA-Z0-9]/g, '')
    .slice(0, length)
    .toUpperCase();
}
