// No network transport, speech service, or AI is connected in this local-first preview.
// A future adapter must return a reviewable proposal, never mutate the check-in.
export function mountVoice(root, onApprove) {
  let recorder, stream, timer, audioUrl, disposed=false, pending=false;
  const make=(tag,text)=>{const n=document.createElement(tag);n.textContent=text||'';return n;};
  const record=make('button','Record a voice note');record.type='button';
  const status=make('p','Audio stays in memory on this tab and is discarded when you leave this question.');status.className='subtle';status.setAttribute('role','status');
  const review=make('div');review.hidden=true;
  const audio=make('audio');audio.controls=true;
  const label=make('label','Write what you said, then review it');const transcript=make('textarea');transcript.rows=3;transcript.maxLength=6000;label.append(transcript);
  const confirm=make('button','Use reviewed text');confirm.type='button';confirm.disabled=true;
  const note=make('p','Automatic transcription and AI organizing are not connected yet. Nothing is extracted or added without your review.');note.className='subtle';
  review.append(audio,note,label,confirm);root.append(record,status,review);
  function release(){clearInterval(timer);stream?.getTracks().forEach(t=>t.stop());}
  record.addEventListener('click',async()=>{
    if(recorder?.state==='recording'){recorder.stop();release();return;}
    if(pending)return;
    if(!navigator.mediaDevices?.getUserMedia||!globalThis.MediaRecorder){status.textContent='Recording is unavailable in this browser. You can type your response above.';return;}
    pending=true;record.disabled=true;status.textContent='Waiting for microphone permission…';
    try{
      stream=await navigator.mediaDevices.getUserMedia({audio:true});if(disposed){release();return;}
      recorder=new MediaRecorder(stream);const chunks=[];const start=performance.now();
      recorder.addEventListener('dataavailable',e=>{if(e.data.size)chunks.push(e.data);});
      recorder.addEventListener('stop',()=>{release();if(disposed)return;if(audioUrl)URL.revokeObjectURL(audioUrl);audioUrl=URL.createObjectURL(new Blob(chunks,{type:recorder.mimeType}));audio.src=audioUrl;review.hidden=false;record.textContent='Record again';status.textContent='Recording stopped. Listen back and review your words.';});
      recorder.addEventListener('error',()=>{release();status.textContent='Recording failed. You can type your response above.';record.textContent='Record a voice note';});
      recorder.start();record.textContent='Stop recording';status.textContent='Recording · 0:00';
      timer=setInterval(()=>{const seconds=Math.floor((performance.now()-start)/1000);status.textContent=`Recording · ${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')} · microphone active`;if(seconds>=120&&recorder.state==='recording'){recorder.stop();release();}},500);
    }catch{release();if(!disposed)status.textContent='Microphone access was not available. You can type your response above.';}
    finally{pending=false;record.disabled=false;}
  });
  transcript.addEventListener('input',()=>{confirm.disabled=!transcript.value.trim();});
  confirm.addEventListener('click',()=>{onApprove(transcript.value);status.textContent='Your reviewed words have been added. You can edit them above.';});
  return()=>{disposed=true;if(recorder?.state==='recording')recorder.stop();release();audio.pause();audio.removeAttribute('src');if(audioUrl)URL.revokeObjectURL(audioUrl);};
}
