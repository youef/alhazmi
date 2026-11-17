import assert from 'node:assert/strict';
import { test } from 'node:test';
import { lineageTreeAction, csrfFor } from './admin.js';
import { lineageTreeView } from './lineage-tree-view.js';
import { pool } from './shared.js';

const tribe = { id:'10000000-0000-4000-8000-000000000001', name_ar:'قبيلة تجريبية' };
const root = { id:'10000000-0000-4000-8000-000000000002', unit_type:'branch', name_ar:'الفرع الأول' };
const fakhth = { id:'10000000-0000-4000-8000-000000000003', unit_type:'subclan', parent_id:root.id, name_ar:'الفخذ الأول', registered_fakhth:true };
const family = { id:'10000000-0000-4000-8000-000000000004', unit_type:'family', parent_id:fakhth.id, name_ar:'أسرة تجريبية', can_delete:true };
const user = { id:'10000000-0000-4000-8000-000000000005' };
const source = { id:'10000000-0000-4000-8000-000000000006', title:'مصدر تجريبي' };

test('search shows a family and the path from its root, without exposing edit forms to readers', () => {
  const html = lineageTreeView({ items:[root,fakhth,family] },new URLSearchParams({ q:'اسرة' }),'');
  assert.match(html, /الفرع الأول[\s\S]+الفخذ الأول[\s\S]+أسرة تجريبية/);
  assert.doesNotMatch(html, /name="operation"/);
});

test('management presents family and fakhth creation, selects the current fakhth and supports draft deletion', () => {
  const html = lineageTreeView({ tribe, tribes:[tribe], items:[root,fakhth,family], focused:family, sources:[source], canManage:true },new URLSearchParams(),'token');
  assert.match(html, /name="unit_type" value="family"/);
  assert.match(html, /name="unit_type" value="subclan"/);
  assert.ok(html.includes('value="' + fakhth.id + '" selected'));
  assert.match(html, /value="delete_unit_draft"/);
});

test('the tree validates CSRF and commits the family parent before the registry link', async t => {
  const oldQuery = pool.query;
  const oldConnect = pool.connect;
  const oldSecret = process.env.NEON_AUTH_COOKIE_SECRET;
  t.after(() => {
    pool.query = oldQuery;
    pool.connect = oldConnect;
    if (oldSecret === undefined) delete process.env.NEON_AUTH_COOKIE_SECRET;
    else process.env.NEON_AUTH_COOKIE_SECRET = oldSecret;
  });
  process.env.NEON_AUTH_COOKIE_SECRET = 'lineage-test-only';
  const request = new Request('https://members.example.test/dashboard/tree',{ headers:{ Cookie:'session=test' } });
  const form = new URLSearchParams({operation:'edit_unit',id:family.id,name:family.name_ar,parent_id:fakhth.id});
  const statements = [];
  pool.query = async sql => ({ rows:sql.includes('crp.decision') ? [{ decision:'allow',scope_type:'system' }] : [] });
  pool.connect = async () => ({
    release() {},
    async query(sql) {
      statements.push(sql);
      if (sql.includes('as registered_fakhth')) return { rows:[{ ...family, tribe_id:tribe.id, parent_id:null }] };
      if (sql.includes('for update')) return { rows:[fakhth], rowCount:1 };
      if (sql.startsWith('with recursive parents')) return { rows:[fakhth], rowCount:1 };
      if (sql.startsWith('insert into public.lineage_family_fakhth_links')) {
        assert.ok(statements.some(statement => statement.startsWith('update public.lineage_units')));
        return { rows:[], rowCount:1 };
      }
      return { rows:[], rowCount:0 };
    },
  });
  await assert.rejects(() => lineageTreeAction(user,request,form), { status:403 });
  assert.equal(statements.length,0);
  form.set('csrf',csrfFor(user,request));
  assert.equal(await lineageTreeAction(user,request,form),family.id);
  assert.equal(statements.at(-1),'commit');
});

