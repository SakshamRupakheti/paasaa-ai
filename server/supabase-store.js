const conflict=()=>Object.assign(Error('This record changed in another tab. Reload before continuing.'),{status:409});
const unavailable=()=>Object.assign(Error('Saved records are temporarily unavailable. Your input remains on screen.'),{status:503});
const columns='id,kind,payload,revision,updated_at';
const identifier=/^[\w-]{1,160}$/;

// Every REST call uses the patient's verified JWT. Supabase RLS remains an
// independent ownership boundary even if an application filter is omitted.
export class SupabaseRecordStore {
  constructor({url,publishableKey,token,owner,fetcher=fetch}){
    this.url=url;this.owner=owner;this.fetcher=fetcher;
    this.headers={apikey:publishableKey,Authorization:`Bearer ${token}`,'Content-Type':'application/json'};
  }
  async request(path,{method='GET',body,representation=false}={}){
    let response;
    try{response=await this.fetcher(`${this.url}/rest/v1/${path}`,{method,headers:{...this.headers,...(representation?{Prefer:'return=representation'}:{})},body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(10000),cache:'no-store',redirect:'error'});}
    catch{throw unavailable();}
    if(response.status===401)throw Object.assign(Error('Your sign-in expired. Sign in again; your input remains on screen.'),{status:401});
    if(response.status===409)throw conflict();
    if(!response.ok)throw unavailable();
    try{return await response.json();}catch{throw unavailable();}
  }
  row(row){
    if(!row||typeof row.payload!=='object'||!row.payload||Array.isArray(row.payload)||!Number.isInteger(row.revision))throw unavailable();
    return {...row.payload,id:row.id,kind:row.kind,revision:row.revision,updatedAt:row.updated_at};
  }
  query(filters){return new URLSearchParams({owner:`eq.${this.owner}`,...filters}).toString();}
  async list(kind){
    if(!['worry','conversation'].includes(kind))throw Error('Invalid record kind');
    const rows=await this.request(`paasaa_records?${this.query({kind:`eq.${kind}`,select:columns,order:'updated_at.desc',limit:'200'})}`);
    if(!Array.isArray(rows))throw unavailable();return rows.map(row=>this.row(row));
  }
  async get(id){
    if(!identifier.test(id))return null;
    const rows=await this.request(`paasaa_records?${this.query({id:`eq.${id}`,select:columns,limit:'1'})}`);
    if(!Array.isArray(rows))throw unavailable();return rows.length?this.row(rows[0]):null;
  }
  async put(record,kind,expected){
    if(!record||!identifier.test(record.id)||!['worry','conversation'].includes(kind)||!Number.isSafeInteger(expected)||expected<0)throw Error('Invalid record');
    const updatedAt=new Date().toISOString();
    const payload={...record,id:record.id,kind,updatedAt,revision:expected+1};
    const body={payload,revision:expected+1,updated_at:updatedAt};
    const rows=expected===0
      ?await this.request(`paasaa_records?select=${columns}`,{method:'POST',body:{owner:this.owner,id:record.id,kind,...body},representation:true})
      :await this.request(`paasaa_records?${this.query({id:`eq.${record.id}`,kind:`eq.${kind}`,revision:`eq.${expected}`,select:columns})}`,{method:'PATCH',body,representation:true});
    if(!Array.isArray(rows))throw unavailable();if(rows.length!==1)throw conflict();return this.row(rows[0]);
  }
  async limit(){
    // The database computes the owner, hourly bucket, and fixed limit. Clients
    // cannot set the counter, supply another owner, or choose a future bucket.
    const allowed=await this.request('rpc/paasaa_take_ai_quota',{method:'POST',body:{}});
    if(typeof allowed!=='boolean')throw unavailable();return allowed;
  }
}
