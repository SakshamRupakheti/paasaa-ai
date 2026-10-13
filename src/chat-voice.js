import {apiFetch} from './api-client.js';
// The mic control discloses transcription before recording. Sending remains a separate action.
export function createChatVoice({onState,onTranscript,request=apiFetch,media=globalThis.navigator?.mediaDevices,Recorder=globalThis.MediaRecorder,maxMs=120000}){
  let state='idle',disposed=false,stream,recorder,controller,timer;
  const update=(next,message)=>{state=next;if(!disposed)onState(next,message);};
  const release=()=>{clearTimeout(timer);stream?.getTracks().forEach(track=>track.stop());stream=null;};
  async function toggle(){
    if(disposed)return;
    if(state==='recording'){update('transcribing','Transcribing…');recorder.stop();release();return;}
    if(state!=='idle')return;
    if(!media?.getUserMedia||!Recorder){update('idle','Microphone unavailable. You can still type.');return;}
    update('requesting','Allow microphone access to record.');
    try{
      stream=await media.getUserMedia({audio:true});if(disposed){release();return;}
      const chunks=[];recorder=new Recorder(stream);
      recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};
      recorder.onerror=()=>{disposed?release():update('idle','Recording failed. Please try again or type.');release();recorder.onstop=null;};
      recorder.onstop=async()=>{
        release();if(disposed)return;update('transcribing','Transcribing… Your draft will stay here.');controller=new AbortController();
        try{
          const audio=new Blob(chunks,{type:recorder.mimeType});if(!audio.size)throw Error('No audio was recorded. Please try again.');
          const form=new FormData();form.set('audio',audio,'voice.webm');form.set('consent','true');
          const response=await request('/api/transcribe',{method:'POST',body:form,signal:controller.signal});const data=await response.json();
          if(!response.ok)throw Error(data.error||'Could not transcribe. Please try again.');
          if(typeof data.rawTranscript!=='string'||!data.rawTranscript.trim())throw Error('No speech detected. Please try again.');
          if(disposed)return;onTranscript(data.rawTranscript);update('idle','Voice added to your draft. Edit it or press Send.');
        }catch(error){if(!disposed)update('idle',error.message||'Transcription failed. Your draft is unchanged.');}
      };
      recorder.start();update('recording','Listening… Tap the stop icon when you’re done.');timer=setTimeout(()=>{if(state==='recording')toggle();},maxMs);
    }catch{release();if(!disposed)update('idle','Microphone access was unavailable. You can still type.');}
  }
  return {toggle,dispose(){disposed=true;controller?.abort();if(recorder?.state==='recording')recorder.stop();release();},get state(){return state;}};
}
