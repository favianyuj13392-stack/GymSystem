import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), '.data');
const FILE_PATH = path.join(DATA_DIR, 'configuraciones_fallback.json');

function ensureDirectoryExists() {
  if (!fs.existsSync(DATA_DIR)) {
    try {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    } catch (e) {
      console.warn('No se pudo crear directorio .data:', e);
    }
  }
}

export function readConfigFallback(clave: string): any | null {
  try {
    ensureDirectoryExists();
    if (fs.existsSync(FILE_PATH)) {
      const content = fs.readFileSync(FILE_PATH, 'utf-8');
      const store = JSON.parse(content);
      return store[clave] || null;
    }
  } catch (err) {
    console.warn(`Error leyendo config fallback (${clave}):`, err);
  }
  return null;
}

export function writeConfigFallback(clave: string, valor: any): boolean {
  try {
    ensureDirectoryExists();
    let store: Record<string, any> = {};
    if (fs.existsSync(FILE_PATH)) {
      try {
        const content = fs.readFileSync(FILE_PATH, 'utf-8');
        store = JSON.parse(content);
      } catch (e) {
        store = {};
      }
    }
    store[clave] = valor;
    fs.writeFileSync(FILE_PATH, JSON.stringify(store, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.warn(`Error guardando config fallback (${clave}):`, err);
    return false;
  }
}
