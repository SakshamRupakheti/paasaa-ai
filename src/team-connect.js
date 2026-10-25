import {startGuest} from './auth.js';
import {apiFetch} from './api-client.js';

export function bindTeamConnect(form,{connect=startGuest,fetcher=apiFetch}={}){
  let pending;
  form.onsubmit=async event=>{
    event.preventDefault();
    const button=form.querySelector('button'),status=form.querySelector('[role=status]');
    if(button.disabled)return;
    const email=form.elements.email.value.trim().toLowerCase();
    if(!pending||pending.email!==email)pending={email,submissionId:crypto.randomUUID()};
    button.disabled=true;status.textContent='Connecting…';
    try{
      await connect();
      const response=await fetcher('/api/updates',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(pending)});
      const result=await response.json();
      if(!response.ok||result.registered!==true)throw Error();
      if(result.notified!==true){
        status.textContent='Your email is saved, but we couldn’t notify the team yet. Please try again.';
        button.textContent='Retry notification →';
        return;
      }
      status.textContent='Thank you. Your email is saved and Team Paasaa has been notified.';
      form.reset();pending=null;button.textContent='Connect with Team Paasaa →';
    }catch{status.textContent='We couldn’t confirm your connection. Please try again.';}
    finally{button.disabled=false;}
  };
}
