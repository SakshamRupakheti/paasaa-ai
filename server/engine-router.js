import {INTERVENTIONS} from '../src/chat-interventions.js';
export function fallbackPlan(message,memory){
  const t=message.toLowerCase();let primaryState='GENERAL_CONVERSATION',responseMode='GENERAL_CONVERSATION',userNeed='BE_HEARD',interventionId=null,arousal='moderate';
  if(/panick|panic|freaking|help|can't|tight|stuck/.test(t)){primaryState='ACUTE_ANXIETY';responseMode='CONNECT_AND_EXPLORE';arousal='high';}
  if(/shoulder|muscle|body.*tight/.test(t)){primaryState='MUSCLE_TENSION';responseMode='GUIDE_PMR';userNeed='REGULATE_BODY';interventionId='pmr_shoulders';}
  if(/presentation|speech|exam|interview/.test(t)||memory.event&&/still bad|same/.test(t)){primaryState='PERFORMANCE_ANXIETY';responseMode=interventionId?'GUIDE_PMR':'PERFORMANCE_SUPPORT';userNeed='PREPARE_FOR_ACTION';}
  if(/party|judging|date in|awkward/.test(t)){primaryState='SOCIAL_ANXIETY';responseMode='SOCIAL_SUPPORT';userNeed='PREPARE_FOR_ACTION';}
  if(/worried|worry|professor|what if/.test(t)){primaryState='WORRY';responseMode='WORRY_CLARIFICATION';userNeed='CLARIFY_WORRY';}
  if(memory.intrusiveThoughtPresent&&/thought|image|urge|promise|sure|100%|same|still/.test(t)){primaryState='INTRUSIVE_THOUGHT';responseMode='INTRUSIVE_THOUGHT_SUPPORT';userNeed='UNDERSTAND_THOUGHT';interventionId=null;}
  if(memory.reassuranceUrge&&/promise|100%|sure|guarantee/.test(t)){primaryState='POSSIBLE_OCD_REASSURANCE_LOOP';responseMode='OCD_NON_REASSURANCE';userNeed='RESIST_REASSURANCE_LOOP';interventionId=null;}
  if(/(?:why|how does|what is).*(?:pmr|muscle|anxiety|worry|breath|thought|panic)/.test(t)){responseMode='PSYCHOEDUCATION';userNeed='REQUEST_INFORMATION';interventionId=null;}
  if(/(?:want|try|help.*|guide.*).{0,15}breath/.test(t)){responseMode='GUIDE_BREATHING';interventionId='paced_breathing';}
  return {primaryState,secondaryStates:[],arousal,userNeed,conversationIntent:'respond_to_message',responseMode,interventionId,shouldInterveneNow:!!interventionId,shouldAskQuestion:!interventionId,questionPurpose:null,shouldValidateFirst:true,shouldExplainScience:responseMode==='PSYCHOEDUCATION',maxSentences:3,tone:'warm_direct',thingsToAvoid:[],confidence:.4};
}
export function routePlan(candidate,safety,memory,message,{safetyFailed=false}={}){
  const p=structuredClone(candidate),t=message.toLowerCase().replace(/[’]/g,"'");
  const clear=()=>{p.interventionId=null;p.shouldInterveneNow=false;};
  if(safety.needsEmergencyPath){clear();p.responseMode=safety.category==='medical'?'MEDICAL_ESCALATION':'CRISIS_ESCALATION';p.userNeed='SAFETY_SUPPORT';p.shouldAskQuestion=false;return p;}
  if(safety.needsSafetyQuestion){clear();p.responseMode='SAFETY_CHECK';p.shouldAskQuestion=!memory.safetyPending;return p;}
  if(/^(stop(?: the exercise)?|pause|end|enough)[.! ]*$/.test(t)){clear();p.responseMode='LISTEN_ONLY';p.shouldAskQuestion=false;return p;}
  if(!memory.wantsAdvice||p.userNeed==='TALK_WITHOUT_ADVICE'){clear();p.responseMode='LISTEN_ONLY';p.userNeed='TALK_WITHOUT_ADVICE';}
  if(/don.t.*breath|no breath|stop.*breath|breath.{0,30}(?:worse|dizzy|uncomfortable|breathless)/.test(t)){clear();p.responseMode='LISTEN_ONLY';p.shouldAskQuestion=false;}
  if(!memory.questionsAllowed)p.shouldAskQuestion=false;
  if(/(?:i'm|i am) (?:okay|ok|fine) now|that's enough/.test(t)){clear();p.responseMode='CONNECT';p.shouldAskQuestion=false;}
  if(p.primaryState==='POSSIBLE_OCD_REASSURANCE_LOOP'||memory.reassuranceUrge&&/promise|100%|sure|guarantee/.test(t)){clear();p.responseMode='OCD_NON_REASSURANCE';}
  if(safetyFailed){clear();p.responseMode='CONNECT';p.shouldAskQuestion=false;}
  if(memory.interventionHistory.some(x=>['SAME','WORSE'].includes(x.outcome))&&!/(?:please|want to|let.s|can we).*(?:try|exercise|breath|relax)/.test(t)){const wasIntervention=!!p.interventionId||/^GUIDE_/.test(p.responseMode);clear();if(wasIntervention||/still bad|same|worse|nothing.*working/.test(t)){if(memory.event){p.responseMode='PERFORMANCE_SUPPORT';p.userNeed='CONTINUE_FUNCTIONING';}else p.responseMode='LISTEN_ONLY';}}
  if(p.primaryState==='INTRUSIVE_THOUGHT'&&!/(?:please|want to|can we|help me).*(?:try|exercise|ground)/.test(t)){clear();p.responseMode='INTRUSIVE_THOUGHT_SUPPORT';}
  let item=INTERVENTIONS[p.interventionId];
  if(!p.shouldInterveneNow||!item||!item.allowedStates.includes(p.primaryState)){clear();item=null;}
  if(item){
    const explicitBreathing=/(?:please|want to|can we|help me|guide me).{0,18}breath/.test(t)&&!/don't|do not|no breath/.test(t);
    const prohibited=memory.interventionsRejected.includes(item.id)||memory.interventionsTried.includes(item.id);
    const bodyRisk=memory.environment==='driving'||memory.physicalCaution||/injur|pain|surgery|cramp|dizz|driving|driv(?:e|ing) a|operating machinery/.test(t);
    if(bodyRisk||prohibited&&!(item.family==='breathing'&&explicitBreathing)||item.family==='breathing'&&(memory.breathingRejected||memory.breathingMadeWorse)&&!explicitBreathing||item.id==='pmr_full16'&&!/full (?:body|pmr)|16.group/.test(t))clear();
    else if(!item.environmentSupport.includes(memory.environment)){
      if(item.family==='pmr'&&item.id!=='pmr_full16'&&!memory.interventionsRejected.includes('pmr_hands')&&!memory.interventionsTried.includes('pmr_hands'))p.interventionId='pmr_hands';else clear();
    }
  }
  if(memory.firstActionJustAnswered){clear();p.responseMode='REFLECTION';p.shouldAskQuestion=false;}
  if(p.interventionId){p.responseMode=INTERVENTIONS[p.interventionId].family==='pmr'?'GUIDE_PMR':INTERVENTIONS[p.interventionId].family==='breathing'?'GUIDE_BREATHING':'GUIDE_GROUNDING';}
  if(!p.interventionId&&/^GUIDE_/.test(p.responseMode))p.responseMode=memory.event?'PERFORMANCE_SUPPORT':'CONNECT_AND_EXPLORE';
  if(p.arousal==='high')p.maxSentences=Math.min(p.maxSentences,3);
  p.maxSentences=Math.max(1,Math.min(p.maxSentences,5));
  return p;
}
export function fallbackResponse(plan,memory,message){
  if(plan.responseMode==='SAFETY_CHECK')return plan.shouldAskQuestion?'Are these unwanted thoughts that frighten you, or do you feel you might act on them now?':'I cannot establish your safety here. Please reach a trusted person or health professional now; use urgent help if you might act on these thoughts.';
  if(plan.responseMode==='REFLECTION'&&memory.firstActionJustAnswered)return 'That can be your starting point. You do not have to solve the whole situation before taking that step.';
  if(plan.responseMode==='LISTEN_ONLY')return 'Okay, no exercises or advice. You can say as much or as little as you want.';
  if(plan.responseMode==='OCD_NON_REASSURANCE')return memory.intrusiveThoughtPresent?'I cannot give you a certainty promise. We can keep talking without trying to prove what the thought means about you.':'I can’t promise what will happen. Has something changed, or is the uncertainty itself bothering you?';
  if(plan.responseMode==='INTRUSIVE_THOUGHT_SUPPORT')return 'An unwanted thought is different from an intention. You do not have to describe its exact content here.';
  if(plan.responseMode==='PERFORMANCE_SUPPORT')return memory.questionsAllowed?'We can focus on getting started, even with the nerves still here. What is your first small action?':'You can focus on just the first small step; the nerves do not have to disappear first.';
  if(plan.responseMode==='SOCIAL_SUPPORT')return 'You do not have to solve the whole interaction at once. A small first step can be enough, and you can choose what feels manageable.';
  if(plan.responseMode==='WORRY_CLARIFICATION')return memory.questionsAllowed?'There is what happened, and then what you fear it means. What do you know so far?':'We can separate what happened from what is still uncertain, without forcing an answer.';
  if(plan.responseMode==='PSYCHOEDUCATION')return /pmr|muscle|shoulder/i.test(message)?'Muscle relaxation pairs gentle tension with release to help you notice the contrast. It helps some people, but it is optional and should not hurt.':'I can discuss general self-help information, but cannot diagnose or make treatment decisions.';
  if(plan.interventionId)return 'We can try one small step, only as long as it feels comfortable.';
  if(/don.t.*breath|no breathing/i.test(message))return 'Okay, no breathing exercises. We can talk without doing an exercise.';
  if(/fuck you|stupid|not helping/i.test(message))return 'That approach missed what you needed. We can drop it.';
  if(/okay now|ok now|fine now/i.test(message))return 'We can leave it here for now.';
  return memory.questionsAllowed?'We can take this one message at a time. What would you like me to understand?':'There is no need to explain everything or answer questions. You can take your time.';
}
