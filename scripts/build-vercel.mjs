import {cp,mkdir,writeFile} from 'node:fs/promises';
import {TRUST_PAGES,renderTrustPage} from '../src/trust-content.js';
await mkdir('dist-vercel',{recursive:true});
await cp('src','dist-vercel',{recursive:true});
for(const slug of Object.keys(TRUST_PAGES))await writeFile(`dist-vercel/${slug}.html`,renderTrustPage(slug));
console.log('Built Vercel frontend. Authentication and AI run through server functions; no secrets are copied.');
