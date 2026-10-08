import {authConfig,accessToken} from './auth.js';
export async function apiFetch(path,options={}){
  const url=new URL(path,location.origin);
  if(url.origin!==location.origin||!url.pathname.startsWith('/api/'))throw Error('Invalid Paasaa API destination.');
  const headers=new Headers(options.headers);
  if(await authConfig()){const token=await accessToken();if(!token)throw Error('Your sign-in expired. Return to Talk to Paasaa and sign in again.');headers.set('Authorization','Bearer '+token);}
  return fetch(url,{...options,headers,cache:'no-store',redirect:'error'});
}
