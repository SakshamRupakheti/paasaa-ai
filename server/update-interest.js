// Separate, explicit marketing opt-in. Never copies chat/check-in data.
export async function registerUpdateInterest(request,{config,token,owner,limit,fetcher=fetch}){
  const reply=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
  if(request.method!=='POST')return reply({error:'Method not allowed'},405);
  if(Number(request.headers.get('content-length')||0)>1024)return reply({error:'Request too large'},413);
  let body;try{const text=await request.text();if(text.length>1024)return reply({error:'Request too large'},413);body=JSON.parse(text);}catch{return reply({error:'Invalid request'},400);}
  const email=typeof body?.email==='string'?body.email.trim().toLowerCase():'';
  if(email.length>254||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return reply({error:'Enter a valid email address'},400);
  try{
    if(!await limit())return reply({error:'Please try again later'},429);
    const r=await fetcher(config.supabaseUrl+'/rest/v1/paasaa_update_interest?on_conflict=owner',{method:'POST',headers:{apikey:config.supabasePublishableKey,Authorization:'Bearer '+token,'Content-Type':'application/json',Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify({owner,email,consent_version:'product-updates-v1',updated_at:new Date().toISOString()}),signal:AbortSignal.timeout(10000),redirect:'error'});
    if(!r.ok)return reply({error:'Updates signup is unavailable'},503);
    return reply({registered:true});
  }catch{return reply({error:'Updates signup is unavailable'},503);}
}
