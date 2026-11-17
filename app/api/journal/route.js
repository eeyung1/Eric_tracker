import {journalList} from '../../../lib/journal.js';
export const dynamic='force-dynamic';export const runtime='nodejs';
export async function GET(){try{return Response.json(await journalList(1,3),{headers:{'Cache-Control':'no-store'}});}catch{return Response.json({error:'Journal unavailable.'},{status:503,headers:{'Cache-Control':'no-store'}});}}
