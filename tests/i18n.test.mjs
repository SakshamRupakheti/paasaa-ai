import test from 'node:test';
import assert from 'node:assert/strict';
import {LANGUAGES,normalizeLanguage,translate,formatTranslation} from '../src/i18n.js';
import {translations} from '../src/translations.js';

test('locale normalization rejects unknown keys and prototype properties',()=>{
  for(const value of [null,undefined,'fr','constructor','__proto__'])assert.equal(normalizeLanguage(value),'en');
  for(const value of Object.keys(LANGUAGES))assert.equal(normalizeLanguage(value),value);
});
test('all authored interface entries cover the three additional languages and preserve timing placeholders',()=>{
  const tokens=s=>[...s.matchAll(/\{\w+\}/g)].map(m=>m[0]).sort();
  for(const [source,entry] of Object.entries(translations))for(const locale of ['hi','ne','es']){
    assert.ok(entry[locale]?.trim(),`${source}: ${locale}`);
    assert.deepEqual(tokens(entry[locale]),tokens(source),`${source}: ${locale}`);
  }
});
test('untranslated material falls back to its original text without altering it',()=>{
  for(const locale of Object.keys(LANGUAGES))assert.equal(translate('Synthetic personal answer < unchanged >',locale),'Synthetic personal answer < unchanged >');
  assert.equal(translate('Breathe','en'),'Breathe');
});
test('timing translations use the chosen protocol and replace only explicit placeholders',()=>{
  assert.equal(formatTranslation('Cycle {current} of {total}',{current:2,total:5},'es'),'Ciclo 2 de 5');
  assert.equal(formatTranslation('{inhale} seconds in · {exhale} seconds out',{inhale:4,exhale:5},'ne'),'4 सेकेन्ड भित्र · 5 सेकेन्ड बाहिर');
  assert.equal(formatTranslation('Keep {missing}',{},'hi'),'Keep {missing}');
});
