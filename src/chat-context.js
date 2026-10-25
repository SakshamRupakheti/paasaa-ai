export function localChatContext(now=new Date()) {
  const h=now.getHours();
  return {localTime:`${String(h).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`,
    localDate:`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`,
    dayPeriod:h<5?'night':h<12?'morning':h<17?'afternoon':h<22?'evening':'night',
    timezone:Intl.DateTimeFormat().resolvedOptions().timeZone};
}
export function validateLocalContext(value) {
  if(!value||!/^\d{2}:\d{2}$/.test(value.localTime)||!/^\d{4}-\d{2}-\d{2}$/.test(value.localDate)||typeof value.timezone!=='string'||value.timezone.length>80)return null;
  const [h,m]=value.localTime.split(':').map(Number);
  if(h>23||m>59||!Number.isFinite(Date.parse(value.localDate)))return null;
  try{new Intl.DateTimeFormat('en',{timeZone:value.timezone});}catch{return null;}
  return {localTime:value.localTime,localDate:value.localDate,timezone:value.timezone,dayPeriod:h<5?'night':h<12?'morning':h<17?'afternoon':h<22?'evening':'night'};
}
export function greeting(context) {
  return ({morning:'Good morning ☀️ What’s on your mind?',afternoon:'Good afternoon 😄 What’s going on?',evening:'Good evening 🙂 How’s your day been?',night:'Hey 🙂 What’s on your mind tonight?'})[context?.dayPeriod]||'Hey 😄 What’s up?';
}
