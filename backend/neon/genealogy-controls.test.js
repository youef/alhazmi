import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';
import { wireGenealogyEditor } from './genealogy-controls.js';

function control(properties = {}) {
  const listeners = {};
  return { ...properties, addEventListener(event, handler) { listeners[event] = handler; },
    fire(event) { return listeners[event]?.(); } };
}

test('relative lookup uses POST and selects a matched record while hiding the manual name', async () => {
  const label = {};
  const name = { closest: () => label };
  const widget = {
    dataset: { initialId: '' },
    closest: () => ({ elements: { csrf: { value:'token' }, person_id: { value:'person' }, relative_name:name } }),
  };
  const selected = { name:'relative_id', value:'' };
  const identity = control({ value:'fixture-id' });
  const type = control({ value:'national_id' });
  const trigger = control();
  const result = {};
  widget.querySelector = selector => ({
    'input[type=hidden]':selected,'input[type=password]':identity,select:type,button:trigger,'[data-lookup-result]':result,
  })[selector];
  const document = {
    querySelectorAll: selector => selector === '[data-relative-lookup]' ? [widget] : [],
    getElementById: () => null,
  };
  const fetch = async (url, options) => {
    assert.equal(url,'/admin/genealogy');
    assert.equal(options.method,'POST');
    assert.equal(options.body.get('identity'),'fixture-id');
    assert.equal(options.body.get('csrf'),'token');
    return { ok:true, json:async () => ({
      matched:true,record:{id:'matched-person',full_name_ar:'فرد تجريبي',masked_value:'••••1234'},
    }) };
  };
  runInNewContext('(' + wireGenealogyEditor.toString() + ')()', { document, fetch, URLSearchParams });
  await trigger.fire('click');
  assert.equal(selected.value,'matched-person');
  assert.match(result.textContent,/فرد تجريبي.*1234/);
  assert.equal(label.hidden,true);
  identity.value = 'different-id';
  identity.fire('input');
  assert.equal(selected.value,'');
  assert.equal(label.hidden,false);
});

test('the family chooser hides until a fakhth is selected and only lists matching families', () => {
  const copy = properties => ({ ...properties, cloneNode:() => copy(properties) });
  const family = { value:'', options:[
    copy({ value:'',dataset:{} }),
    copy({ value:'family-one',dataset:{fakhth:'one'} }),
    copy({ value:'family-two',dataset:{fakhth:'two'} }),
  ], replaceChildren(...items) { this.options = items; } };
  const fakhth = control({ value:'', options:[], selectedOptions:[] });
  const label = {};
  const picker = {
    closest: () => ({ querySelector: () => null }),
    querySelector: selector => ({ '[data-fakhth]':fakhth,'[data-family]':family,'[data-family-label]':label })[selector],
  };
  const document = {
    querySelectorAll: selector => selector === '[data-family-picker]' ? [picker] : [],
    getElementById: () => null,
  };
  runInNewContext('(' + wireGenealogyEditor.toString() + ')()', { document });
  assert.equal(label.hidden,true);
  fakhth.value='two';
  fakhth.fire('change');
  assert.equal(label.hidden,false);
  assert.deepEqual(family.options.map(option=>option.value),['','family-two']);
});

