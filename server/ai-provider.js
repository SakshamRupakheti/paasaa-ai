import {aiConfig} from './ai-config.js';
import {aiEnabled} from './service-policy.js';
import {SERVICE_BOUNDARIES_PROMPT} from './response-policy.js';
// Provider boundary: business policy only depends on these three methods.
export class AIProvider {
  async classifySafety(){throw Error('Provider not implemented');}
  async planTurn(){throw Error('Provider not implemented');}
  async generateResponse(){throw Error('Provider not implemented');}
}
export class GroqProvider extends AIProvider {
  constructor(env,fetcher=fetch){super();this.key=aiEnabled(env)?env.GROQ_API_KEY:null;this.config=aiConfig(env);this.fetcher=fetcher;this.metrics=[];}
  async complete(role,prompt,input,schema,model=this.config[role+'Model']) {
    if(!this.key)throw Object.assign(Error('AI is not connected'),{code:'unavailable',status:503});
    const started=performance.now();let status='ok';
    try {
      const result=await this.fetcher('https://api.groq.com/openai/v1/chat/completions',{
        method:'POST',headers:{Authorization:`Bearer ${this.key}`,'Content-Type':'application/json'},
        signal:AbortSignal.timeout(this.config.timeoutMs),
        body:JSON.stringify({model,messages:[{role:'system',content:prompt+'\n'+SERVICE_BOUNDARIES_PROMPT},{role:'user',content:JSON.stringify(input)}],
          max_completion_tokens:this.config.maxOutputTokens,
          response_format:{type:'json_schema',json_schema:{name:'paasaa_'+role,strict:role!=='safety',schema}}})});
      if(!result.ok)throw Object.assign(Error('provider unavailable'),{code:result.status===429?'rate_limit':result.status>=500?'upstream':'request_rejected'});
      const data=await result.json(),c=data.choices?.[0];
      if(c?.finish_reason!=='stop'||c.message?.refusal||typeof c.message?.content!=='string')throw Object.assign(Error('invalid output'),{code:'invalid_output'});
      const parsed=JSON.parse(c.message.content);
      // Deliberately discard provider reasoning and raw response bodies.
      this.metrics.push({role,model,latencyMs:Math.round(performance.now()-started),status,tokens:data.usage?.total_tokens??null});
      return parsed;
    } catch(error) {
      status=error.name==='TimeoutError'?'timeout':error.code||'invalid_output';
      this.metrics.push({role,model,latencyMs:Math.round(performance.now()-started),status});
      throw Object.assign(Error(status==='rate_limit'?'Groq free-tier limit reached. Please wait.':status==='invalid_output'?'AI returned no usable response':'AI temporarily unavailable'),{code:status,status:status==='rate_limit'?429:502});
    }
  }
  classifySafety(prompt,input,schema){return this.complete('safety',prompt,input,schema);}
  planTurn(prompt,input,schema){return this.complete('planner',prompt,input,schema);}
  generateResponse(prompt,input,schema){return this.complete('conversation',prompt,input,schema);}
}
export function createProvider(env,fetcher=fetch){if(aiConfig(env).provider!=='groq')throw Error('Unsupported AI provider');return new GroqProvider(env,fetcher);}
