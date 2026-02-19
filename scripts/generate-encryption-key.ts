import { randomBytes } from 'node:crypto';

const key = randomBytes(32).toString('base64');
console.log('Generated ENCRYPTION_KEY (base64, 32 bytes):');
console.log(key);
