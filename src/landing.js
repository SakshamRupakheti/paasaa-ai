import {startGuest} from './auth.js';
import {apiFetch} from './api-client.js';
// The home journey hosts the same live chat node used by the direct chat route.
// It never creates a second chat instance or substitutes illustrative messages.
export function renderLanding(root,{chatRoot,startChat,mountCheckin}){
  document.body.classList.add('scenic-home');
  root.innerHTML=`
    <section class="scenic-hero" aria-labelledby="scenic-title">
      <div class="hero-copy">
        <h1 id="scenic-title">Welcome to Paasaa.</h1>
        <p class="hero-description">A little space for you.<br>An AI companion for everyday worries, reflection, and calmer moments.</p>
        <div class="hero-links"><button class="nature-button" data-start-chat>Start chatting <span aria-hidden="true">↗</span></button><a class="nature-button outline" href="#breathe">Feel calmer</a></div>
        <form class="updates-form"><div><input id="updates-email" name="email" type="email" autocomplete="email" placeholder="Your email address" aria-label="Your email address" required maxlength="254"><button type="submit">Connect with Team Paasaa →</button></div><small>By connecting, you agree to save your email for product updates from Team Paasaa.</small><p role="status"></p></form>
      </div>
      <button class="journey-scroll" data-scroll-chat aria-label="Scroll to chat"><svg aria-hidden="true" viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v16m-7-7 7 7 7-7"/></svg></button>
    </section>
    <section id="journey-chat" class="journey-chat" aria-label="Talk to Paasaa">
      <aside class="journey-sidebar"><a class="journey-brand" href="#home">Paasaa.ai</a><p>your best space</p><nav aria-label="Your space"><button data-scroll-chat aria-current="page">◌ <span>Chat</span></button><button data-scroll-checkin>☼ <span>Daily check-in</span></button><a href="#worry">✎ <span>Work through a worry</span></a><a href="#breathe">≈ <span>Breathe</span></a><a href="#progress">▥ <span>Progress</span></a><a href="#help">♡ <span>Help & support</span></a></nav><a class="journey-account" href="#account">Account & sign-in →</a><small>AI self-help prototype.<br>Not a therapist.</small></aside>
      <div class="journey-chat-slot"></div>
    </section>
    <section id="journey-checkin" class="journey-checkin" aria-labelledby="journey-checkin-title"><div class="feature-copy"><p class="nature-eyebrow">DAILY CHECK-IN</p><h2 id="journey-checkin-title">A kinder way to<br> check in with yourself.</h2><p>A moment to notice how you feel, reflect on your day, and make room for yourself.</p><a class="nature-text-link" href="#check-in">Open a detailed reflection →</a></div><div id="journey-mood" class="journey-mood"></div></section>
    <section class="journey-next" aria-label="Keep exploring"><a href="#progress"><span>NOTICE YOUR PATTERNS</span><h2>Your progress, at your pace.</h2><p>See your check-ins and return to your reflections. →</p></a><a href="#support"><span>A MOMENT OF SUPPORT</span><h2>One small step is enough.</h2><p>Find grounding, breathing, or human support. →</p></a></section>`;
  root.querySelector('.journey-chat-slot').append(chatRoot);chatRoot.hidden=false;
  const scroll=id=>root.querySelector(id)?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});
  root.querySelectorAll('[data-start-chat]').forEach(b=>b.onclick=()=>{scroll('#journey-chat');startChat();});
  root.querySelectorAll('[data-scroll-chat]').forEach(b=>b.onclick=()=>scroll('#journey-chat'));
  root.querySelector('[data-scroll-checkin]').onclick=()=>scroll('#journey-checkin');
  mountCheckin(root.querySelector('#journey-mood'));
  const form=root.querySelector('.updates-form');
  form.onsubmit=async event=>{event.preventDefault();const button=form.querySelector('button'),status=form.querySelector('[role=status]');button.disabled=true;status.textContent='Connecting…';try{await startGuest();const r=await apiFetch('/api/updates',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:form.elements.email.value.trim()})});if(!r.ok)throw Error();status.textContent='Your interest is registered. Thank you.';form.reset();}catch{status.textContent='Updates signup is unavailable right now. Please try again later.';}finally{button.disabled=false;}};
  return {scrollChat:()=>scroll('#journey-chat'),scrollCheckin:()=>scroll('#journey-checkin'),start:()=>{scroll('#journey-chat');startChat();}};
}
