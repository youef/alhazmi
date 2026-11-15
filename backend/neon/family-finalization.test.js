
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { verifyPersonRecord,linkVerifiedAccount,verifyFamilyConnection,shareOwnName } from './family-finalization.js';

const user={id:'11111111-1111-4111-8111-111111111111',person_id:null};
const requestId='22222222-2222-4222-8222-222222222222';
const personId='33333333-3333-4333-8333-333333333333';
const form=(obj)=>new URLSearchParams(Object.entries(obj));
const checked={request:requestId,confirm_evidence:'yes',note:'Independent genealogy verification was completed'};

test('a private draft cannot be verified without explicit evidence attestation',async()=>{
 await assert.rejects(()=>verifyPersonRecord({query:()=>{throw Error('Should not query')}},user,form({request:requestId,note:'Has enough descriptive text for notes'})),e=>e.status===403);
});
test('two-stage verification never publishes a person automatically',async()=>{
 const records=[];
 const db={query:async(sql,args)=>{
  records.push({sql,args});
  if(sql.includes('select q.created_person_id'))return {rows:[{created_person_id:personId,status:'approved',linked_person_id:null,record_status:'under_review'}]};
  return {rows:[]};
 }};
 await verifyPersonRecord(db,user,form(checked));
 assert.ok(records.some(x=>x.sql.includes("set record_status='verified'")));
 assert.ok(records.some(x=>x.sql.includes('insert into public.audit_log')));
});
test('account-to-person linkage refuses silently overwriting a different linkage',async()=>{
 const calls=[];
 const db={query:async(sql,args)=>{
  calls.push(sql);
  if(sql.includes('select id,tribe_id,family_unit_id'))return {rows:[{id:personId,tribe_id:requestId,family_unit_id:requestId}]};
  if(sql.includes('neon_auth."user"'))return {rows:[{id:requestId}]};
  if(sql.includes('insert into public.user_profiles'))return {rows:[]};
  return {rows:[]};
 }};
 await assert.rejects(()=>linkVerifiedAccount(db,user,form({account:requestId,person:personId,confirm_evidence:'yes',note:'Verified original identity documentation'})),e=>e.status===409);
 assert.ok(!calls.some(sql=>sql.includes('insert into public.audit_log')));
});
test('parentage cannot be finalized when a claimed relative remains unverified',async()=>{
 const db={query:async sql=>{
  if(sql.includes('select * from public.diwan_family_relation_requests'))return {rows:[{created_person_id:personId,anchor_person_id:requestId,tribe_id:personId,relationship:'son'}]};
  if(sql.includes('select id,gender,tribe_id,record_status'))return {rows:[{id:personId,gender:'male',tribe_id:personId,record_status:'under_review'},{id:requestId,gender:'male',tribe_id:personId,record_status:'verified'}]};
  return {rows:[]};
 }};
 await assert.rejects(()=>verifyFamilyConnection(db,user,form(checked)),e=>e.status===403);
});
test('adult name visibility can only be shared by a linked verified person',async()=>{
 await assert.rejects(()=>shareOwnName({query:()=>{throw Error('should not run')}},user,form({viewer_email:'parent@example.test'})),e=>e.status===403);
});
