import {cp,mkdir} from 'node:fs/promises';
await mkdir('dist-vercel',{recursive:true});
await cp('src','dist-vercel',{recursive:true});
console.log('Built Vercel frontend. Authentication and AI run through server functions; no secrets are copied.');
