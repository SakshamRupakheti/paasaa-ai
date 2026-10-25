import {authConfig,accessToken,isGuest} from './auth.js';
let guestState=null,guestQueue=Promise.resolve();
export async function apiFetch(path,options={}){
  const url=new URL(path,location.origin);
  if(url.origin!==location.origin||!url.pathname.startsWith('/api/'))throw Error('Invalid Paasaa API destination.');
  const headers=new Headers(options.headers);
  if(await authConfig()){const token=await accessToken();if(!token)throw Error('Your sign-in expired. Return to Talk to Paasaa and sign in again.');headers.set('Authorization','Bearer '+token);}
  if(isGuest()&&/^\/api\/(moods|worries|conversations)(\/|$)/.test(url.pathname)){
    const run=guestQueue.catch(()=>{}).then(async()=>{
      const response=await fetch('/api/guest',{method:'POST',headers:{...Object.fromEntries(headers),'Content-Type':'application/json'},body:JSON.stringify({path:url.pathname,method:options.method||'GET',body:options.body,state:guestState}),cache:'no-store',redirect:'error'});
      const envelope=await response.json();if(envelope.state)guestState=envelope.state;
      return new Response(JSON.stringify(envelope.data||{error:'Temporary session unavailable.'}),{status:response.status,headers:{'Content-Type':'application/json'}});
    });guestQueue=run;return run;
  }
  return fetch(url,{...options,headers,cache:'no-store',redirect:'error'});
}
