export const KNOWLEDGE_CATEGORIES=['anxiety','gad','panic','cbt','worry','uncertainty','grounding','breathing','avoidance','safety-behaviors','cognitive-restructuring','behavioral-experiments','problem-solving','self-monitoring','safety'];
// Deliberately empty until a qualified reviewer approves content. Never scrape at runtime.
export const clinicalDocuments=[];
export function validDocument(d){
  return !!d&&['id','title','source','reviewedBy','reviewedAt','content'].every(k=>typeof d[k]==='string'&&d[k].trim())&&KNOWLEDGE_CATEGORIES.includes(d.category)&&/^https:\/\//.test(d.source)&&Number.isFinite(Date.parse(d.reviewedAt))&&Array.isArray(d.tags)&&d.tags.every(t=>typeof t==='string'&&t.length<=80)&&d.content.length<=12000;
}
export function retrieveKnowledge(query,{documents=clinicalDocuments,limit=3}={}){
  const words=new Set(query.toLowerCase().match(/[a-z]{3,}/g)||[]);
  return documents.filter(validDocument).map(doc=>({doc,score:[doc.category,...doc.tags].filter(tag=>tag.toLowerCase().split(/\W+/).some(w=>words.has(w))).length})).filter(x=>x.score>0).sort((a,b)=>b.score-a.score).slice(0,Math.max(0,Math.min(3,limit))).map(({doc})=>({...doc,content:doc.content.slice(0,1800)}));
}
