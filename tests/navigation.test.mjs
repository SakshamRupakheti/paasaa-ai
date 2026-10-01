import test from 'node:test';
import assert from 'node:assert/strict';
import {screenForHash,hashForScreen} from '../src/navigation.js';
test('deep links resolve without a draft and reflection shares the check-in URL',()=>{
 assert.equal(screenForHash('#check-in'),'transition-screen');
 assert.equal(hashForScreen('reflection-screen'),'#check-in');
 assert.equal(screenForHash(hashForScreen('breathing-screen')),'breathing-screen');
 assert.equal(screenForHash('#unknown'),'breathing-screen');
 assert.equal(screenForHash('#finish'),'finish-screen');
});

test('immediate support deep link is independent of check-in state',()=>{assert.equal(screenForHash('#support'),'support-screen');assert.equal(hashForScreen('support-screen'),'#support');});
