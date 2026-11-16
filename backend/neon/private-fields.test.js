import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { sealPrivate, unsealPrivate } from './private-fields.js';
test('private fields encrypt, bind person/field and reject ciphertext changes',()=>{
  const old=process.env.DIWAN_PRIVATE_DATA_KEY;
  process.env.DIWAN_PRIVATE_DATA_KEY='test-key-not-for-production-0123456789';
  try{
    const encrypted=sealPrivate('سري جدًا 12345','a','national_id');
    assert.equal(unsealPrivate(encrypted,'a','national_id'),'سري جدًا 12345');
    assert.equal(encrypted.includes(Buffer.from('12345')),false);
    assert.throws(()=>unsealPrivate(encrypted,'b','national_id'));
    assert.throws(()=>unsealPrivate(encrypted,'a','phone'));
    assert.equal(unsealPrivate(null,'a','phone'),'');
    const altered=Buffer.from(encrypted);altered[altered.length-1]^=1;
    assert.throws(()=>unsealPrivate(altered,'a','national_id'));
  } finally {if(old===undefined)delete process.env.DIWAN_PRIVATE_DATA_KEY;else process.env.DIWAN_PRIVATE_DATA_KEY=old;}
});
