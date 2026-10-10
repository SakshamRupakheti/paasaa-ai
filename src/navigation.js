const routes={'#home':'home-screen','#progress':'progress-screen','#help':'help-screen','#account':'account-screen','#dashboard':'dashboard-screen','#chat':'chat-screen','#worry':'worry-screen','#support':'support-screen','#check-in':'transition-screen','#finish':'finish-screen','#breathe':'breathing-screen'};
export const screenForHash=hash=>routes[hash.split('/')[0]]||'home-screen';
export const hashForScreen=screen=>screen==='reflection-screen'?'#check-in':Object.keys(routes).find(key=>routes[key]===screen)||'#home';
