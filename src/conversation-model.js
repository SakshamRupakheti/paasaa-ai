import {newWorry} from './worry-model.js';
import {safetySignal} from './safety-signals.js';

const choice=(id,label)=>({id,label});
const owns=(o,k)=>Object.hasOwn(o,k);
const text=value=>typeof value==='string'?value.trim():'';
const normal=value=>text(value).toLowerCase().replace(/[’']/g,'').replace(/[^\p{L}\p{N} ]/gu,'').replace(/\s+/g,' ');
export const overwhelmed=value=>/can.?t (think|focus|do this)|cannot (think|focus)|mind won.?t stop|freaking out|completely stuck|don.?t want to answer|too overwhelmed/i.test(value);
export const breathingDeclined=value=>/breath\w*.{0,30}(worse|doesn.?t help|not help)|(?:don.?t want|no|stop|skip|hate).{0,15}breath/i.test(value);
export const clarificationQuestion=value=>/^(what (is|are|does|do you mean)|how (does|do i|can i)|can you (explain|clarify)|should i (take|change)|do i have)\b/i.test(text(value));
const notHelping=value=>/^(no|nope|not really)[.! ]*$|still.{0,12}stuck|not helping|isn.?t helping|doesn.?t help|makes it worse/i.test(value);
export const interventions={
  grounding:{label:'Notice a point of contact',type:'grounding',message:'Let’s leave solving it aside for a moment. If it’s comfortable, notice where your feet or another part of you meets a surface. What do you notice there?'},
  release:{label:'Ease a little tension',type:'grounding',message:'No need to tense anything. If it feels comfortable, let your hands rest and soften your shoulders a little. You can leave anything painful alone. How is that for you?'},
  orientation:{label:'Look around gently',type:'grounding',message:'Keep your eyes open if that feels comfortable. Notice one ordinary object nearby. What colour or shape can you see?'},
  attention:{label:'Shift attention',type:'grounding',message:'Would you like to notice one sound around you for a moment? You don’t need to push the worry away. Tell me what you noticed, or say if you want something else.'},
  express:{label:'Put it into words',type:'text',message:'We don’t need to sort or solve it. You can tell me a little of what’s going through your head, in whatever order it comes.'},
  breathing:{label:'Try gentle breathing',type:'breathing',message:'Only if it feels comfortable, let your breath move gently at its own pace. No deep breath or counting is required. Stop if it feels worse. How is that for you?'},
};
export const fields={
  worry:{question:'What’s been worrying you?',phase:'UNDERSTAND'},
  prediction:{question:'What specifically are you afraid might happen?',phase:'UNDERSTAND'},
  actionability:{question:'Is there something useful you can do about this now, or is most of it about what might happen?',choices:[choice('Something I can act on','There’s something I can do'),choice('An uncertain prediction','It’s mostly “what if”'),choice('Both','A bit of both')],phase:'UNDERSTAND'},
  control:{question:'What part is within your control?'},
  possibleActions:{question:'What are a few options you could realistically consider?'},
  nextStep:{question:'What’s one small next step you want to take?'},
  actionWhen:{question:'When could you do it?'},
  initialProbability:{question:'What chance do you currently give the original prediction?',type:'slider',unit:'Likelihood · %'},
  initialDistress:{question:'Separately, how upsetting does the thought feel?',type:'slider',unit:'Distress · 0–100'},
  coreFearedOutcome:{question:'If it happened, what would be the hardest part?'},
  evidenceFor:{question:'What makes that outcome feel likely?'},
  evidenceAgainst:{question:'What points toward things going differently? It’s okay if nothing comes to mind.'},
  personalHistory:{question:'Looking at the outcomes you selected, what do you notice?'},
  initialSeverity:{question:'Suppose it did happen. How bad do you imagine it would be?',type:'slider',unit:'Severity · 0–100'},
  whatNext:{question:'What do you think would happen next?'},
  coping:{question:'What could you do, or who could help, if that happened?'},
  copingConfidence:{question:'How confident do you feel that you could deal with it?',type:'slider',unit:'Coping confidence · 0–100'},
  realisticScenario:{question:'Taking what we’ve looked at together, what seems like the most realistic version of what might happen?'},
  revisedProbability:{question:'What chance would you give the original prediction now?',type:'slider',unit:'Likelihood · %'},
  revisedSeverity:{question:'How severe does that possible outcome seem now?',type:'slider',unit:'Severity · 0–100'},
  revisedDistress:{question:'How upsetting does the thought feel now?',type:'slider',unit:'Distress · 0–100'},
  revisedCopingConfidence:{question:'How confident do you feel about coping now?',type:'slider',unit:'Coping confidence · 0–100'},
};
export function newConversation(aiConsent=false,companion=false){return {companion,schemaVersion:2,id:crypto.randomUUID(),kind:'conversation',revision:0,status:'active',createdAt:new Date().toISOString(),state:companion?'CHAT':'READINESS',field:null,answers:{},path:[],pending:null,transcript:[],draftText:'',aiConsent,declined:[],tried:[],intervention:null,clarifications:0,relatedIds:[],history:[],repeat:null,checkpoints:[],voice:[],safetyState:'none',worryId:null,outcome:null,outcomeDueAt:null};}
export function relevantRecords(records,wording){
  const words=new Set(normal(wording).split(' ').filter(w=>w.length>3&&!['this','that','with','have','will','might','about','would','could','worry','worried','think'].includes(w)));
  return records.filter(r=>r.status==='complete'&&r.answers?.prediction).map(r=>({r,score:normal(r.answers.prediction+' '+r.answers.worry).split(' ').filter(w=>words.has(w)).length})).filter(x=>x.score>=2||normal(x.r.answers.prediction)===normal(wording)).sort((a,b)=>b.score-a.score).slice(0,10).map(x=>x.r);
}
export function conversationView(s){
  const base={phase:'UNDERSTAND',type:'text',message:'What would feel useful right now?',choices:[],canSkip:false};
  if(s.companion){const paused=['CHAT_PAUSED','CHAT_ENDED'].includes(s.state);return {...base,phase:'CHAT',type:'text',message:s.aiMessage||'What’s going on?',choices:paused?[choice('resume','Continue chatting')]:s.awaitingFeedback?['BETTER','SAME','WORSE','UNKNOWN'].map((id,i)=>choice(id,['A little easier','The same','Worse','Not sure'][i])):s.chatChoices||[]};}
  if(s.state==='READINESS')return {...base,message:s.readinessHint?'It sounds difficult to think this through right now. Would you rather settle first, or talk about the worry?':'What do you need right now? We can settle for a moment, or look at what’s worrying you.',type:'choices',choices:[choice('settle','Help me settle first'),choice('reflect','Let’s talk about the worry'),choice('unsure','I’m not sure')]};
  if(s.state==='SETTLE'){const available=id=>!s.tried.includes(id)&&!s.declined.includes(id);const choices=[...(['release','breathing'].some(available)?[choice('physical','Something physical')]:[]),...(['grounding','orientation','attention'].some(available)?[choice('around','Focus on what’s around me')]:[]),...(available('express')?[choice('express','Tell you what’s in my head')]:[])];return {...base,phase:'STABILIZE',type:'choices',message:!choices.length?'We don’t need to keep trying exercises. We can pause, talk about the worry, or stop for now.':s.changeApproach?'Okay — let’s change approach. Which of these feels more useful?':'What feels most manageable for a moment?',choices};}
  if(s.state==='PHYSICAL')return {...base,phase:'STABILIZE',type:'choices',message:'Which, if either, feels comfortable? You can stop at any time.',choices:[...(!s.tried.includes('release')&&!s.declined.includes('release')?[choice('release','Let a little tension go')]:[]),...(!s.declined.includes('breathing')&&!s.tried.includes('breathing')?[choice('breathing','Gentle breathing')]:[]),choice('around','Try something around me')]};
  if(s.state==='STABILIZE')return {...base,phase:'STABILIZE',type:interventions[s.intervention].type,message:interventions[s.intervention].message,choices:[choice('ready','I’m ready to look at the worry'),choice('another','This isn’t helping'),choice('stay','Stay with this a moment')]};
  if(s.state==='READY')return {...base,phase:'STABILIZE',type:'choices',message:'Do you feel able to look at the worry now, or would you rather stay here a little longer?',choices:[choice('reflect','Let’s look at it'),choice('stay','Stay here'),choice('end','Stop for now')]};
  if(s.state==='WORK'&&s.field==='coping')return {...base,phase:'WORK THROUGH',canSkip:true,message:s.answers.whatNext?'Thinking about the original worry (rather than assuming anything else happens), what support or response would be useful to you?':'What support, if any, would be useful for the original worry?'};
  if(s.state==='WORK'){const q=fields[s.field];return {...base,...q,message:s.field==='prediction'&&s.clarifications?'What is one thing you’re afraid might happen? It’s also okay to keep the uncertainty in your own words.':q.question,type:q.type||(q.choices?'choices':'text'),choices:q.choices||[],phase:q.phase||'WORK THROUGH',canSkip:!q.choices&&s.field!=='prediction'};}
  if(s.state==='NEXT_MEANING')return {...base,type:'choices',message:'When you say “'+s.followupAnswer+'”, do you mean nothing further would happen, or that you’re not sure what comes next?',choices:[choice('nothingFurther','Nothing further would happen'),choice('notSureNext','I’m not sure'),choice('rephraseNext','Let me explain'),choice('leaveNext','Leave this question')]};
  if(s.state==='CONFIRM')return {...base,type:'prediction',message:'Is this the prediction you want to look at? You can edit it before we go on.',choices:[choice('confirm','Yes, that’s what I mean')]};
  if(s.state==='DETAILS')return {...base,type:'summary',message:'You’ve already mentioned a few useful details. Do these keep your meaning? Edit anything before using them.',choices:[choice('acceptDetails','Use these details'),choice('discardDetails','Use only my current answer')]};
  if(s.state==='REMAINING')return {...base,phase:'WORK THROUGH',type:'choices',message:'There’s a possible next step. Would it help to look at the “what if” part too, or is this enough for now?',choices:[choice('explore','Look at the “what if”'),choice('finishPlan','Keep my plan')]};
  if(s.state==='FOCUS')return {...base,phase:'WORK THROUGH',type:'choices',message:'What would be useful to look at next?',choices:[choice('evidence','What makes it likely or unlikely'),choice('coping','How I could handle it'),choice('brief','Pull together what I know')]};
  if(s.state==='HISTORY')return {...base,phase:'WORK THROUGH',type:'history',message:'Do any of these past records describe a similar situation? Choose only the ones you think are relevant.',choices:[choice('useHistory','Look at selected records'),choice('skipHistory','Leave history aside')]};
  if(s.state==='UNCERTAINTY')return {...base,phase:'LEARN',type:'text',message:'We’ve looked at what we can know. There may still be uncertainty. What might help you move forward without knowing exactly what will happen?',canSkip:true};
  if(s.state==='RERATE')return {...base,phase:'LEARN',type:'choices',message:'Would you like to note how it feels now, or leave the reflection here? The numbers can go up, down, or stay the same.',choices:[choice('ratings','Update distress, severity and coping'),choice('leaveRatings','Leave those ratings as they are')]};
  if(s.state==='TESTABLE')return {...base,phase:'LEARN',type:'choices',message:'Will you be able to observe whether this prediction happened?',choices:[choice('testable','Yes'),choice('notTestable','No / I’m not sure')]};
  if(s.state==='REVIEW_AT')return {...base,phase:'LEARN',type:'datetime',message:'When would you like to return to see what happened? We’ll keep a review due here when you come back; no notification is sent.',canSkip:true};
  if(s.state==='SUMMARY')return {...base,phase:'LEARN',type:'summary',message:'Here’s what you chose to keep. Does it reflect what you mean?',choices:[choice('complete','Save this reflection')]};
  if(s.state==='REPEAT')return {...base,phase:'LEARN',type:'choices',message:'This may be a prediction you’ve looked at before. Has something important changed, or would you prefer to return to what you learned?',choices:[choice('reviewPrevious','Review previous reflection'),choice('changed','Something changed'),choice('shift','Help me shift attention'),choice('end','End for now')]};
  if(s.state==='PREVIOUS')return {...base,phase:'LEARN',type:'previous',message:'Here are your earlier words. They don’t prove what will happen this time. What would be useful now?',choices:[choice('changed','Something changed'),choice('shift','Shift attention'),choice('end','End for now')]};
  if(s.state==='CHANGE')return {...base,phase:'UNDERSTAND',message:'What has changed since that reflection?'};
  if(s.state==='PAUSED'||s.state==='ENDED')return {...base,type:'choices',message:s.state==='PAUSED'?'We can pause here. Your place is saved.':'We can leave it here for now. Your place is saved if you want to return.',choices:[choice('resume','Continue where I left off'),choice('restart','Start again')]};
  if(s.state==='COMPLETE')return {...base,phase:'LEARN',type:'summary',message:s.outcome?'Your outcome and learning are saved.':'Your reflection is saved. You don’t have to feel differently for it to count.',choices:[...(s.answers.testable==='Yes'?[choice('reviewOutcome','Record what happened')]:[]),choice('restart','Start a new conversation')]};
  if(s.state==='OUTCOME')return {...base,phase:'LEARN',type:'choices',message:'What actually happened with your prediction?',choices:['Did not happen','Partly happened','Happened','Still unclear'].map(v=>choice(v,v))};
  if(s.state==='OUTCOME_SEVERITY')return {...base,phase:'LEARN',type:'slider',unit:'Actual severity · 0–100',message:`How difficult was it in reality? Your earlier severity estimate was ${s.answers.initialSeverity??'not recorded'}.`,canSkip:true};
  if(s.state==='OUTCOME_COPING')return {...base,phase:'LEARN',type:'text',message:'How did you cope? What or who helped, if anything?',canSkip:true};
  if(s.state==='OUTCOME_LEARNING')return {...base,phase:'LEARN',type:'text',message:'What do you want to remember from what happened?',canSkip:true};
  if(s.state==='SAFETY')return {...base,type:'safety',message:'Let’s pause this exercise and focus on human support. If you may act on thoughts of harm, cannot stay safe, or have a medical emergency, contact your local emergency service now. This chat is not monitored and has not contacted anyone.',choices:[]};
  return base;
}
function startIntervention(s,id){if(s.declined.includes(id)||s.tried.includes(id)){s.state='SETTLE';s.changeApproach=true;return;}s.intervention=id;s.tried.push(id);s.state='STABILIZE';s.changeApproach=false;}
function nextAround(s){return ['grounding','orientation','attention','express'].find(id=>!s.tried.includes(id)&&!s.declined.includes(id));}
function work(s,field,path=[]){s.state='WORK';s.field=field;s.path=path;while(owns(s.answers,s.field)){if(!s.path.length){afterWork(s,s.field);return;}s.field=s.path.shift();}}
function hypothetical(s){work(s,'initialProbability',['initialDistress','coreFearedOutcome']);}
function afterWork(s,field){
  if(s.path.length){work(s,s.path.shift(),s.path);return;}
  if(field==='worry'){work(s,'prediction');return;}
  if(field==='prediction'){s.pendingPrediction=s.answers.prediction;delete s.answers.prediction;s.state='CONFIRM';return;}
  if(field==='actionability'){s.answers.actionability==='An uncertain prediction'?hypothetical(s):work(s,'control',['possibleActions','nextStep','actionWhen']);return;}
  if(field==='actionWhen'){s.state='REMAINING';return;}
  if(field==='coreFearedOutcome'){s.state='FOCUS';return;}
  if(field==='evidenceAgainst'){if(s.history.length){s.state='HISTORY';return;}work(s,'initialSeverity',['whatNext','coping','copingConfidence']);return;}
  if(field==='personalHistory'){work(s,'initialSeverity',['whatNext','coping','copingConfidence']);return;}
  if(field==='copingConfidence'){work(s,'realisticScenario',['revisedProbability']);return;}
  if(field==='revisedProbability'){s.state='UNCERTAINTY';return;}
  if(field==='revisedCopingConfidence'){s.state='TESTABLE';return;}
  s.state='SUMMARY';
}
function checkpoint(s){const {checkpoints,transcript,voice,history,...snap}=structuredClone(s);s.checkpoints.push(snap);s.checkpoints=s.checkpoints.slice(-25);}
export function advanceConversation(original,event,{records=[],model=null}={}){
  const s=structuredClone(original);const value=event.value;let action=event.action||'';const message=text(value);const key=normal(message);
  s.aiMessage=null;s.notice=null;
  if(typeof value==='string'&&value.length>6000)throw Error('Please use a shorter response.');
  // Safety precedes commands and readiness; it is not a diagnosis.
  const confirmedText=[message,event.prediction,...Object.values(event.details||{})].filter(v=>typeof v==='string').join(' ');
  if(safetySignal(confirmedText)||model?.conversationAction==='ESCALATE'){s.state='SAFETY';s.safetyState='needs-human-support';s.draftText=message;return s;}
  if(/^(restart|start over|start again)$/.test(key))action='restart';
  if(/^(stop|pause|i dont want this)$/.test(key))action='pause';
  if(/^(go back|back)$/.test(key))action='back';
  if(s.safetyState!=='none'){if(['pause','end'].includes(action)){s.resumeState={state:'SAFETY',field:null};s.state=action==='pause'?'PAUSED':'ENDED';s.status=action==='pause'?'paused':'ended';}else if(action==='resume')s.state='SAFETY';return s;}
  if(action==='restart'){const fresh=newConversation(s.aiConsent);return {...fresh,id:s.id,revision:s.revision,createdAt:s.createdAt,declined:s.declined,tried:[],restartCount:(s.restartCount||0)+1};}
  if(action==='pause'||action==='end'){if(!['PAUSED','ENDED'].includes(s.state))s.resumeState={state:s.state,field:s.field};s.state=action==='pause'?'PAUSED':'ENDED';s.status=action==='pause'?'paused':'ended';return s;}
  if(action==='resume'&&s.resumeState){Object.assign(s,s.resumeState);s.status='active';return s;}
  if(action==='back'){const previous=s.checkpoints.pop();if(!previous)return s;const restored={...s,...previous,revision:s.revision,checkpoints:s.checkpoints,transcript:s.transcript,voice:s.voice,tried:[...new Set([...previous.tried,...s.tried])],declined:[...new Set([...previous.declined,...s.declined])]};if(restored.state==='STABILIZE'&&restored.declined.includes(restored.intervention)){restored.state='SETTLE';restored.changeApproach=true;}return restored;}
  checkpoint(s);s.status='active';s.draftText='';s.aiMessage=null;s.notice=null;
  if(breathingDeclined(message)){s.declined=[...new Set([...s.declined,'breathing'])];s.changeApproach=true;const next=nextAround(s);if(next)startIntervention(s,next);else s.state='SETTLE';s.notice='That’s okay. We can use something else.';return s;}
  if(action==='another'){if(s.intervention)s.declined=[...new Set([...s.declined,s.intervention])];s.state='SETTLE';s.changeApproach=true;return s;}
  if(action==='reflect'){if(['REPEAT','PREVIOUS'].includes(s.state)){s.state='REPEAT';return s;}if(s.resumeCognitive){Object.assign(s,s.resumeCognitive);s.resumeCognitive=null;return s;}if(s.state==='WORK')return s;if(!owns(s.answers,'worry')&&s.openingMessage&&!s.readinessHint&&!clarificationQuestion(s.openingMessage))s.answers.worry=s.openingMessage;work(s,owns(s.answers,'prediction')?'actionability':owns(s.answers,'worry')?'prediction':'worry');return s;}
  if(!action&&clarificationQuestion(message)){
    const explanations={evidenceFor:'Evidence means things you have actually noticed or know about the situation, rather than how strong the fear feels.',evidenceAgainst:'This is space for facts that suggest a different outcome. If none come to mind, that is an answer too.',initialProbability:'Likelihood is your estimate of whether the event will happen. Distress is how upsetting the thought feels; they can be different.',initialDistress:'This asks about how upsetting the thought feels, separately from how likely you think it is.',realisticScenario:'A realistic account can include difficult possibilities, uncertainty and ways you might respond. It does not have to be positive.'};
    s.aiMessage=/medic|dose|diagnos|do i have|should i take/i.test(message)?'Medication and diagnosis questions need a qualified health professional. I can help you describe the concern, but cannot make that medical decision.':(explanations[s.field]||'You can answer in your own words, and you can pause or skip optional questions. This is a way to notice what you think, not a test.');return s;
  }
  // Detect difficulty at any cognitive turn, but never override an explicit choice to reflect.
  if(!action&&overwhelmed(message)&&!['READINESS','STABILIZE','SETTLE','PHYSICAL','READY'].includes(s.state)){s.resumeCognitive={state:s.state,field:s.field,path:s.path};s.state='READINESS';s.readinessHint=true;return s;}
  if(s.state==='READINESS'){
    if(action==='settle'||action==='unsure'){s.state='SETTLE';return s;}
    if(action==='reflect'){work(s,'worry');return s;}
    if(message){s.openingMessage=message;s.readinessHint=overwhelmed(message)||model?.readiness==='overwhelmed';if(!s.readinessHint&&(model?.readiness==='reflective'||/^(lets talk|i (want|am ready) to (talk|look|work))/.test(key))){s.answers.worry=message;work(s,'prediction');}}
    return s;
  }
  if(s.state==='SETTLE'||s.state==='PHYSICAL'){
    if(action==='physical')s.state='PHYSICAL';else if(action==='around'){const next=nextAround(s);if(next)startIntervention(s,next);else{s.state='READY';s.notice='We don’t need to keep trying exercises.';}}
    else if(['express','breathing','release'].includes(action))startIntervention(s,action);
    else if(message){s.state='STABILIZE';s.intervention='express';s.tried.push('express');s.expressed=message;s.state='READY';}return s;
  }
  if(s.state==='STABILIZE'){
    if(action==='ready'){s.state='READY';return s;}if(action==='stay'){s.notice='Take your time. There’s nothing to finish.';return s;}
    if(notHelping(message)||model?.interventionFeedback==='not-helping'){s.declined=[...new Set([...s.declined,s.intervention])];s.state='SETTLE';s.changeApproach=true;return s;}
    if(message){s.expressed=s.intervention==='express'?message:s.expressed;s.state='READY';}return s;
  }
  if(s.state==='READY'){if(action==='stay'){s.state='SETTLE';return s;}if(message){s.state='READINESS';s.readinessHint=true;}return s;}
  if(s.state==='CONFIRM'){
    if(action!=='confirm')return s;const confirmed=text(event.prediction||s.pendingPrediction);if(!confirmed||confirmed.length>6000)throw Error('Keep or edit a prediction of up to 6,000 characters.');s.answers.prediction=confirmed;s.pendingPrediction=null;
    s.history=relevantRecords(records,confirmed).map(r=>({id:r.id,prediction:r.answers.prediction,initialProbability:r.answers.initialProbability,outcome:r.outcome,answers:r.answers}));
    const match=s.history.find(r=>normal(r.prediction)===normal(confirmed))||s.history[0];if(match&&!s.repeatHandled){s.repeat=match;s.state='REPEAT';}else work(s,'actionability');return s;
  }
  if(s.state==='REPEAT'||s.state==='PREVIOUS'){if(action==='reviewPrevious')s.state='PREVIOUS';if(action==='changed')s.state='CHANGE';if(action==='shift'){s.repeatHandled=true;startIntervention(s,'attention');}return s;}
  if(s.state==='CHANGE'){if(/^(nothing|nothing new|no|same|no change|not really)[.! ]*$/i.test(message)){s.state='REPEAT';return s;}s.answers.newInformation=message;s.repeatHandled=true;work(s,'actionability');return s;}
  if(s.state==='DETAILS'){
    if(action==='acceptDetails'){const approved=event.details||s.pending.details;for(const [field,v]of Object.entries(approved)){if(!owns(s.pending.details,field)||typeof v!=='string'||v.length>6000)throw Error('Check the suggested details.');s.answers[field]=v;}}
    if(['acceptDetails','discardDetails'].includes(action)){const previous=s.pending;s.pending=null;Object.assign(s,previous.next);afterWork(s,previous.field);}return s;
  }
  if(s.state==='NEXT_MEANING'){
    if(action==='rephraseNext'){s.state='WORK';s.draftText=s.followupAnswer||'';delete s.followupAnswer;return s;}
    if(action==='nothingFurther'||/^(nothing (?:else|further)(?: would happen)?|no further consequences)$/.test(key)){
      s.answers.whatNext=s.followupAnswer||message;delete s.followupAnswer;
      s.state='RERATE';s.path=[];s.notice='You’re not expecting anything further. We can leave that chain of possibilities there.';return s;
    }
    if(action==='notSureNext'||action==='leaveNext'||/^(i dont know|not sure|idk)$/.test(key)){
      s.answers.whatNext=action==='leaveNext'?'':s.followupAnswer||message;delete s.followupAnswer;
      s.state='RERATE';s.path=[];s.notice='We can leave what happens next uncertain; you don’t need to invent an answer.';return s;
    }
    if(message){delete s.followupAnswer;s.state='WORK';}else return s;
  }
  if(s.state==='WORK'){
    const q=fields[s.field];let approved=value;
    if(s.field==='whatNext'&&!action&&/^(nothing(?:(?: else| further)(?: would happen)?| really| would happen)?|no|none|idk|i dont know|not sure|im not sure|no idea)$/.test(key)){
      s.followupAnswer=message;s.state='NEXT_MEANING';return s;
    }

    if(s.field==='prediction'&&message.split(/\s+/).length<4&&s.clarifications<2){s.clarifications++;s.draftText=message;return s;}
    if(q.choices){approved=action||message;if(!q.choices.some(c=>c.id===approved)){const inferred=model?.actionability;if(!inferred)return s;approved=inferred;if(!q.choices.some(c=>c.id===approved))return s;}}
    if(q.type==='slider'){approved=action==='skip'?null:value;if(approved!==null&&(!Number.isInteger(approved)||approved<0||approved>100))throw Error('Choose a number from 0 to 100, or skip.');}
    else if(!q.choices){approved=action==='skip'?'':message;if(!approved&&s.field==='prediction')return s;}
    const field=s.field;s.answers[field]=approved;
    if(field==='worry'&&model?.extractedData?.prediction){s.pendingPrediction=model.extractedData.prediction;s.state='CONFIRM';return s;}
    if(field==='prediction'&&model?.extractedData?.prediction)s.answers.prediction=model.extractedData.prediction;
    if(model?.extractedData){const details={};for(const k of ['evidenceFor','evidenceAgainst','coping','nextStep','actionWhen']){const v=model.extractedData[k];if(k!==field&&!owns(s.answers,k)&&v&&message.includes(v))details[k]=v;}if(Object.keys(details).length){s.pending={details,next:{state:s.state,field:s.field,path:s.path},field};s.state='DETAILS';return s;}}
    afterWork(s,field);return s;
  }
  if(s.state==='REMAINING'){if(action==='explore')hypothetical(s);if(action==='finishPlan')s.state='SUMMARY';return s;}
  if(s.state==='FOCUS'){if(action==='evidence')work(s,'evidenceFor',['evidenceAgainst']);if(action==='coping')work(s,'initialSeverity',['whatNext','coping','copingConfidence']);if(action==='brief')work(s,'realisticScenario',['revisedProbability']);return s;}
  if(s.state==='HISTORY'){if(action==='skipHistory'){work(s,'initialSeverity',['whatNext','coping','copingConfidence']);return s;}if(action==='useHistory'){if(!Array.isArray(event.ids))throw Error('Choose relevant records.');s.relatedIds=event.ids.filter(id=>s.history.some(r=>r.id===id&&r.outcome));if(s.relatedIds.length)work(s,'personalHistory');else work(s,'initialSeverity',['whatNext','coping','copingConfidence']);}return s;}
  if(s.state==='UNCERTAINTY'){s.answers.uncertainty=message;s.state='RERATE';return s;}
  if(s.state==='RERATE'){if(action==='ratings')work(s,'revisedSeverity',['revisedDistress','revisedCopingConfidence']);else if(action==='leaveRatings')s.state='TESTABLE';return s;}
  if(s.state==='TESTABLE'){if(!['testable','notTestable'].includes(action))return s;s.answers.testable=action==='testable'?'Yes':'No / not sure';s.state=action==='testable'?'REVIEW_AT':'SUMMARY';return s;}
  if(s.state==='REVIEW_AT'){if(action!=='skip'){const date=Date.parse(message);if(!Number.isFinite(date))throw Error('Choose a review date and time, or skip.');s.outcomeDueAt=new Date(date).toISOString();s.answers.outcomeReviewAt=s.outcomeDueAt;}s.state='SUMMARY';return s;}
  if(s.state==='SUMMARY'&&action==='complete'){s.state='COMPLETE';s.status='complete';s.completedAt=new Date().toISOString();return s;}
  if(s.state==='COMPLETE'&&action==='reviewOutcome'&&s.answers.testable==='Yes'){s.state='OUTCOME';return s;}
  if(s.state==='OUTCOME'){if(!['Did not happen','Partly happened','Happened','Still unclear'].includes(action))return s;s.outcome={result:action,actualSeverity:null,actualCoping:null,copingDescription:'',learning:''};s.state=['Happened','Partly happened'].includes(action)?'OUTCOME_SEVERITY':'OUTCOME_COPING';return s;}
  if(s.state==='OUTCOME_SEVERITY'){if(action!=='skip'&&(!Number.isInteger(value)||value<0||value>100))throw Error('Use 0–100 or skip.');s.outcome.actualSeverity=action==='skip'?null:value;s.state='OUTCOME_COPING';return s;}
  if(s.state==='OUTCOME_COPING'){s.outcome.copingDescription=message;s.state='OUTCOME_LEARNING';return s;}
  if(s.state==='OUTCOME_LEARNING'){s.outcome.learning=message;s.outcome.recordedAt=new Date().toISOString();s.state='COMPLETE';s.status='complete';return s;}
  return s;
}
export function worryFromConversation(s,existing=null){const r=existing||newWorry();return {...r,id:s.worryId||r.id,answers:{...s.answers},relatedIds:s.relatedIds,voice:s.voice,status:'complete',completedAt:s.completedAt||new Date().toISOString(),outcome:s.outcome,conversationId:s.id};}
export function modelContext(s,lastPatientMessage){
  return {currentConversationState:s.state==='WORK'?s.field:s.state,patientProfileDataAllowedForThisSession:{audience:'13+, exact age not collected'},currentWorry:s.answers.worry||s.openingMessage||'',confirmedPrediction:s.answers.prediction||null,ratings:Object.fromEntries(Object.entries(s.answers).filter(([k])=>/Probability|Distress|Severity|Confidence/.test(k))),followupContext:{questionAsked:s.aiMessage||conversationView(s).message,whatNext:s.answers.whatNext??null,coreFearedOutcome:s.answers.coreFearedOutcome??null,pendingMeaning:s.followupAnswer??null},knownEvidence:{for:s.answers.evidenceFor||null,against:s.answers.evidenceAgainst||null,coping:s.answers.coping||null},previousRelevantOutcomes:s.history.filter(r=>s.relatedIds.includes(r.id)).slice(0,10).map(r=>({prediction:r.prediction,result:r.outcome?.result})),currentConversationSummary:{question:conversationView(s).message,answeredFields:Object.keys(s.answers),lastExchange:s.transcript.slice(-2).map(t=>({role:t.role,text:t.text.slice(0,700)}))},lastPatientMessage,interventionsAlreadyTried:s.tried,interventionsDeclined:s.declined,safetyState:s.safetyState};
}
