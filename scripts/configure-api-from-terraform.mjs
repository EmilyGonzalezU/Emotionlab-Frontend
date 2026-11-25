import { appendFileSync, existsSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { WORKSPACE_ROOT } from './workspace-paths.mjs';
import { validateApiUrl } from './validate-api-url.mjs';

const terraformDir = resolve(
  process.argv[2] || resolve(WORKSPACE_ROOT, 'infrastructure/terraform/environments/dev'),
);
const terraformBin = process.env.TERRAFORM_BIN || 'terraform';
const apiUrl = execFileSync(
  terraformBin,
  ['-chdir=' + terraformDir, 'output', '-raw', 'api_endpoint'],
  { encoding: 'utf8' },
).trim();
validateApiUrl(apiUrl);

const sharedEnvFile = resolve(WORKSPACE_ROOT, '.env');
const existing = existsSync(sharedEnvFile)
  ? readFileSync(sharedEnvFile, 'utf8')
  : '';
const configuredLine = existing.match(/^\s*VITE_API_URL\s*=(.*)$/m)?.[1]?.trim();

if (configuredLine !== undefined) {
  if (configuredLine.replace(/^(['"])(.*)\1$/, '$2') !== apiUrl) {
    throw new Error('El .env raíz ya define VITE_API_URL. Revíselo manualmente; no se sobrescribió.');
  }
  console.log('VITE_API_URL ya coincide con el output api_endpoint del entorno dev.');
} else {
  const prefix = existing && !existing.endsWith('\n') ? '\n' : '';
  appendFileSync(sharedEnvFile, `${prefix}# URL pública de API para Vite; el frontend solo expone variables VITE_.\nVITE_API_URL=${apiUrl}\n`, {
    encoding: 'utf8',
    mode: 0o600,
  });
  console.log('VITE_API_URL se agregó al .env raíz desde el entorno Terraform dev.');
}
