// Empty by design: no social-anxiety, OCD/ERP, diagnostic or exposure protocol.
export const conditionModules=new Map();
export function validateModule(module){
  if(!module||!module.id||!module.version||!['identifyEligibleState','getAllowedInterventions','validateTransition','getClinicalContext','getEvaluationCriteria'].every(k=>typeof module[k]==='function'))throw Error('Incomplete condition module');
  return module;
}
export function allowedModuleInterventions(module,context){
  validateModule(module);
  if(module.active!==true||module.clinicalApproval?.approved!==true||!module.clinicalApproval.reviewer||!module.identifyEligibleState(context))return [];
  return module.getAllowedInterventions(context);
}
