const enumeration=values=>({type:'string',enum:values.split('|')});
const bool={type:'boolean'},str={type:'string'},confidence={type:'number',minimum:0,maximum:1};
export const object=properties=>({type:'object',additionalProperties:false,properties,required:Object.keys(properties)});
export const safetySchema=object({riskLevel:enumeration('none|monitor|clarify|urgent'),category:enumeration('none|self_harm|harm_to_others|medical|abuse_or_danger|unclear'),intentDetected:bool,planDetected:bool,immediacyDetected:bool,meansMentioned:bool,cannotStaySafe:bool,needsSafetyQuestion:bool,needsEmergencyPath:bool,confidence});
export const planSchema=object({primaryState:enumeration('GENERAL_CONVERSATION|GENERAL_DISTRESS|ACUTE_ANXIETY|PANIC_LIKE_AROUSAL|MUSCLE_TENSION|PERFORMANCE_ANXIETY|SOCIAL_ANXIETY|WORRY|RUMINATION|INTRUSIVE_THOUGHT|POSSIBLE_OCD_REASSURANCE_LOOP|SADNESS|ANGER|FRUSTRATION|LONELINESS|CONFUSION|SLEEP_TENSION|POSSIBLE_MEDICAL_ISSUE|SAFETY_CONCERN|UNCERTAIN'),secondaryStates:{type:'array',items:str,maxItems:3},arousal:enumeration('low|moderate|high|unknown'),userNeed:enumeration('BE_HEARD|REGULATE_BODY|SLOW_AROUSAL|CLARIFY_WORRY|UNDERSTAND_THOUGHT|PREPARE_FOR_ACTION|CONTINUE_FUNCTIONING|GROUND_ATTENTION|TALK_WITHOUT_ADVICE|REQUEST_INFORMATION|DECIDE_WHAT_TO_DO|RESIST_REASSURANCE_LOOP|SAFETY_SUPPORT|UNKNOWN'),conversationIntent:str,responseMode:enumeration('CONNECT|CONNECT_AND_EXPLORE|LISTEN_ONLY|SETTLE_THEN_EXPLORE|GUIDE_PMR|GUIDE_BREATHING|GUIDE_GROUNDING|PERFORMANCE_SUPPORT|SOCIAL_SUPPORT|WORRY_CLARIFICATION|INTRUSIVE_THOUGHT_SUPPORT|OCD_NON_REASSURANCE|PSYCHOEDUCATION|REFLECTION|SAFETY_CHECK|CRISIS_ESCALATION|MEDICAL_ESCALATION|GENERAL_CONVERSATION'),interventionId:{type:['string','null']},shouldInterveneNow:bool,shouldAskQuestion:bool,questionPurpose:{type:['string','null']},shouldValidateFirst:bool,shouldExplainScience:bool,maxSentences:{type:'integer',minimum:1,maximum:5},tone:enumeration('warm_direct|warm_gentle|neutral'),thingsToAvoid:{type:'array',items:str,maxItems:8},confidence});
export const responseSchema=object({message:str});
export function validate(schema,value,path='output') {
  const types=Array.isArray(schema.type)?schema.type:[schema.type];
  const type=value===null?'null':Array.isArray(value)?'array':typeof value==='number'&&Number.isInteger(value)&&types.includes('integer')?'integer':typeof value;
  if(!types.includes(type))throw Error('Invalid '+path);
  if(schema.enum&&!schema.enum.includes(value))throw Error('Invalid '+path);
  if(type==='object'){if(schema.required.some(k=>!Object.hasOwn(value,k))||Object.keys(value).some(k=>!Object.hasOwn(schema.properties,k)))throw Error('Invalid '+path);for(const [k,s]of Object.entries(schema.properties))validate(s,value[k],path+'.'+k);}
  if(type==='array'){if(value.length>(schema.maxItems??20))throw Error('Invalid '+path);value.forEach(v=>validate(schema.items,v,path));}
  if(type==='string'&&value.length>2000)throw Error('Invalid '+path);
  if(['number','integer'].includes(type)&&(!Number.isFinite(value)||value<(schema.minimum??-Infinity)||value>(schema.maximum??Infinity)))throw Error('Invalid '+path);
  return value;
}
