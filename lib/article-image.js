import sharp from 'sharp';
import {HttpError} from './validation.js';
export async function normalizeArticlePhoto(bytes,mime){
 if(bytes.length>3*1024*1024)throw new HttpError(413,'Photos must be 3 MB or smaller.');
 const types={'image/jpeg':'jpeg','image/png':'png','image/webp':'webp'};
 if(!types[mime])throw new HttpError(415,'Choose a JPEG, PNG or WebP photo.');
 try{
  const image=sharp(bytes,{limitInputPixels:24000000,failOn:'warning'}),meta=await image.metadata();
  if(meta.format!==types[mime]||(meta.pages??1)>1)throw Error();
  const {data,info}=await image.timeout({seconds:8}).rotate().resize({width:1600,height:1600,fit:'inside',withoutEnlargement:true}).webp({quality:78}).toBuffer({resolveWithObject:true});
  if(data.length>1048576)throw new HttpError(413,'Photo is too detailed. Choose a smaller photo.');
  return {bytes:data,width:info.width,height:info.height};
 }catch(error){if(error instanceof HttpError)throw error;throw new HttpError(400,'Unable to read this photo. Choose a valid, still JPEG, PNG or WebP.');}
}
