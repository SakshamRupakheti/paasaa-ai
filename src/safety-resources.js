// Existing product resources, kept outside model-generated text. Not inferred from timezone.
export const SAFETY_RESOURCES=Object.freeze({
  US:[['Call 988','tel:988'],['Text 988','sms:988'],['Immediate danger or medical emergency: call 911','tel:911'],['988 Lifeline website','https://988lifeline.org/']],
  UK:[['Call Samaritans: 116 123','tel:116123'],['Immediate danger: call 999','tel:999'],['Under 19: call Childline','tel:08001111'],['Samaritans website','https://www.samaritans.org/how-we-can-help/contact-samaritan/']],
  IE:[['Call Samaritans: 116 123','tel:116123'],['Immediate danger: call 112','tel:112'],['Samaritans website','https://www.samaritans.org/how-we-can-help/contact-samaritan/']],
  other:[['Find a helpline for your country','https://findahelpline.com/']]
});
export function resourcesFor(region){return SAFETY_RESOURCES[region]||SAFETY_RESOURCES.other;}
export function resourceLink(label,href){const a=document.createElement('a');a.textContent=label;a.href=href;if(href.startsWith('https:')){a.target='_blank';a.rel='noopener noreferrer';}return a;}
export function mountSafetyList(root){
  root.replaceChildren();
  for(const [region,label] of [['US','United States'],['UK','United Kingdom'],['IE','Ireland'],['other','Other countries']]){
    const item=document.createElement('li'),heading=document.createElement('strong');heading.textContent=label+': ';item.append(heading);
    for(const [index,[title,href]] of resourcesFor(region).entries()){if(index)item.append(' · ');item.append(resourceLink(title,href));}root.append(item);
  }
}
