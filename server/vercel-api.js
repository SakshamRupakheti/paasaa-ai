import {handleApi} from './api.js';
import {SupabaseRecordStore} from './supabase-store.js';
import {prototypeAllowed,prototypeData} from './admin-prototype.js';
import {publicServiceStatus,isClinicalPath} from './service-policy.js';

const json=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
const signIn=()=>json({error:'Sign in to use chat and saved records.'},401);
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function publicConfig(env){
  try{
    const url=new URL(env.SUPABASE_URL),key=env.SUPABASE_PUBLISHABLE_KEY;
    if(url.protocol!=='https:'||url.username||url.password||url.search||url.hash||url.pathname!=='/'||typeof key!=='string')return null;
    let publishable=key.startsWith('sb_publishable_');
    // Legacy anon keys remain supported; secret/service-role keys never leave
    // the server, even if an environment variable was accidentally misconfigured.
    if(!publishable&&key.split('.').length===3){try{publishable=JSON.parse(atob(key.split('.')[1].replaceAll('-','+').replaceAll('_','/'))).role==='anon';}catch{}}
    return publishable?{authProvider:'supabase',supabaseUrl:url.origin,supabasePublishableKey:key}:null;
  }catch{return null;}
}

export function apiRequest(request){
  const url=new URL(request.url);
  if(url.pathname==='/api/index'&&url.searchParams.has('path')){
    const values=url.searchParams.getAll('path'),path=values[0];
    if(values.length!==1||!path||!/^[-\w/]+$/.test(path)||path.includes('//'))throw Error('Invalid API path');
    url.pathname='/api/'+path;url.searchParams.delete('path');
  }
  const headers=new Headers(request.headers);headers.delete('oai-authenticated-user-id');
  return new Request(url,new Request(request,{headers}));
}

export async function handleVercelApi(incoming,env,fetcher=fetch){
  let request;
  try{request=apiRequest(incoming);}catch{return json({error:'Invalid API path'},400);}
  const url=new URL(request.url);
  if(!['GET','HEAD'].includes(request.method)&&request.headers.get('Origin')!==url.origin)return json({error:'This request must come from Paasaa.'},403);
  if(url.pathname==='/api/service-status')return request.method==='GET'?json(publicServiceStatus(env)):json({error:'Method not allowed'},405);
  const config=publicConfig(env);
  if(!config)return json({error:'Account storage is not configured yet. Breathing and on-device check-ins are available.',ai:false,persistence:false},503);
  if(url.pathname==='/api/config')return request.method==='GET'?json(config):json({error:'Method not allowed'},405);
  const authorization=request.headers.get('Authorization')||'',match=authorization.match(/^Bearer ([^\s,]{1,8192})$/i);
  if(!match)return signIn();
  const token=match[1];let response,user;
  try{
    response=await fetcher(`${config.supabaseUrl}/auth/v1/user`,{headers:{apikey:config.supabasePublishableKey,Authorization:`Bearer ${token}`},signal:AbortSignal.timeout(10000),cache:'no-store',redirect:'error'});
    if(response.status===401||response.status===403)return signIn();
    if(!response.ok)return json({error:'Sign-in could not be verified right now. Try again shortly.'},503);
    user=await response.json();
  }catch{return json({error:'Sign-in could not be verified right now. Try again shortly.'},503);}
  if(!uuid.test(user?.id)||user.is_anonymous===true)return signIn();
  if(isClinicalPath(url.pathname))return json({error:'Clinical services are not enabled. Use Help and support for immediate resources.',code:'CLINICAL_SERVICE_NOT_IMPLEMENTED'},503);
  if(url.pathname==='/api/admin/prototype'){
    if(!prototypeAllowed(user,env))return json({error:'This internal prototype is available only to the configured owner.'},403);
    return request.method==='GET'?json(prototypeData()):json({error:'Read-only prototype'},405);
  }
  const store=new SupabaseRecordStore({url:config.supabaseUrl,publishableKey:config.supabasePublishableKey,token,owner:user.id,fetcher});
  return handleApi(request,env,{owner:user.id,store});
}
