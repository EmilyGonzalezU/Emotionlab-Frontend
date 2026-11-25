import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const FRONTEND_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const WORKSPACE_ROOT = resolve(FRONTEND_ROOT, '../Emotionlab-Backend');
