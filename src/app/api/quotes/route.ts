import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { canManage, sessionUser } from '@/lib/auth';
import { z } from 'zod';
const createSchema=z.object({
 opportunityId:z.string().min(1),description:z.string().trim().min(3).max(2000),
 subtotal:z.coerce.number().min(0).max(999999999),tax:z.coerce.number().min(0).max(999999999),
 validUntil:z.string().optional(),notes:z.string().max(2000).optional()
});
export async function GET(){
 const user=await sessionUser();if(!user)return NextResponse.json({error:'No autorizado'},{status:401});
 const quotes=await db.quote.findMany({where:user.role==='ASESOR'?{opportunity:{ownerId:user.id}}:{},include:{opportunity:{select:{id:true,title:true,ownerId:true,client:{select:{name:true}}}},createdBy:{select:{name:true}}},orderBy:{createdAt:'desc'},take:500});
 return NextResponse.json(quotes.map(q=>({...q,subtotal:Number(q.subtotal),tax:Number(q.tax),total:Number(q.total)})));
}
export async function POST(req:Request){
 const user=await sessionUser();if(!user)return NextResponse.json({error:'No autorizado'},{status:401});
 const parsed=createSchema.safeParse(await req.json().catch(()=>null));if(!parsed.success)return NextResponse.json({error:'Datos inválidos'},{status:400});
 const d=parsed.data;const opportunity=await db.opportunity.findUnique({where:{id:d.opportunityId}});
 if(!opportunity)return NextResponse.json({error:'Oportunidad inexistente'},{status:404});
 if(!canManage(user.role,opportunity.ownerId,user.id))return NextResponse.json({error:'Sin permiso para cotizar esta oportunidad'},{status:403});
 const validUntil=d.validUntil?new Date(d.validUntil+'T12:00:00'):null;
 if(validUntil&&Number.isNaN(validUntil.getTime()))return NextResponse.json({error:'Fecha inválida'},{status:400});
 const quote=await db.$transaction(async tx=>{
  const folio='COT-'+crypto.randomUUID().slice(0,8).toUpperCase();
  const q=await tx.quote.create({data:{folio,opportunityId:d.opportunityId,createdById:user.id,description:d.description,subtotal:d.subtotal,tax:d.tax,total:Math.round((d.subtotal+d.tax)*100)/100,validUntil,notes:d.notes}});
  await tx.auditLog.create({data:{actorId:user.id,entity:'Quote',entityId:q.id,action:'CREATE'}});
  return q;
 });
 return NextResponse.json({...quote,subtotal:Number(quote.subtotal),tax:Number(quote.tax),total:Number(quote.total)},{status:201});
}
export async function PATCH(req:Request){
 const user=await sessionUser();if(!user)return NextResponse.json({error:'No autorizado'},{status:401});
 const parsed=z.object({id:z.string().min(1),status:z.enum(['BORRADOR','ENVIADA','ACEPTADA','RECHAZADA','VENCIDA'])}).safeParse(await req.json().catch(()=>null));
 if(!parsed.success)return NextResponse.json({error:'Datos inválidos'},{status:400});
 const d=parsed.data;
 const existing=await db.quote.findUnique({where:{id:d.id},include:{opportunity:{select:{ownerId:true}}}});
 if(!existing)return NextResponse.json({error:'Cotización no encontrada'},{status:404});
 if(!canManage(user.role,existing.opportunity.ownerId,user.id))return NextResponse.json({error:'Sin permiso'},{status:403});
 const allowed:Record<string,string[]>={BORRADOR:['ENVIADA'],ENVIADA:['ACEPTADA','RECHAZADA','VENCIDA'],ACEPTADA:[],RECHAZADA:[],VENCIDA:[]};
 if(!allowed[existing.status].includes(d.status))return NextResponse.json({error:'Transición de estado no permitida'},{status:409});
 const now=new Date();
 const updated=await db.$transaction(async tx=>{
  const q=await tx.quote.update({where:{id:d.id},data:{status:d.status,...(d.status==='ENVIADA'?{sentAt:now}:{}),...(d.status==='ACEPTADA'?{acceptedAt:now}:{})}});
  await tx.auditLog.create({data:{actorId:user.id,entity:'Quote',entityId:q.id,action:'STATUS_CHANGE',detail:{from:existing.status,to:d.status}}});
  return q;
 });
 return NextResponse.json({...updated,subtotal:Number(updated.subtotal),tax:Number(updated.tax),total:Number(updated.total)});
}
