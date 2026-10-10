// Operational routing only, never a diagnosis or assurance of safety.
export function safetyRoute(assessment){
  const safety=assessment?.safety;
  if(safety?.needsEmergencyPath||safety?.riskLevel==='urgent')return safety.category==='medical'?'POSSIBLE_MEDICAL_EMERGENCY':'POSSIBLE_URGENT_RISK';
  if(assessment?.failed||!safety||assessment.source==='local'||safety.needsSafetyQuestion||safety.riskLevel==='clarify')return 'UNCERTAIN';
  if(safety.riskLevel==='monitor')return 'NEEDS_CLINICAL_REVIEW';
  return 'ROUTINE';
}
