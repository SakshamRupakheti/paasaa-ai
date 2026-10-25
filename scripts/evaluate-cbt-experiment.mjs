import {loadEnvFile} from 'node:process';
import {writeFile,mkdir} from 'node:fs/promises';
import {runConversationEngine} from '../server/conversation-engine.js';
import {createProvider} from '../server/ai-provider.js';
import {newConversation} from '../src/conversation-model.js';
import {CBT_CASES,experimentProvider,CBT_EXPERIMENT_VERSION} from '../evals/cbt-experiment.js';

// No arbitrary input files or patient transcripts: this runner only uses fixtures.
const live=process.argv.includes('--live');
if(live){try{loadEnvFile('.env.local');}catch(e){if(e.code!=='ENOENT')throw e;}if(!process.env.GROQ_API_KEY)throw Error('GROQ_API_KEY required for live comparison');}
const results=[];
for(const fixture of CBT_CASES){
  for(const variant of ['baseline','experimental']){
    const session=newConversation(true,true);
    session.transcript=fixture.history.map(([role,text])=>({role,text}));
    const provider=live?createProvider(process.env):null;
    const result=await runConversationEngine(live?process.env:{},session,fixture.message,{provider:variant==='experimental'&&provider?experimentProvider(provider,fixture.optedIn):provider});
    results.push({case:fixture.id,variant,optedIn:fixture.optedIn,message:result.message,action:result.action?.interventionId||null,source:result.telemetry.responseSource,planner:result.telemetry.planner,safety:result.telemetry.safety,metrics:result.telemetry.metrics});
  }
}
await mkdir('evals/results',{recursive:true});
const report={version:CBT_EXPERIMENT_VERSION,live,createdAt:new Date().toISOString(),syntheticOnly:true,clinicianReviewed:false,conclusion:'Descriptive comparison only; no winner or clinical effectiveness established.',cases:CBT_CASES,results};
const stem='evals/results/cbt-experiment-'+(live?'live':'offline');
await writeFile(stem+'.json',JSON.stringify(report,null,2)+'\n');
await writeFile(stem+'.md','# CBT prompt experiment\n\n'+report.conclusion+' All scenarios are synthetic. Clinical review pending.\n\n'+results.map(r=>`## ${r.case} — ${r.variant}\n\nSource: ${r.source}; mode: ${r.planner.responseMode}; exercise: ${r.action||'none'}\n\n${r.message}\n`).join('\n'));
console.log(JSON.stringify({report:stem+'.md',live,total:results.length,modelReplies:results.filter(r=>r.source==='model').length}));
