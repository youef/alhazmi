import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { genealogyView } from './genealogy-admin-views.js';

test('genealogy editor renders full private fields and keeps existing parents selected',()=>{
 const person={id:'00000000-0000-0000-0000-000000000001',full_name_ar:'فرد تجريبي',gender:'male',
   father_id:'00000000-0000-0000-0000-000000000002',mother_id:null,family_unit_id:null,
   birth_date:'1999-02-04',living_status:'alive',record_status:'under_review',national_id_last4:'1234',
   private_notes:'</textarea><script>alert(1)</script>',private_address:{street:'شارع التجربة'},phone:'0500000000'};
 const data={focusedPerson:person,focusedUnit:null,canEditPeople:true,canEditUnits:false,
   directory:[{id:person.father_id,full_name_ar:'الأب التجريبي',gender:'male',identity_mask:null}],
   directoryUnits:[],units:[],tribes:[{id:'00000000-0000-0000-0000-000000000003',name_ar:'قبيلة'}],
   sources:[],people:[person],stats:{people:1,units:0,drafts:1,unit_reviews:0},q:'',unitQ:'',childOf:null};
 const html=genealogyView(data,'csrf-token-test');
 for(const field of ['identity','remove_identity','address_short_code','address_street','address_postal_code',
 'address_building_number','address_additional_number','address_unit_number','phone','email',
 'education_level','employment_status','private_notes','birth_date','death_date'])
   assert.ok(html.includes('name="'+field+'"'),'Missing '+field);
 assert.match(html,/value="1999-02-04"/);
 assert.ok(html.includes('&lt;script&gt;'));
 assert.ok(!html.includes('<script>alert(1)</script>'));
 assert.match(html,/name="father_id"/);
 assert.match(html,/option value="" disabled/);
 assert.ok(html.includes('creationExtras')===false);
 assert.ok(html.includes('تفاصيل الفرد الخاصة'));
});
