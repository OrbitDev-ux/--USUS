import path from 'node:path';

export function dataFile(name: string): string {
  return path.resolve(process.cwd(), 'data', name);
}
