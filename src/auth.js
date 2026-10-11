import {oauthCallback} from './oauth.js';
const storageKey='paasaa-auth-session';
let configPromise,refreshPromise;
const rawFetch=(...args)=>globalThis.fetch(...args);
export async function authConfig(){
  if(!configPromise)configPromise=rawFetch('/api/config',{cache:'no-store'}).then(async r=>{
    if(r.status===404)return null;
    if(!r.ok)throw Error('Account connection is unavailable. Please try again.');
    const c=await r.json();
    if(c.authProvider!=='supabase'||!/^https:\/\/[a-z0-9]+\.supabase\.co$/.test(c.supabaseUrl)||!c.supabasePublishableKey?.startsWith('sb_publishable_'))throw Error('Account configuration is unavailable.');
    return c;
  }).catch(e=>{configPromise=null;throw e;});
  return configPromise;
}
function saved(){try{return JSON.parse(sessionStorage.getItem(storageKey)||'null');}catch{return null;}}
function save(s){if(!s?.access_token||!s?.refresh_token)throw Error('Sign-in did not complete.');sessionStorage.setItem(storageKey,JSON.stringify({access_token:s.access_token,refresh_token:s.refresh_token,expires_at:s.expires_at||Math.floor(Date.now()/1000)+s.expires_in,isGuest:s.user?.is_anonymous===true}));}
async function authRequest(path,body,token){const c=await authConfig();const r=await rawFetch(c.supabaseUrl+'/auth/v1/'+path,{method:'POST',headers:{apikey:c.supabasePublishableKey,'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:JSON.stringify(body),signal:AbortSignal.timeout(15000)});const d=await r.json().catch(()=>({}));if(!r.ok)throw Error(d.msg||d.error_description||d.message||'Sign-in failed. Please try again.');return d;}
export async function accessToken(){const s=saved();if(!s)return null;if(s.expires_at>Date.now()/1000+60)return s.access_token;if(!refreshPromise)refreshPromise=authRequest('token?grant_type=refresh_token',{refresh_token:s.refresh_token}).then(d=>{save(d);return d.access_token;}).catch(e=>{sessionStorage.removeItem(storageKey);throw e;}).finally(()=>{refreshPromise=null;});return refreshPromise;}
export async function signOut(){const s=saved();if(s?.isGuest&&!confirm('End this guest session? You will lose access to its saved chats and check-ins.'))return;try{if(s)await authRequest('logout',{ },s.access_token);}finally{sessionStorage.removeItem(storageKey);location.reload();}}
const node=(tag,text)=>{const e=document.createElement(tag);if(text)e.textContent=text;return e;};
export async function completeGoogleSignIn(){
  if(new URL(location.href).searchParams.get('auth')!=='callback')return;
  try{const body=oauthCallback(location.href);history.replaceState(null,'','/#home');save(await authRequest('token?grant_type=pkce',body));}
  catch(e){history.replaceState(null,'','/#home');sessionStorage.setItem('paasaa-auth-notice',e.message);}
}
export async function requireAccount(root,retry){
  root.classList.add('account-required');
  let c;try{c=await authConfig();if(!c){root.classList.remove('account-required');return true;}if(await accessToken()){if(!document.getElementById('account-signout')){const out=node('button',saved()?.isGuest?'End guest session':'Sign out');out.id='account-signout';out.className='text-button';out.onclick=signOut;document.querySelector('#profile-settings')?.append(out);}root.classList.remove('account-required');return true;}}catch(e){root.replaceChildren(node('h1','Connect to Paasaa'),node('p',e.message));const b=node('button','Try again');b.onclick=retry;root.append(b);return false;}
  root.replaceChildren(node('h1','Welcome to Paasaa'),node('p','Just your name and country. No email or password needed.'));
  const form=node('form');form.className='account-form';
  const name=node('input'),country=node('input');name.type=country.type='text';name.required=country.required=true;name.maxLength=80;country.maxLength=80;name.autocomplete='nickname';country.autocomplete='country-name';
  for(const [label,input] of [['Name or nickname',name],['Country',country]]){const l=node('label',label);l.append(input);form.append(l);}
  const submit=node('button','Enter Paasaa');submit.type='submit';submit.className='primary';const status=node('p');status.setAttribute('role','status');form.append(submit,status);
  root.append(form,node('p','Your name and country are saved with your private guest session. Closing this tab, clearing browser data, or ending the session can lose access to saved chats and check-ins. Use a nickname if you prefer.'),node('p','For ages 13+. AI support, not a therapist. Chat uses Groq when AI replies are on.'));
  let busy=false;form.onsubmit=async e=>{e.preventDefault();if(busy||!form.reportValidity())return;const displayName=name.value.trim(),countryName=country.value.trim();if(!displayName||!countryName){status.textContent='Please enter your name and country.';return;}busy=true;submit.disabled=true;status.textContent='Opening your space…';try{save(await authRequest('signup',{data:{display_name:displayName,country:countryName}}));await retry();}catch{status.textContent='Your guest session could not start. Please try again shortly.';}finally{busy=false;submit.disabled=false;}};return false;
}
