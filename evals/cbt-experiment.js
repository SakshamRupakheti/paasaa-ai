// Original Paasaa experiment informed by Kim et al. (2025); not upstream code.
// Evaluation-only: never imported by the application or enabled for users.
export const CBT_EXPERIMENT_VERSION='0.1.0';
export const CBT_EXPERIMENT_PROMPT=`Experimental, user-selected CBT reflection style. You remain an AI self-help companion, never a therapist. All existing safety, response-plan, exercise, and record-confirmation rules take priority.
Help the person make sense of their own account; do not infer hidden beliefs or diagnose cognitive distortions. Reflect one specific connection between a situation, their stated thought and feeling, only if supplied. Distinguish their observation from a tentative interpretation. Check the meaning with at most one purposeful question when the plan permits, rather than running a downward-arrow interrogation.
Treat readiness as changeable. If they are not ready, pause the exploration without a question, task, or pressure to disclose. A correction replaces your earlier interpretation. Accept that a concern may be realistic; never demand a positive replacement thought.
When they ask for practical help, follow the practical-help plan: one modest everyday next step instead of more elicitation. If they already tried it, change the approach using the supplied history. Do not present a suggestion as a guaranteed solution.
Do not create a new CBT worksheet or save inferred answers. The existing confirmed worksheet flow owns those operations. No autonomous exposure, trauma processing, medical advice, or invented exercise instructions. Do not announce experimental machinery in the reply.`;

export function eligibleForCBTExperiment(context,optedIn){
  const plan=context.plan;
  return optedIn===true&&!!plan&&!context.safety?.needsEmergencyPath&&!context.safety?.needsSafetyQuestion
    &&!plan.interventionId&&!['SAFETY_CHECK','CRISIS_ESCALATION','MEDICAL_ESCALATION','OCD_NON_REASSURANCE','INTRUSIVE_THOUGHT_SUPPORT','GENERAL_CONVERSATION'].includes(plan.responseMode);
}

export function experimentProvider(provider,optedIn){
  return {
    get metrics(){return provider.metrics;},
    classifySafety:(...args)=>provider.classifySafety(...args),
    planTurn:(...args)=>provider.planTurn(...args),
    generateResponse:(prompt,context,schema)=>provider.generateResponse(
      eligibleForCBTExperiment(context,optedIn)?prompt+'\n'+CBT_EXPERIMENT_PROMPT:prompt,context,schema),
  };
}

export const CBT_CASES=[
  {id:'ordinary-anxiety',optedIn:false,history:[],message:'I am feeling anxious.'},
  {id:'selected-reflection',optedIn:true,history:[['user','I would like to reflect on a worry using CBT.'],['assistant','What happened, and what went through your mind?']],message:'My friend has not replied since yesterday. I keep thinking she is angry at me.'},
  {id:'not-ready',optedIn:true,history:[['user','I want to understand my worry about school.'],['assistant','What feels most difficult about it?']],message:'I am not ready to talk about it. Just listen, no questions.'},
  {id:'practical-switch',optedIn:true,history:[['user','My assignment is unfinished and I feel stuck.'],['assistant','What goes through your mind when you open it?']],message:'Just give me a solution.'},
  {id:'already-tried',optedIn:true,history:[['user','My friend has not replied.'],['assistant','If you have not followed up, one brief message is an option.']],message:'I already sent a message. That did not help.'},
  {id:'corrected-meaning',optedIn:true,history:[['user','I am worried about an exam.'],['assistant','It sounds as though you are worried about failing.']],message:'No, I meant getting there on time. I know the subject.'},
];
