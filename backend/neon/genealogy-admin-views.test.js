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

test('focused genealogy displays ancestry when no marriage has been recorded',()=>{
 const p={id:'00000000-0000-0000-0000-000000000001',full_name_ar:'ابن تجريبي',gender:'male',record_status:'under_review',father_id:'00000000-0000-0000-0000-000000000002',mother_id:'00000000-0000-0000-0000-000000000003'};
 const father={id:p.father_id,full_name_ar:'الأب',gender:'male',father_id:'00000000-0000-0000-0000-000000000004',family_name:'عائلة تجريبية',record_status:'under_review'};
 const mother={id:p.mother_id,full_name_ar:'الأم',gender:'female',record_status:'under_review'};
 const grand={id:father.father_id,full_name_ar:'الجد',gender:'male',record_status:'under_review'};
 const data={focusedPerson:p,focusedUnit:null,relations:{ancestors:[father,mother,grand],spouses:[],children:[]},canEditPeople:true,canEditUnits:false,
  people:[p],directory:[p,father,mother,grand],directoryUnits:[],units:[],tribes:[],sources:[],stats:{people:4,drafts:4,units:0,unit_reviews:0},q:'',unitQ:'',childOf:null};
 const html=genealogyView(data,'csrf-token-test');
 assert.ok(html.includes('لا توجد زيجات مسجلة'));
 assert.ok(html.includes('الجد من الأم')===false || html.includes('أجداد الأم'));
 for(const field of ['relative_id','relative_name','relative_identity','relative_family_id','relation_role','confirm_reuse'])
  assert.ok(html.includes('name="'+field+'"'),field);
 assert.ok(html.includes('إضافة زوج / ابن / أب / أم / جد'));
 assert.ok(html.includes('الأب')&&html.includes('الأم')&&html.includes('الجد'));
});
test('focused genealogy shows spouses and children with edit links and reported statuses',()=>{
 const p={id:'00000000-0000-0000-0000-000000000001',full_name_ar:'شخص',gender:'male',record_status:'under_review'};
 const wife={id:'00000000-0000-0000-0000-000000000002',full_name_ar:'زوجة تجريبية',marriage_status:'reported',record_status:'under_review'};
 const child={id:'00000000-0000-0000-0000-000000000003',full_name_ar:'ابن تجريبي',gender:'male',record_status:'under_review'};
 const data={focusedPerson:p,relations:{spouses:[wife],children:[child],ancestors:[]},focusedUnit:null,
 canEditPeople:true,canEditUnits:false,people:[p],directory:[],directoryUnits:[],units:[],tribes:[],sources:[],stats:{people:3,drafts:3,units:0,unit_reviews:0},q:'',unitQ:'',childOf:null};
 const html=genealogyView(data,'csrf-token-test');
 assert.ok(html.includes('زوجة تجريبية'));
 assert.ok(html.includes('ابن تجريبي'));
 assert.ok(html.includes('زواج مُبلّغ عنه'));
 assert.ok(html.includes(encodeURIComponent(wife.id)+'#gen-person-edit'));
 assert.ok(html.includes(encodeURIComponent(child.id)+'#gen-person-edit'));
});
