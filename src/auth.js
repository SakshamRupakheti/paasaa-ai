import {beginGoogleOAuth,oauthCallback} from './oauth.js';
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
function save(s){if(!s?.access_token||!s?.refresh_token)throw Error('Sign-in did not complete.');sessionStorage.setItem(storageKey,JSON.stringify({access_token:s.access_token,refresh_token:s.refresh_token,expires_at:s.expires_at||Math.floor(Date.now()/1000)+s.expires_in}));}
async function authRequest(path,body,token){const c=await authConfig();const r=await rawFetch(c.supabaseUrl+'/auth/v1/'+path,{method:'POST',headers:{apikey:c.supabasePublishableKey,'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:JSON.stringify(body),signal:AbortSignal.timeout(15000)});const d=await r.json().catch(()=>({}));if(!r.ok)throw Error(d.msg||d.error_description||d.message||'Sign-in failed. Please try again.');return d;}
export async function accessToken(){const s=saved();if(!s)return null;if(s.expires_at>Date.now()/1000+60)return s.access_token;if(!refreshPromise)refreshPromise=authRequest('token?grant_type=refresh_token',{refresh_token:s.refresh_token}).then(d=>{save(d);return d.access_token;}).catch(e=>{sessionStorage.removeItem(storageKey);throw e;}).finally(()=>{refreshPromise=null;});return refreshPromise;}
export async function signOut(){const s=saved();try{if(s)await authRequest('logout',{ },s.access_token);}finally{sessionStorage.removeItem(storageKey);location.reload();}}
const node=(tag,text)=>{const e=document.createElement(tag);if(text)e.textContent=text;return e;};
export async function completeGoogleSignIn(){
  if(new URL(location.href).searchParams.get('auth')!=='callback')return;
  try{const body=oauthCallback(location.href);history.replaceState(null,'','/#chat');save(await authRequest('token?grant_type=pkce',body));}
  catch(e){history.replaceState(null,'','/#chat');sessionStorage.setItem('paasaa-auth-notice',e.message);}
}
export async function requireAccount(root,retry){
  let c;try{c=await authConfig();if(!c)return true;if(await accessToken()){if(!document.getElementById('account-signout')){const out=node('button','Sign out');out.id='account-signout';out.className='text-button';out.onclick=signOut;document.querySelector('header')?.append(out);}return true;}}catch(e){root.replaceChildren(node('h1','Connect to Paasaa'),node('p',e.message));const b=node('button','Try again');b.onclick=retry;root.append(b);return false;}
  root.replaceChildren(node('h1','Your space, saved for you'),node('p','Sign in to chat and return to your worry reflections. Breathing and daily check-ins are available without an account.'));
  const google=node('button','Continue with Google');google.className='google-signin';google.type='button';const googleStatus=node('p');googleStatus.setAttribute('role','status');googleStatus.textContent=sessionStorage.getItem('paasaa-auth-notice')||'';sessionStorage.removeItem('paasaa-auth-notice');google.onclick=async()=>{google.disabled=true;try{const settings=await rawFetch(c.supabaseUrl+'/auth/v1/settings',{headers:{apikey:c.supabasePublishableKey},signal:AbortSignal.timeout(10000)});if(!settings.ok||(await settings.json()).external?.google!==true)throw Error('Google sign-in is still being configured. Please use email for now.');location.assign(await beginGoogleOAuth(c));}catch(e){googleStatus.textContent=e.message;google.disabled=false;}};root.append(google,googleStatus,node('p','Or continue with email'));
  const form=node('form');form.className='account-form';const email=node('input'),password=node('input');email.type='email';email.autocomplete='email';email.required=true;password.type='password';password.autocomplete='current-password';password.required=true;password.minLength=8;
  for(const [label,input] of [['Email',email],['Password',password]]){const l=node('label',label);l.append(input);form.append(l);}
  const submit=node('button','Sign in');submit.type='submit';submit.className='primary';const signup=node('button','Create account');signup.type='button';const status=node('p');status.setAttribute('role','status');form.append(submit,signup,status);root.append(form,node('p','Your sign-in stays in this tab. AI is optional and requires your consent before text is sent to Groq.'));
  let busy=false;async function run(create){if(busy||!form.reportValidity())return;busy=true;submit.disabled=signup.disabled=true;status.textContent=create?'Creating your account…':'Signing in…';try{const d=await authRequest(create?'signup':'token?grant_type=password',{email:email.value.trim(),password:password.value});password.value='';if(d.access_token){save(d);await retry();}else status.textContent='Check your email to confirm your account, then return here and sign in.';}catch(e){status.textContent=e.message;}finally{busy=false;submit.disabled=signup.disabled=false;}}
  form.onsubmit=e=>{e.preventDefault();run(false);};signup.onclick=()=>run(true);return false;
}
