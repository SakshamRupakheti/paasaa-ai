import {cp,mkdir,readFile,writeFile} from 'node:fs/promises';
await mkdir('dist-vercel',{recursive:true});
await cp('src','dist-vercel',{recursive:true});
const file='dist-vercel/index.html';
const html=await readFile(file,'utf8');
await writeFile(file,html.replace('<body>', '<body><aside role="status" style="padding:12px 20px;background:#eaf4fa;color:#244863;text-align:center;font:14px/1.5 system-ui">Vercel preview · Breathing and on-device check-ins are available. Chat and saved worry records are not connected here yet.</aside>'));
console.log('Built Vercel website preview. No secrets or saved records included.');
