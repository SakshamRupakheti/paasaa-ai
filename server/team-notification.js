// Server-only destination. Request bodies cannot choose recipients or content.
const recipient='sakshamrupakheti23@gmail.com';

export async function notifyTeam({email,owner,submissionId,env={},fetcher=fetch}){
  if(!env.RESEND_API_KEY||!env.PAASAA_TEAM_EMAIL_FROM)return {notified:false};
  const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify([owner,email,submissionId])));
  const key='team-connect/'+Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
  // Keep the payload identical across retries. The email's own timestamp records
  // sending time; neither account IDs nor wellness records leave this endpoint.
  const body=JSON.stringify({from:env.PAASAA_TEAM_EMAIL_FROM,to:[recipient],
    subject:'New connection with Team Paasaa',
    text:`Someone submitted the Connect with Team Paasaa form.\n\nEmail: ${email}\nSource: Paasaa homepage\n\nThey agreed to save their email for product updates and share it with Team Paasaa. This address has not been verified.\n\nNo chat, check-in, or health records are included.`});
  for(let attempt=0;attempt<2;attempt++){
    try{
      const response=await fetcher('https://api.resend.com/emails',{method:'POST',
        headers:{Authorization:'Bearer '+env.RESEND_API_KEY,'Content-Type':'application/json','Idempotency-Key':key},
        body,signal:AbortSignal.timeout(6000),redirect:'error'});
      if(response.ok){const data=await response.json();return {notified:typeof data?.id==='string'&&data.id.length>0};}
      // Configuration, quota, and validation errors need operator attention.
      if(response.status<500)return {notified:false};
    }catch{/* Retry one transient failure using the same provider idempotency key. */}
  }
  return {notified:false};
}
