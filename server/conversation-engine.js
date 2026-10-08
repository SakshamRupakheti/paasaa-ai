import {createProvider} from './ai-provider.js';
import {classifySafety,crisisMessage} from './engine-safety.js';
import {planSchema,responseSchema,validate} from './engine-schemas.js';
import {PLANNER_PROMPT,CONVERSATION_PROMPT,EVERYDAY_STYLE,PROMPT_VERSIONS} from './engine-prompts.js';
import {updateMemory,compactContext,storedText,sensitiveThought} from './engine-memory.js';
import {fallbackPlan,routePlan,fallbackResponse} from './engine-router.js';
import {INTERVENTIONS,interventionAction} from '../src/chat-interventions.js';
import {validateLocalContext,greeting} from '../src/chat-context.js';
import {retrieveKnowledge} from './knowledge.js';
import {conversationMode,modeChoices} from './conversation-modes.js';
export function validateResponse(value,plan){
  validate(responseSchema,value);const t=value.message.trim();
  if(!t||t.length>(plan.arousal==='high'?420:1100)||(t.match(/\?/g)||[]).length>(plan.shouldAskQuestion?1:0)||/(?:https?:|www\.|<[^>]+>|calm down|just relax|stop worrying|definitely (?:safe|just anxiety)|you (?:would|will) never hurt|100% safe|everything will be fine|you have (?:ocd|panic disorder)|you only need me|i'll never leave|as a human|when i had anxiety|increase your dose|stop taking)/i.test(t))throw Error('Invalid response wording');
  if(/\b(?:you are|you're|you’re|don't be|don’t be) (?:a |so )?(?:freak|idiot|stupid|crazy|dramatic)\b/i.test(t))throw Error('Judgmental response');
  if((t.match(/[.!?](?:\s|$)/g)||[]).length>plan.maxSentences)throw Error('Too many sentences');
  if(/(?:try|do|start) (?:a |the |this )?(?:quick |simple )?(?:grounding|breathing|relaxation|exercise)|name (?:five|four|three|[1-5])|notice what you|notice (?:five|three|the chair|your feet)|look (?:around|for)|anchor you|count (?:five|four|three)/i.test(t))throw Error('Unapproved exercise instructions');
  if(/\btense\s|muscle (?:release|relaxation)|(?:hand|shoulder) release|(?:clench|tighten|lift|lower|stretch|roll|shake).{0,30}(?:each|muscle|shoulder|hand|foot|fist|jaw|toes|forearm|leg)/i.test(t))throw Error('Unapproved physical guidance');
  if(/squeeze|inhale|exhale|inhaling|exhaling|slow breath|deep breath|shoulder roll|roll (?:them|your)|shake (?:them|your)|stretch your|tense your|hold.{0,15}(?:seconds|counts)|lift (?:both|your)|drop your shoulders|unclench|close your eyes/i.test(t))throw Error('Unapproved exercise instructions');
  if(plan.responseMode==='LISTEN_ONLY'&&/you should|you need to|try (?:to|a|this)|start by|focus on|(?:do|start|practice) (?:a |an |this |the )?(?:exercise|breathing|grounding)/i.test(t))throw Error('Advice in listen-only response');
  if(!plan.interventionId&&/take (?:a |three |five )?(?:deep )?breath|inhale|exhale|tense your|hold.{0,15}seconds/i.test(t))throw Error('Unapproved intervention');
  return t;
}
export async function runConversationEngine(env,session,message,{provider:injected,allowAI=true,localContext=null}={}){
  const start=performance.now();let provider=injected;
  if(!provider&&allowAI&&session.aiConsent&&env.GROQ_API_KEY){try{provider=createProvider(env);}catch{}}
  if(!allowAI||!session.aiConsent)provider=null;
  const memory=updateMemory(session.engineMemory,message,session.chatAction?.interventionId||session.lastInterventionId);
  const previousQuestion=session.transcript?.at(-1)?.text||'';
  if(/(?:what.{0,12}(?:first|opening).{0,25}(?:action|sentence|line|step))/i.test(previousQuestion)&&message.trim().split(/\s+/).length>=3&&!/still bad|same|worse|don.t know|cannot|can.t|what do you mean/i.test(message)&&!sensitiveThought(message)){memory.firstAction=message.slice(0,240);memory.firstActionJustAnswered=true;}else memory.firstActionJustAnswered=false;
  const context=compactContext(session,message,memory);
  context.localContext=validateLocalContext(localContext);
  context.hasGreetedThisSession=!!session.hasGreetedThisSession;
  context.retrievedClinicalKnowledge=retrieveKnowledge(message);
  const safetyStart=performance.now();const assessment=await classifySafety(provider,message,context.recent,memory);const safetyLatency=Math.round(performance.now()-safetyStart);
  const safety=assessment.safety;
  if(safety.needsEmergencyPath)memory.unresolvedUrgent=safety;
  let plan=fallbackPlan(message,memory),plannerSuccess=false;
  const plannerStart=performance.now();
  if(provider&&!safety.needsEmergencyPath&&!safety.needsSafetyQuestion&&!assessment.failed){try{plan=validate(planSchema,await provider.planTurn(PLANNER_PROMPT,{...context,safety,availableInterventions:Object.values(INTERVENTIONS).map(({id,family,environmentSupport})=>({id,family,environmentSupport}))},planSchema));plannerSuccess=true;}catch{}}
  const plannerLatency=Math.round(performance.now()-plannerStart);
  plan=routePlan(plan,safety,memory,message,{safetyFailed:assessment.failed});
  const mode=conversationMode(session,plan,safety,message);
  if(safety.needsSafetyQuestion)memory.safetyPending=true;else if(!safety.needsEmergencyPath)memory.safetyPending=false;
  let response=fallbackResponse(plan,memory,message),responseSource='fallback';const responseStart=performance.now();
  if(safety.needsEmergencyPath){response=crisisMessage(safety.category);responseSource='safety';}
  else if(provider&&plannerSuccess&&!assessment.failed&&!plan.interventionId&&!['SAFETY_CHECK','OCD_NON_REASSURANCE'].includes(plan.responseMode)){
    try{response=validateResponse(await provider.generateResponse(CONVERSATION_PROMPT+EVERYDAY_STYLE+(plan.interventionId?' For THIS turn: write only ONE sentence acknowledging the specific situation. Do NOT tell the user to do ANYTHING. Do not mention exercise steps, body movements, sensations to notice, counts or durations. The app provides all instructions separately.':''),{...context,plan,intervention:plan.interventionId?{id:plan.interventionId,title:INTERVENTIONS[plan.interventionId].title}:null},responseSchema),plan);responseSource='model';}catch{}
  }
  if(assessment.failed)response='I cannot reliably assess this message right now. If you feel unsafe or have severe or unusual physical symptoms, please use human support. You can also pause here.';
  const isGreeting=/^(?:hi|hey|hello|yo|wassup|what'?s up|good morning|good afternoon|good evening)[!.\s]*$/i.test(message.trim());
  const greet=isGreeting&&mode==='NORMAL'&&!assessment.failed;
  if(greet){response=session.hasGreetedThisSession?'Hey again 🙂 What’s up?':greeting(context.localContext);responseSource='registry';}
  if(mode==='NORMAL'&&plan.responseMode==='GENERAL_CONVERSATION'&&responseSource==='fallback')response=!session.aiConsent
    ?'AI replies are off, so I can’t give a tailored chat reply yet. You can enable AI replies in the chat settings, or use “Work through a worry” without AI.'
    :'I couldn’t generate a reply this time. Your message is saved; you can try again or use “Work through a worry”.';
  // Repair a direct jab without treating profanity alone as a crisis or mocking
  // distress. Anchoring avoids matching quoted abuse or longer safety disclosures.
  const directJab=/^(?:(?:hey|bot|paasaa)[, !]*)?(?:fuck you|you(?:’re|'re| are) (?:stupid|useless)|(?:this|you) sucks?)[!.,\s]*(?:(?:lol|lmao|haha)[!.,\s]*)?$/i.test(message.trim());
  if(directJab&&!assessment.failed&&!safety.needsEmergencyPath&&!safety.needsSafetyQuestion&&mode==='NORMAL'){
    response=memory.questionsAllowed?'That didn’t land. Was my reply off, or do you need some space to vent?':'That didn’t land. I’ll drop that approach; you can say what you need to say.';
    responseSource='registry';
  }
  let action=interventionAction(plan.interventionId);
  if(action){response=memory.event?`With ${memory.event} on your mind, we can keep this to one small step.`:'We can try one small step, only as long as it feels comfortable.';responseSource='registry';response+=' '+INTERVENTIONS[action.interventionId].title+' is available below; begin only if comfortable.';memory.interventionsTried.push(action.interventionId);memory.interventionsTried=[...new Set(memory.interventionsTried)];}
  const redacted=sensitiveThought(message)||plan.primaryState==='INTRUSIVE_THOUGHT'||plan.primaryState==='POSSIBLE_OCD_REASSURANCE_LOOP';
  const safeMessage=redacted?'[Private thought content omitted; unwanted thoughts or reassurance urges discussed.]':storedText(message);
  const telemetry={turnId:crypto.randomUUID(),timestamp:new Date().toISOString(),planner:{primaryState:plan.primaryState,arousal:plan.arousal,userNeed:plan.userNeed,responseMode:plan.responseMode,interventionId:plan.interventionId,confidence:plan.confidence},safety:{riskLevel:safety.riskLevel,category:safety.category},plannerSuccess,responseSource,promptVersions:PROMPT_VERSIONS,metrics:provider?.metrics||[],latency:{safetyLatency,plannerLatency,responseFirstTokenLatency:null,responseCompleteLatency:Math.round(performance.now()-responseStart),totalResponseLatency:Math.round(performance.now()-start)}};
  // Classifications only. No chain of thought, raw prompts, or external analytics.
  return {message:response,action,memory,safety,mode,choices:action||assessment.failed?[]:modeChoices(mode,memory),hasGreetedThisSession:!!session.hasGreetedThisSession||greet,telemetry,storedUserText:safeMessage,redacted,notice:!session.aiConsent?'AI replies are off. This reply uses basic scripted support; no conversation text was sent to Groq.':responseSource==='fallback'&&provider?'Paasaa is using its simpler support mode for this reply.':''};
}
