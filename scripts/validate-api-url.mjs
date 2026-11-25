import { loadEnv } from 'vite';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { WORKSPACE_ROOT } from './workspace-paths.mjs';

export function validateApiUrl(value) {
  if (!value?.trim()) throw new Error('falta VITE_API_URL');
  const url = new URL(value.trim());
  const hostname = url.hostname.toLowerCase();
  const reservedExamples = ['example.com', 'example.net', 'example.org'];
  const reservedHost = hostname === 'localhost'
    || hostname.endsWith('.localhost')
    || hostname === '127.0.0.1'
    || hostname === '::1'
    || hostname.endsWith('.test')
    || hostname.endsWith('.invalid')
    || hostname.endsWith('.example')
    || hostname.split('.').includes('example')
    || reservedExamples.some((domain) => hostname === domain || hostname.endsWith(`.${domain}`));
  if (url.protocol !== 'https:' || reservedHost || url.username || url.password) {
    throw new Error('debe ser una URL HTTPS sin credenciales ni dominio reservado de prueba');
  }
  return url;
}

export function readConfiguredApiUrl() {
  const fileEnv = loadEnv('production', WORKSPACE_ROOT, 'VITE_');
  return process.env.VITE_API_URL?.trim() || fileEnv.VITE_API_URL?.trim() || '';
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    validateApiUrl(readConfiguredApiUrl());
  } catch (error) {
    console.error(`Build detenido: ${error.message}. Configure VITE_API_URL en el .env raíz o en el entorno.`);
    process.exit(1);
  }
}
