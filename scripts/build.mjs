import { mkdir, copyFile, readdir } from 'node:fs/promises';
await mkdir(new URL('../dist/', import.meta.url), { recursive: true });
for (const name of await readdir(new URL('../src/', import.meta.url))) {
  await copyFile(new URL(`../src/${name}`, import.meta.url), new URL(`../dist/${name}`, import.meta.url));
}
console.log('Static website copied to dist.');
