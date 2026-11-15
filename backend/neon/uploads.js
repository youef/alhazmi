import { PutObjectCommand,GetObjectCommand,DeleteObjectCommand,S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import {randomUUID} from 'node:crypto';
import {pool,userFrom,requireOwn,json,fail,route,HttpError,digest,isId} from './shared.js';
const s3=new S3Client({region:process.env.AWS_REGION,endpoint:process.env.AWS_ENDPOINT_URL_S3,
 credentials:{accessKeyId:process.env.AWS_ACCESS_KEY_ID,secretAccessKey:process.env.AWS_SECRET_ACCESS_KEY},forcePathStyle:true});
const BUCKET='uploads', MAX_BYTES=10*1024*1024;
function sniff(buf,type){
 if(type==='application/pdf')return buf.subarray(0,5).toString()==='%PDF-';
 if(type==='image/png')return buf.length>=8&&buf.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
 if(type==='image/jpeg')return buf.length>=3&&buf[0]===255&&buf[1]===216&&buf[2]===255;
 if(type==='text/plain')return !buf.includes(0)&&!buf.toString('utf8').includes('\uFFFD');
 return false;
}
export default {async fetch(req){
 try{
  const path=route(req);
  if(path==='/health')return json({ok:true,service:'alhazmi-uploads',bucket:'private',maxBytes:MAX_BYTES});
  const u=await userFrom(req),own=await requireOwn(u);
  if(path==='/v1/files'&&req.method==='POST'){
   const contentType=(req.headers.get('content-type')||'').split(';')[0].trim().toLowerCase();
   if(!['image/jpeg','image/png','application/pdf','text/plain'].includes(contentType))throw new HttpError(415,'Unsupported content type');
   const size=Number(req.headers.get('content-length')||0);
   if(!Number.isFinite(size)||size>MAX_BYTES)throw new HttpError(413,'File too large');
   const data=Buffer.from(await req.arrayBuffer());
   if(!data.length||data.length>MAX_BYTES)throw new HttpError(413,'File size must be 1 byte–10 MB');
   if(!sniff(data,contentType))throw new HttpError(415,'Invalid file signature');
   const extension={'image/jpeg':'jpg','image/png':'png','application/pdf':'pdf','text/plain':'txt'}[contentType];
   const key='members/'+own.personId+'/'+randomUUID()+'.'+extension;
   const checksum=digest(data),id=randomUUID();
   await s3.send(new PutObjectCommand({Bucket:BUCKET,Key:key,Body:data,ContentType:contentType,Metadata:{sha256:checksum}}));
   const client=await pool.connect();
   try{await client.query('begin');
    await client.query("insert into public.archive_items(id,tribe_id,uploader_id,item_type,title,storage_path,mime_type,sha256,visibility,review_status) values($1,$2,$3,$4,$5,$6,$7,$8,'restricted','pending')",
      [id,own.tribeId,u.id,contentType.startsWith('image/')?'photo':'document','مرفق خاص',key,contentType,checksum]);
    await client.query('insert into public.archive_people(archive_id,person_id) values($1,$2)',[id,own.personId]);
    await client.query('commit');
   }catch(e){await client.query('rollback').catch(()=>{});await s3.send(new DeleteObjectCommand({Bucket:BUCKET,Key:key})).catch(()=>{});throw e;}
   finally{client.release();}
   return json({id,status:'pending_review',size:data.length,mime:contentType},201);
  }
  const match=/^\/v1\/files\/([0-9a-f-]{36})\/download$/i.exec(path);
  if(match&&req.method==='GET'&&isId(match[1])){
   const r=await pool.query("select a.storage_path,a.mime_type from public.archive_items a join public.archive_people ap on ap.archive_id=a.id where a.id=$1 and ap.person_id=$2 and a.visibility='restricted' limit 1",[match[1],own.personId]);
   if(!r.rowCount)throw new HttpError(404,'File not found');
   const url=await getSignedUrl(s3,new GetObjectCommand({Bucket:BUCKET,Key:r.rows[0].storage_path}),{expiresIn:60});
   return json({url,expiresInSeconds:60});
  }
  throw new HttpError(404,'Unknown route');
 }catch(e){if(!(e instanceof HttpError))console.error('uploads internal failure',e?.code||e?.name);return fail(e);}
}};
