import {readdir} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
for(const dir of ['src','server','scripts'])for(const file of await readdir(dir)){if(!/\.(js|mjs)$/.test(file))continue;const r=spawnSync(process.execPath,['--check',dir+'/'+file],{stdio:'inherit'});if(r.status)process.exit(r.status);}
console.log('All JavaScript syntax checks passed.');
