const pendingKey='paasaa-google-pkce';
const base64url=bytes=>btoa(String.fromCharCode(...bytes)).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'');
export async function beginGoogleOAuth(config,{storage=sessionStorage,origin=location.origin,cryptoApi=crypto,now=Date.now()}={}){
  const verifier=base64url(cryptoApi.getRandomValues(new Uint8Array(32)));
  const challenge=base64url(new Uint8Array(await cryptoApi.subtle.digest('SHA-256',new TextEncoder().encode(verifier))));
  storage.setItem(pendingKey,JSON.stringify({verifier,started:now}));
  const url=new URL('/auth/v1/authorize',config.supabaseUrl);
  url.search=new URLSearchParams({provider:'google',redirect_to:origin+'/?auth=callback',code_challenge:challenge,code_challenge_method:'s256',scopes:'openid email profile'});
  return url.href;
}
export function oauthCallback(url,storage=sessionStorage,now=Date.now()){
  const u=new URL(url);if(u.searchParams.get('auth')!=='callback')return null;
  const raw=storage.getItem(pendingKey);storage.removeItem(pendingKey);
  if(u.searchParams.has('error'))throw Error('Google sign-in was cancelled or unavailable. Please try again.');
  let pending;try{pending=JSON.parse(raw);}catch{}
  if(!pending||typeof pending.verifier!=='string'||!/^[A-Za-z0-9_-]{43}$/.test(pending.verifier)||!Number.isFinite(pending.started)||now-pending.started>600000||now<pending.started)throw Error('This sign-in expired. Start Google sign-in again in this tab.');
  const code=u.searchParams.get('code');if(!code||code.length>2048)throw Error('Google did not return a valid sign-in code.');
  return {auth_code:code,code_verifier:pending.verifier};
}
