import {sameOrigin,HttpError} from '../../../../lib/validation.js';
import {studentSessionCookie} from '../../../../lib/student-security.js';
export const runtime='nodejs';
export async function POST(request) {
  try { sameOrigin(request); }
  catch(error) { return Response.json({error:'Cross-site requests are not allowed.'},{status:error instanceof HttpError?error.status:403}); }
  return Response.json({ok:true},{headers:{
    'Set-Cookie':studentSessionCookie('',0),
    'Cache-Control':'no-store',
  }});
}
