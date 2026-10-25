import {readFile,writeFile} from 'node:fs/promises';
import {validateCorpus,evaluationReport} from '../server/corpus-pipeline.js';
import {newReview,transitionReview} from '../server/review-workflow.js';
const [command,input,output]=process.argv.slice(2);
if(!['validate-corpus','summarize-evaluation','review-synthetic'].includes(command)||!input){console.log('Usage: node scripts/foundation-research.mjs validate-corpus|summarize-evaluation|review-synthetic input.json [output.json]\nOffline only. No model calls or training export.');process.exit(1);}
try{
  const data=JSON.parse(await readFile(input,'utf8'));let result;
  if(command==='validate-corpus'){
    const schema=JSON.parse(await readFile('research/paasaa-model/schemas/clinical-corpus.schema.json','utf8'));
    const records=Array.isArray(data)?data:[data];records.forEach(r=>validateCorpus(schema,r));result={valid:records.length,training_allowed:false};
  }else if(command==='summarize-evaluation')result=evaluationReport(data);
  else {
    // Synthetic sandbox only. The local reviewer label is not a production role.
    if(data.synthetic!==true||typeof data.reviewer_label!=='string'||!data.reviewer_label.trim())throw Error('Synthetic input and reviewer label required');
    const actor={id:data.reviewer_label,role:'reviewer',verified:true};
    result=transitionReview(transitionReview(newReview(data),'QUEUED_FOR_REVIEW',actor),'REVIEWED',actor,data.feedback);
    result.reviewer_identity_verified=false;result.environment='offline-synthetic';
  }
  if(output)await writeFile(output,JSON.stringify(result,null,2)+'\n');else console.log(JSON.stringify(result,null,2));
}catch(error){console.error('Foundation research input rejected: '+error.message);process.exit(1);}
