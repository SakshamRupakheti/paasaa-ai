// Deliberate synthetic fixtures. This endpoint never queries patient records or
// auth.users. Replace only after implementing assignments, consent and auditing.
export function prototypeAllowed(user,env){
  return !!env.PAASAA_PROTOTYPE_OWNER_EMAIL&&!!user.email_confirmed_at&&user.is_anonymous!==true&&user.email?.toLowerCase()===env.PAASAA_PROTOTYPE_OWNER_EMAIL.trim().toLowerCase();
}
export function prototypeData(){
  const patients=[
    {id:'DEMO-001',name:'Alex — synthetic',email:'alex@example.invalid',joined:'2026-10-01',lastSignIn:'2026-10-07T09:15:00-05:00',provider:'Google (sample)',consent:{records:true,transcripts:false},ratings:[7,6,null,8,6,5,6],focus:'School / performance',summary:'Sample patient reports worry before presentations. Ratings vary across entries; missing days are not zero.',worksheet:{prediction:'I might lose my place during a presentation.',before:80,after:80,outcome:'Still unclear'},transcript:[{role:'Patient',text:'Synthetic private chat sample.'}]},
    {id:'DEMO-002',name:'Sam — synthetic',email:'sam@example.invalid',joined:'2026-10-02',lastSignIn:'2026-10-06T18:30:00-05:00',provider:'Email (sample)',consent:{records:true,transcripts:true},ratings:[null,5,7,6,null,7,8],focus:'Relationships',summary:'Sample entries describe uncertainty around messages. The later rating increased; the view preserves that change.',worksheet:{prediction:'My friend might be upset with me.',before:60,after:70,outcome:'Not recorded'},transcript:[{role:'Patient',text:'Synthetic example: my friend has not replied.'},{role:'Paasaa',text:'What feels most difficult about waiting?'}]},
    {id:'DEMO-003',name:'Jamie — synthetic',email:'jamie@example.invalid',joined:'2026-10-03',lastSignIn:'2026-10-05T12:00:00-05:00',provider:'Google (sample)',consent:{records:false,transcripts:false},ratings:[4,5,6,5,4,5,4],focus:'Not shared',summary:'Not shared',worksheet:null,transcript:[]}
  ];
  return {synthetic:true,generatedAt:new Date().toISOString(),monitoring:'Sample snapshots only. This is not a live clinical monitoring service.',patients:patients.map(p=>({...p,ratings:p.consent.records?p.ratings:[],summary:p.consent.records?p.summary:null,worksheet:p.consent.records?p.worksheet:null,transcript:p.consent.records&&p.consent.transcripts?p.transcript:null})),events:[{at:'2026-10-07T09:15:00-05:00',patient:'DEMO-001',event:'Sample sign-in'},{at:'2026-10-06T18:35:00-05:00',patient:'DEMO-002',event:'Sample worksheet completed'},{at:'2026-10-06T18:31:00-05:00',patient:'DEMO-002',event:'Sample transcript consent granted'}]};
}
