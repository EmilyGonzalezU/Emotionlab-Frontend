import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const terraformDir = resolve(process.argv[2] || '../Emotionlab-Backend/infrastructure/terraform/environments/portable');
const apiUrl = execFileSync('terraform', ['-chdir=' + terraformDir, 'output', '-raw', 'api_endpoint'], { encoding: 'utf8' }).trim();
const parsed = new URL(apiUrl);
if (parsed.protocol !== 'https:') throw new Error('Terraform api_endpoint debe ser HTTPS.');
writeFileSync(new URL('../.env.production.local', import.meta.url), `VITE_API_URL=${apiUrl}\n`, { mode: 0o600 });
console.log(`Frontend configurado para ${apiUrl}`);
