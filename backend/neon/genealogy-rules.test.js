import { describe, expect, it } from 'node:test';
import assert from 'node:assert/strict';
import { fingerprintIdentity, canonicalName, relativePlan, assertDistinctParents, cleanName } from './genealogy-rules.js';

describe('Administrative genealogy safety rules', () => {
  it('normalizes Arabic names without changing their stored spelling', () => {
    assert.equal(canonicalName(' أَحْمَد الحَازِمِيّ '),canonicalName('احمد الحازمي'));
    assert.equal(cleanName(' احمد   بن يوسف '), 'احمد بن يوسف');
  });
  it('uses the existing domain-separated, deterministic HMAC for IDs', () => {
    const f=fingerprintIdentity('1000000000','national_id','test-secret');
    assert.equal(f.digest.length,32);
    assert.equal(f.last4,'0000');
    assert.ok(!f.digest.toString('hex').includes('1000000000'));
    assert.deepEqual(f.digest,fingerprintIdentity('1000-000-000','national_id','test-secret').digest);
    assert.notDeepEqual(f.digest,fingerprintIdentity('1000000000','residency','test-secret').digest);
    assert.throws(()=>fingerprintIdentity('1234','national_id','test-secret'));
    assert.throws(()=>fingerprintIdentity('1000000000','national_id',''));
  });
  it('only builds ancestor levels with their intermediate parents',()=>{
    assert.deepEqual(relativePlan({father_name:'A',father_father_name:'B',father_mother_id:'x'}),['father_father','father_mother','father']);
    assert.throws(()=>relativePlan({mother_mother_name:'Missing mother'}),/MOTHER_REQUIRED/);
  });
  it('rejects self-parent and duplicate mother/father',()=>{
    assert.throws(()=>assertDistinctParents('a','a'),/SAME_PARENTS/);
    assert.throws(()=>assertDistinctParents('a','b','b'),/SELF_PARENT/);
    assert.doesNotThrow(()=>assertDistinctParents('a','b','c'));
  });
});
