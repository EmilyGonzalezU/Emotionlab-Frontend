import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const envFile = resolve('.env.production.local');
const fileValue = existsSync(envFile)
  ? readFileSync(envFile, 'utf8').match(/^VITE_API_URL=(.*)$/m)?.[1]?.trim()
  : undefined;
const value = process.env.VITE_API_URL?.trim() || fileValue;

if (!value) {
  console.error(
    'Build detenido: falta VITE_API_URL. Use la URL de API Gateway del output Terraform api_endpoint.'
  );
  process.exit(1);
}

try {
  const url = new URL(value);
  const reservedHost = url.hostname === 'localhost'
    || url.hostname.endsWith('.localhost')
    || url.hostname === '127.0.0.1'
    || url.hostname === '::1'
    || url.hostname.endsWith('.test')
    || url.hostname.endsWith('.invalid')
    || url.hostname.endsWith('.example')
    || url.hostname.split('.')[0] === 'example';
  if (url.protocol !== 'https:' || reservedHost) {
    throw new Error('debe ser una URL HTTPS de producción y no puede usar un dominio reservado de prueba');
  }
} catch (error) {
  console.error(`Build detenido: VITE_API_URL ${error.message}.`);
  process.exit(1);
}
