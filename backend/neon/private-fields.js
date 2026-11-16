import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';

// Private data is never written to public biography, URLs, HTML data attributes or logs.
// Prefer DIWAN_PRIVATE_DATA_KEY; the existing server-only cookie key provides an
// installation-compatible fallback until a dedicated stable encryption key is configured.
function key(){
  const secret=process.env.DIWAN_PRIVATE_DATA_KEY||process.env.NEON_AUTH_COOKIE_SECRET;
  if(!secret||secret.length<24)throw new Error('PRIVATE_DATA_KEY_MISSING');
  return createHash('sha256').update('diwan:private-fields:v1\0').update(secret).digest();
}
function context(personId,field){return Buffer.from('diwan:person:v1:'+personId+':'+field,'utf8');}
export function sealPrivate(value,personId,field){
  if(value==null||value==='')return null;
  const iv=randomBytes(12);
  const cipher=createCipheriv('aes-256-gcm',key(),iv);
  cipher.setAAD(context(personId,field));
  const bytes=Buffer.concat([cipher.update(String(value),'utf8'),cipher.final()]);
  return Buffer.concat([Buffer.from('DPV1'),iv,cipher.getAuthTag(),bytes]);
}
export function unsealPrivate(value,personId,field){
  if(!value)return '';
  const bytes=Buffer.isBuffer(value)?value:Buffer.from(value);
  if(bytes.length<32||bytes.subarray(0,4).toString()!=='DPV1')throw new Error('PRIVATE_DATA_FORMAT_UNSUPPORTED');
  const decipher=createDecipheriv('aes-256-gcm',key(),bytes.subarray(4,16));
  decipher.setAAD(context(personId,field));
  decipher.setAuthTag(bytes.subarray(16,32));
  return Buffer.concat([decipher.update(bytes.subarray(32)),decipher.final()]).toString('utf8');
}
