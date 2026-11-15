import { Pool } from 'pg';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { randomUUID, createHash } from 'node:crypto';
import { attachDatabasePool } from '@neon/functions';

export const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 5 });
attachDatabasePool(pool);
const jwksUrl = process.env.NEON_AUTH_JWKS_URL;
const authBase = process.env.NEON_AUTH_BASE_URL;
const jwks = jwksUrl ? createRemoteJWKSet(new URL(jwksUrl)) : null;
export const isId = value => typeof value === 'string' &&
 /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
export class HttpError extends Error { constructor(status,message){ super(message); this.status=status; } }
export const json = (data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
export const fail = e => json({error:e instanceof HttpError?e.message:'Request failed'},e instanceof HttpError?e.status:500);
export function route(req){return new URL(req.url).pathname.replace(/\/+$/,'')||'/';}
export async function userFrom(req){
 const match=/^Bearer (.+)$/i.exec(req.headers.get('authorization')||'');
 if(!match||!jwks||!authBase)throw new HttpError(401,'Authentication required');
 let payload;
 try{({payload}=await jwtVerify(match[1],jwks,{issuer:new URL(authBase).origin}));}
 catch{throw new HttpError(401,'Invalid or expired session');}
 if(!isId(payload.sub))throw new HttpError(401,'Invalid subject');
 const result=await pool.query(
   'select u.id,p.person_id,p.account_status,pe.tribe_id,pe.family_unit_id,pe.record_status from neon_auth."user" u left join public.user_profiles p on p.user_id=u.id left join public.people pe on pe.id=p.person_id where u.id=$1 and u.banned is distinct from true and u."emailVerified" is true limit 1',
   [payload.sub]);
 if(!result.rows.length)throw new HttpError(401,'Account not found');
 const u=result.rows[0];
 if(u.account_status==='suspended')throw new HttpError(403,'Account suspended');
 return u;
}
export const digest=buffer=>createHash('sha256').update(buffer).digest('hex');
export async function authorized(u,key,target={}){
 // No client-controlled role labels or user_metadata. Every grant must be active and approved.
 const grants=await pool.query(
  `select crp.decision,a.scope_type,a.scope_person_id,a.scope_unit_id,a.scope_tribe_id
     from public.user_custom_role_assignments a
     join public.custom_roles r on r.id=a.role_id and r.role_state='active'
     join public.custom_role_permissions crp on crp.role_id=r.id
     join public.permission_catalog p on p.id=crp.permission_id
    where a.user_id=$1 and p.permission_key=$2 and p.is_active
      and a.approved_at is not null and a.revoked_at is null
      and a.starts_at<=now() and (a.expires_at is null or a.expires_at>now())`,[u.id,key]);
 const match=async row=>{
   if(row.scope_type==='system')return true;
   if(row.scope_type==='self')return u.person_id&&target.personId===u.person_id&&row.scope_person_id===u.person_id;
   if(row.scope_type==='dependent'){
     if(!target.personId||row.scope_person_id!==target.personId)return false;
     const d=await pool.query('select 1 from public.care_delegations where guardian_user_id=$1 and dependent_person_id=$2 and approved_at is not null and revoked_at is null and (expires_at is null or expires_at>now()) limit 1',[u.id,target.personId]);return !!d.rowCount;
   }
   if(row.scope_type==='tribe')return !!target.tribeId&&row.scope_tribe_id===target.tribeId;
   if(row.scope_type==='unit'||row.scope_type==='family')return !!target.unitId&&row.scope_unit_id===target.unitId;
   return false;
 };
 let allowed=false;
 for(const grant of grants.rows){
  if(await match(grant)){ if(grant.decision==='deny')return false; allowed=true; }
 }
 // Explicit per-user deny also takes precedence; allow overrides cannot expand base permission.
 const denials=await pool.query(
  `select o.scope_type,o.target_person_id,o.target_unit_id,o.target_tribe_id
   from public.permission_overrides o join public.permission_catalog p on p.id=o.permission_id
   where o.subject_user_id=$1 and p.permission_key=$2 and o.effect='deny'
   and o.revoked_at is null and o.approved_at is not null
   and o.starts_at<=now() and o.expires_at>now()`,[u.id,key]);
 for(const d of denials.rows){
   if((d.target_person_id&&d.target_person_id===target.personId)||
      (d.target_unit_id&&d.target_unit_id===target.unitId)||
      (d.target_tribe_id&&d.target_tribe_id===target.tribeId))return false;
 }
 return allowed;
}
export async function requireOwn(u){
 if(!u.person_id||!u.tribe_id||u.account_status!=='active'||u.record_status!=='verified')throw new HttpError(403,'Verified person profile required');
 return {personId:u.person_id,tribeId:u.tribe_id,unitId:u.family_unit_id};
}
