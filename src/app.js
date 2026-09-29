
  (()=>{
    const root=document.getElementById('paasaa-opening');
    const get=id=>root.querySelector('#'+id);
    const start=get('pa-start'),own=get('pa-own'),phase=get('pa-phase'),count=get('pa-count'),motion=get('pa-motion'),lungs=root.querySelector('.lung-volume');
    let running=false,elapsed=0,last=0,mode='guided',lastPhase='';
    const preferred=window.matchMedia('(prefers-reduced-motion: reduce)');
    motion.checked=preferred.matches;
    function clock(){const now=new Date();const h=now.getHours();get('pa-greeting').textContent=(h<12?'Good morning':h<17?'Good afternoon':'Good evening')+', there.';get('pa-time').textContent=now.toLocaleTimeString([],{hour:'numeric',minute:'2-digit'});get('pa-time').dateTime=now.toISOString();}
    clock();setInterval(clock,30000);

    function stop(){running=false;last=0;lungs.style.transform='scale(1)';}
    start.addEventListener('click',()=>{if(running){stop();phase.textContent='Take your time.';count.textContent='Paused · Breathe normally';start.textContent='Resume';}else{if(mode!=='guided'){elapsed=0;mode='guided';}running=true;last=0;lastPhase='';start.textContent='Pause';}});
    own.addEventListener('click',()=>{stop();elapsed=0;mode='own';phase.textContent='Breathe at your own pace.';count.textContent='No timer. No need to change your breath.';start.textContent='Try guided breathing';});
    get('pa-skip').addEventListener('click',()=>{stop();elapsed=0;mode='guided';phase.textContent='That’s okay. You choose the pace.';count.textContent='The next screen will be designed separately.';start.textContent='Let’s breathe';});

    preferred.addEventListener('change',event=>{motion.checked=event.matches;});
    document.addEventListener('visibilitychange',()=>{if(document.hidden&&running){stop();phase.textContent='Paused';count.textContent='Continue when you’re ready.';start.textContent='Resume';}});
    function tick(t){if(running){if(last)elapsed+=Math.min(t-last,100);last=t;const cycle=elapsed%9000;const inhale=cycle<3000;const label=inhale?'Breathe in gently.':'Let your breath out gently.';if(lastPhase!==label){phase.textContent=label;lastPhase=label;}const remaining=inhale?Math.ceil((3000-cycle)/1000):Math.ceil((9000-cycle)/1000);count.textContent=remaining+' seconds · '+(inhale?'in':'out');const progress=inhale?cycle/3000:1-(cycle-3000)/6000;const eased=(1-Math.cos(progress*Math.PI))/2;lungs.style.transform=motion.checked?'scale(1)':'scale('+(0.94+eased*.12)+')';}requestAnimationFrame(tick);}
    requestAnimationFrame(tick);
  })();
  

