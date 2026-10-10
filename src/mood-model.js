export const MOODS=Object.freeze([
  {id:'good',label:'Good',symbol:'🙂'},{id:'okay',label:'Okay',symbol:'😐'},
  {id:'anxious',label:'Anxious',symbol:'😟'},{id:'low',label:'Low',symbol:'😔'},
  {id:'unsure',label:'Not sure',symbol:'🤔'}
]);
export const localDay=(date=new Date())=>`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
export function weekDays(date=new Date()){return Array.from({length:7},(_,i)=>{const d=new Date(date);d.setDate(d.getDate()-6+i);return localDay(d);});}
// Moods are categories, not ordered scores. One correctable observation per local day.
export function moodWeek(records,date=new Date()){return weekDays(date).map(day=>({day,record:records.find(r=>r.day===day)||null}));}
export function validateMood(body){
  const date=new Date(body?.day+'T12:00:00Z');
  if(!body||!/^\d{4}-\d{2}-\d{2}$/.test(body.day)||!Number.isFinite(date.getTime())||date.toISOString().slice(0,10)!==body.day||!MOODS.some(m=>m.id===body.mood)||typeof body.note!=='string'||body.note.length>2000||!Number.isSafeInteger(body.revision)||body.revision<0)throw Object.assign(Error('Invalid mood check-in.'),{status:400});
  return {day:body.day,mood:body.mood,note:body.note.trim(),revision:body.revision};
}
