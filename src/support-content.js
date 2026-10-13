// Fixed intervention library. Scripts are product drafts pending qualified review.
export const CONTENT_REVIEW = Object.freeze({version:'1.0',sourceOwner:'Paasaa product evidence register',lastReviewed:'2026-09-30',clinicianReviewer:null,clinicalReviewStatus:'needs clinician review'});
export const REASONS = [
 ['tension','My body feels tense or stuck'],['breathing','My breathing or heartbeat feels overwhelming'],['performance',"I'm about to speak or perform"],['social',"I'm anxious around people"],['thought','A thought keeps looping'],['overwhelm','I just feel overwhelmed'],['safety',"I'm worried I might not be safe"],['unknown',"I don't know — just help me settle."]
];
export const EVIDENCE = {
 pmr:{...CONTENT_REVIEW,category:'relaxation / anxiety support',explanation:'Muscle relaxation helps you notice tension and release. Gently tighten only if comfortable, then let go. Adult research suggests benefits for some people; this particular guide and its use with teens have not been clinically validated.',sources:[['VA: progressive muscle relaxation','https://www.va.gov/WHOLEHEALTHLIBRARY/docs/Progressive-Muscle-Relaxation.pdf'],['2024 systematic review in adults','https://pmc.ncbi.nlm.nih.gov/articles/PMC10844009/']]},
 breathing:{...CONTENT_REVIEW,category:'gentle paced breathing',explanation:'Comfort matters more than matching a count. This guide uses 4 seconds in and 6 out without a hold. That exact rhythm and one-minute dose are design choices, not a validated Paasaa treatment.',sources:[['NHS: comfortable breathing','https://www.nhs.uk/mental-health/self-help/guides-tools-and-activities/breathing-exercises-for-stress/']]},
 thought:{...CONTENT_REVIEW,category:'non-reassurance support',explanation:'Reassurance and repeated neutralizing can maintain compulsive cycles. This guide does not judge a thought, diagnose OCD, or create exposure exercises. Use any existing treatment plan with your clinician.',sources:[['IOCDF: understanding compulsions','https://iocdf.org/wp-content/uploads/2025/07/What-is-OCD-Brochure-July-2025.pdf'],['IOCDF: clinician-led ERP','https://iocdf.org/about-ocd/treatment/erp/']]},
 grounding:{...CONTENT_REVIEW,category:'attention / grounding',explanation:'These optional prompts help you orient to the present. They are not a test of whether you are calm, and this short sequence has not been clinically validated by Paasaa.',sources:[['NHS: managing stress','https://www.nhs.uk/mental-health/feelings-symptoms-behaviours/feelings-and-symptoms/stress/']]}
};
export const REGIONS=['hands','arms','face','jaw','neck','shoulders','chest / upper back','stomach','thighs','calves','feet','all over'];
export const DISCREET=['Hands','Forearms','Upper arms','Shoulders','Thighs','Calves','Feet'];
const group=(id,displayName,side,bodyRegion,instruction,publicFriendly=false,contraindicationNote='Skip any injured or recently operated area.')=>({id,displayName,side,bodyRegion,instruction,tenseSeconds:5,releaseSeconds:20,publicFriendly,contraindicationNote,visualRegionId:bodyRegion,audioCue:'Gently tense. Never enough to hurt.'});
export function muscleGroups(dominant='right') {
 const other=dominant==='right'?'left':'right';
 const limb=(side,region,label,instruction)=>group(`${side}-${region}`,`${side[0].toUpperCase()+side.slice(1)} ${label}`,side,region,instruction,true);
 return [
 limb(dominant,'forearm','hand + forearm','Make a gentle fist and tense your hand and lower arm.'),
 limb(dominant,'biceps','upper arm','Bend your arm slightly and gently tighten your upper arm.'),
 limb(other,'forearm','hand + forearm','Make a gentle fist and tense your hand and lower arm.'),
 limb(other,'biceps','upper arm','Bend your arm slightly and gently tighten your upper arm.'),
 group('forehead','Forehead',null,'forehead','Raise your eyebrows and gently tense your forehead.'),
 group('cheeks','Upper cheeks + nose',null,'cheeks','Gently squint and wrinkle your nose.'),
 group('jaw','Lower face + jaw',null,'jaw','Gently tense the lower part of your face. Keep your teeth apart.',false,'Skip immediately for jaw pain or TMJ symptoms. Do not grind or clench your teeth.'),
 group('neck','Neck + throat',null,'neck','Very gently tighten the muscles around your neck. Keep your head still and breathe normally.',false,'Skip if you have neck pain or an injury. Do not bend or strain your neck.'),
 group('shoulders','Chest + shoulders + upper back',null,'shoulders','Gently draw your shoulders up and slightly back. Keep breathing normally.',true),
 group('stomach','Stomach',null,'stomach','Gently tighten your stomach muscles. Keep breathing normally.'),
 limb(dominant,'thigh','thigh','Gently tighten the muscles in your thigh.'),
 limb(dominant,'calf','calf','Gently tense your calf. Keep your foot comfortable; avoid pointing or pulling it hard.'),
 limb(dominant,'foot','foot','Gently curl your toes and tense your foot.'),
 limb(other,'thigh','thigh','Gently tighten the muscles in your thigh.'),
 limb(other,'calf','calf','Gently tense your calf. Keep your foot comfortable; avoid pointing or pulling it hard.'),
 limb(other,'foot','foot','Gently curl your toes and tense your foot.')];
}
export function targetedGroups(region) {
 const all=muscleGroups();
 const mapping={hands:['forearm'],arms:['biceps'],face:['forehead','cheeks'],jaw:['jaw'],neck:['neck'],shoulders:['shoulders'],'chest / upper back':['shoulders'],stomach:['stomach'],thighs:['thigh'],calves:['calf'],feet:['foot'],'all over':['forearm','shoulders','thigh']};
 return all.filter(g=>(mapping[region]||[]).includes(g.bodyRegion));
}
export function discreetGroups(choices) {
 const mapping={Hands:['forearm','Press your fingertips gently into your palm.'],Forearms:['forearm','Gently tense your forearms with your hands resting.'],'Upper arms':['biceps','Gently tighten your upper arms while they rest by your sides.'],Shoulders:['shoulders','Lift your shoulders very slightly, only if comfortable.'],Thighs:['thigh','Gently tighten your thighs while seated.'],Calves:['calf','Gently tense your calves without changing your foot position.'],Feet:['foot','Press your feet gently into the floor.']};
 return choices.slice(0,4).map(name=>group(`discreet-${name}`,name,null,mapping[name][0],mapping[name][1],true));
}
export const SOCIAL_ACTIONS = {'Meet someone':'Say hello','Start a conversation':'Ask one question','Enter a room':'Enter the room','Stay at an event':'Stay for 2 more minutes','Speak in class':'Say your first sentence','Interview / meeting':'Join the conversation','Eat around people':'Return attention to your meal','Something else':'Choose one small action that matters to you'};
export const URGES=['Check something','Ask someone for reassurance','Repeat something mentally','Wash / clean','Avoid something','Search online','Review what happened','Confess something','Something else','Nothing'];
