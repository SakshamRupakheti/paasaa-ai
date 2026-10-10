import {translations} from './translations.js';
import {wellnessTranslations} from './wellness-translations.js';
Object.assign(translations,wellnessTranslations);
export const LANGUAGES=Object.freeze({en:'English',hi:'हिन्दी',ne:'नेपाली',es:'Español'});
export const LANGUAGE_KEY='paasaa.interface-language.v1';
let language='en';
export const normalizeLanguage=value=>Object.hasOwn(LANGUAGES,value)?value:'en';
export const getLanguage=()=>language;
export function translate(text,locale=language){return translations[text]?.[normalizeLanguage(locale)]||text;}
export function formatTranslation(text,values={},locale=language){return translate(text,locale).replace(/\{(\w+)\}/g,(match,key)=>Object.hasOwn(values,key)?String(values[key]):match);}
export function initLanguage(){
  try{language=normalizeLanguage(localStorage.getItem(LANGUAGE_KEY));}catch{}
  const originals=new WeakMap(),attributes=new WeakMap();
  // Interface copy only. Never translate patient text, generated replies, input values,
  // records, or stored identifiers. Saved English option IDs remain unchanged.
  const excluded='script,style,textarea,option,[data-i18n-skip],.brand,.motto,.creator-watermark,.patient-message,.conversation-message p,.conversation-note p,.conversation-saved button,.conversation-prediction p,.worry-card p,.worry-card h2,blockquote,td,dd,.dashboard-panel';
  function protectedNode(element){return element.closest(excluded)||element.closest('.conversation-thread p:not([data-ui-copy])');}
  function textNode(node){
    const parent=node.parentElement;if(!parent||protectedNode(parent))return;
    const current=node.nodeValue;if(!current.trim())return;
    const prior=originals.get(node);const source=prior&&current===prior.shown?prior.source:current;
    const key=source.trim(),value=translate(key),shown=source.replace(key,value);
    originals.set(node,{source,shown});if(current!==shown)node.nodeValue=shown;
  }
  function elementAttrs(element){
    if(element.closest('[data-i18n-skip]'))return;
    const saved=attributes.get(element)||{};
    for(const name of ['aria-label','placeholder','title']){
      if(!element.hasAttribute(name))continue;
      const current=element.getAttribute(name),prior=saved[name],source=prior&&current===prior.shown?prior.source:current,shown=translate(source);
      saved[name]={source,shown};if(current!==shown)element.setAttribute(name,shown);
    }attributes.set(element,saved);
  }
  function paint(root){
    if(root.nodeType===3){textNode(root);return;}
    if(root.nodeType!==1)return;
    elementAttrs(root);const walker=document.createTreeWalker(root,NodeFilter.SHOW_ELEMENT|NodeFilter.SHOW_TEXT);
    let node;while(node=walker.nextNode()){if(node.nodeType===3)textNode(node);else elementAttrs(node);}
  }
  const observe=()=>observer.observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['aria-label','placeholder','title']});
  const observer=new MutationObserver(records=>{observer.disconnect();for(const record of records){if(record.type==='childList')record.addedNodes.forEach(paint);else if(record.type==='attributes')elementAttrs(record.target);else textNode(record.target);}observe();});
  const label=document.createElement('label');label.className='language-picker';
  const globe=document.createElement('span');globe.textContent='◎';globe.setAttribute('aria-hidden','true');
  const select=document.createElement('select');select.setAttribute('aria-label','Language / भाषा / Idioma');select.dataset.i18nSkip='true';
  for(const [code,name]of Object.entries(LANGUAGES)){const option=document.createElement('option');option.value=code;option.textContent=name;option.lang=code;select.append(option);}select.value=language;
  const note=document.createElement('small');note.className='language-note';note.textContent='Interface translation preview; some specialist guidance and sources remain in English.';
  label.append(globe,select);document.querySelector('#profile-settings').append(label);document.querySelector('footer').append(note);
  function apply(){observer.disconnect();document.documentElement.lang=language;note.hidden=language==='en';paint(document.body);observe();document.dispatchEvent(new CustomEvent('paasaa-language-change',{detail:{language}}));}
  select.onchange=()=>{language=normalizeLanguage(select.value);try{localStorage.setItem(LANGUAGE_KEY,language);}catch{}apply();};
  apply();return {disconnect:()=>observer.disconnect()};
}
