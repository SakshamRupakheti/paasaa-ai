import {validateMood} from '../src/mood-model.js';
export async function moodApi(request,store){
  if(request.method==='GET')return {records:await store.list('mood')};
  if(request.method!=='POST')throw Object.assign(Error('Method not allowed'),{status:405});
  const raw=await request.text();if(raw.length>12000)throw Object.assign(Error('Check-in is too long.'),{status:413});
  const b=validateMood(JSON.parse(raw)),id='mood-'+b.day,existing=await store.get(id);
  if(existing&&existing.kind!=='mood')throw Object.assign(Error('Record conflict'),{status:409});
  if(existing&&existing.mood===b.mood&&existing.note===b.note)return existing;
  if((existing?.revision||0)!==b.revision)throw Object.assign(Error('This check-in changed in another tab. Reload before saving.'),{status:409});
  return store.put({id,kind:'mood',day:b.day,mood:b.mood,note:b.note,createdAt:existing?.createdAt||new Date().toISOString()},'mood',b.revision);
}
