export function newMemory(){return {version:1,environment:'unknown',physicalCaution:false,event:null,eventStartsInMinutes:null,wantsAdvice:true,questionsAllowed:true,breathingRejected:false,breathingMadeWorse:false,interventionsTried:[],interventionsRejected:[],interventionHistory:[],arousalTrend:'unknown',intrusiveThoughtPresent:false,reassuranceUrge:false,safetyPending:false,unresolvedUrgent:null,summary:''};}
export function updateMemory(previous,message,activeId=null){
  const m={...newMemory(),...structuredClone(previous||{})},t=message.toLowerCase().replace(/[’]/g,"'");
  if(/injur|recent surgery|muscle pain|shoulder (?:hurts|pain)/.test(t))m.physicalCaution=true;
  if(/driving|operating machinery/.test(t))m.environment='driving';
  else if(/parked|stopped driving/.test(t))m.environment='private';
  else if(/public|around people|in class|in a meeting|on (?:a |the )bus|at work/.test(t))m.environment='public';
  else if(/at home|somewhere private|alone in my room/.test(t))m.environment='private';
  for(const event of ['presentation','speech','exam','interview','meeting','date','party','sleep'])if(new RegExp('\\b'+event+'\\b').test(t))m.event=event;
  const minutes=t.match(/\bin (\d{1,3}) (?:minutes?|mins?)\b/);if(minutes)m.eventStartsInMinutes=Number(minutes[1]);
  if(/no (?:more )?exercises|no advice|don't want (?:advice|help)|just (?:talk|listen)|stop giving.*exercises|only wanted to tell|just wanted to tell/.test(t))m.wantsAdvice=false;
  if(/(?:want|please|let's|help me|can we).{0,20}(?:try|exercise|breath|relax)/.test(t)&&!/don't|do not|no /.test(t))m.wantsAdvice=true;
  if(/stop asking|no (?:more )?questions|don't want to answer|cannot answer|can't answer/.test(t))m.questionsAllowed=false;
  if(/you can ask|ask me a question/.test(t))m.questionsAllowed=true;
  const rejectBreathing=/don't.*breath|no breath|stop.*breath|breath.{0,30}(?:worse|dizzy|uncomfortable|breathless)/.test(t);
  if(rejectBreathing){m.breathingRejected=true;if(/worse|dizzy|uncomfortable|breathless/.test(t))m.breathingMadeWorse=true;m.interventionsRejected.push('paced_breathing');}
  if(/intrusive|unwanted|images of hurting|thought.*don't want/.test(t))m.intrusiveThoughtPresent=true;
  if(/promise|100%|absolutely sure|are you sure|guarantee/.test(t))m.reassuranceUrge=true;
  if(activeId&&/^(?:no|can't|cannot|stop|same|worse)|not helping|nothing|did nothing|still bad|still stuck|didn.t work|isn.t helping|this is annoying|made.*worse/.test(t)){
    const outcome=/worse|dizzy|pain/.test(t)?'WORSE':/same|nothing|still bad/.test(t)?'SAME':'UNKNOWN';
    m.interventionHistory.push({id:activeId,outcome});m.interventionsRejected.push(activeId);m.arousalTrend=outcome==='WORSE'?'worse':'unchanged';
  }else if(activeId&&/better|easier|helped/.test(t)){m.interventionHistory.push({id:activeId,outcome:'BETTER'});m.arousalTrend='easier';}
  if(/already tried shoulders|shoulder.*(?:did nothing|not help)/.test(t)){m.interventionsRejected.push('pmr_shoulders');m.interventionHistory.push({id:'pmr_shoulders',outcome:'SAME'});}
  m.interventionsRejected=[...new Set(m.interventionsRejected)].slice(-20);m.interventionsTried=[...new Set(m.interventionsTried)].slice(-20);m.interventionHistory=m.interventionHistory.slice(-12);
  m.summary=`Context mentioned: ${m.event||'not specified'}; environment ${m.environment}; advice ${m.wantsAdvice?'allowed':'declined'}; questions ${m.questionsAllowed?'allowed':'declined'}; response to exercises ${m.arousalTrend}.`;
  return m;
}
export function compactContext(session,message,memory){return {message,recent:(session.transcript||[]).slice(-8).map(t=>({role:t.role,text:t.text.slice(0,900)})),memory:{...memory,unresolvedUrgent:!!memory.unresolvedUrgent},summary:memory.summary};}
export const sensitiveThought=message=>/intrusive|unwanted|images of hurting|(?:hurt|kill|stab|shoot).{0,30}(?:mother|father|someone|somebody|him|her)|sexual thought/i.test(message);
export function storedText(message){return sensitiveThought(message)?'[Private thought content omitted; support for an unwanted or harm-related thought was discussed.]':message;}
