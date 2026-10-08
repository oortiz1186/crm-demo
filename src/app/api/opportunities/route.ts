import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { canAssign, canManage, sessionUser } from '@/lib/auth';
import { z } from 'zod';
const schema=z.object({clientId:z.string().min(1),title:z.string().trim().min(3).max(180),product:z.string().trim().min(2).max(120),amount:z.coerce.number().min(0).max(999999999),kind:z.enum(['RENOVACION','NUEVO_CLIENTE','VENTA_CRUZADA','RETENCION']),ownerId:z.string().optional(),notes:z.string().max(2000).optional()});
const stages=['NUEVO','CONTACTADO','COTIZADO','NEGOCIACION','GANADO','PERDIDO'] as const;
export async function GET(){
 if(!await sessionUser())return NextResponse.json({error:'No autorizado'},{status:401});
 const items=await db.opportunity.findMany({include:{client:{select:{id:true,name:true,phone:true}},owner:{select:{id:true,name:true}},activities:{orderBy:{createdAt:'desc'},take:5}},orderBy:{updatedAt:'desc'},take:500});
 return NextResponse.json(items.map(o=>({...o,amount:Number(o.amount)})));
}
export async function POST(req:Request){
 const user=await sessionUser();if(!user)return NextResponse.json({error:'No autorizado'},{status:401});
 const parsed=schema.safeParse(await req.json().catch(()=>null));if(!parsed.success)return NextResponse.json({error:'Datos inválidos'},{status:400});
 const d=parsed.data;const ownerId=canAssign(user.role)?d.ownerId||user.id:user.id;
 if(!await db.client.findUnique({where:{id:d.clientId}}))return NextResponse.json({error:'Cliente inexistente'},{status:404});
 if(!await db.user.findFirst({where:{id:ownerId,active:true}}))return NextResponse.json({error:'Responsable inválido'},{status:400});
 const existing=await db.opportunity.findFirst({where:{clientId:d.clientId,product:{equals:d.product,mode:'insensitive'},kind:d.kind,stage:{notIn:['GANADO','PERDIDO']}}});
 if(existing)return NextResponse.json({error:'Ya existe una oportunidad abierta de este tipo y producto para el cliente'},{status:409});
 const opportunity=await db.opportunity.create({data:{clientId:d.clientId,title:d.title,product:d.product,amount:d.amount,kind:d.kind,ownerId,notes:d.notes}});
 await db.auditLog.create({data:{actorId:user.id,entity:'Opportunity',entityId:opportunity.id,action:'CREATE'}});
 return NextResponse.json(opportunity,{status:201});
}
export async function PATCH(req:Request){
 const user=await sessionUser();if(!user)return NextResponse.json({error:'No autorizado'},{status:401});
 const parsed=z.object({id:z.string(),stage:z.enum(stages).optional(),ownerId:z.string().optional(),lostReason:z.string().max(1000).optional()}).safeParse(await req.json().catch(()=>null));
 if(!parsed.success)return NextResponse.json({error:'Datos inválidos'},{status:400});
 const d=parsed.data;const old=await db.opportunity.findUnique({where:{id:d.id}});
 if(!old)return NextResponse.json({error:'No existe'},{status:404});
 if(!canManage(user.role,old.ownerId,user.id))return NextResponse.json({error:'Sin permisos para editar esta oportunidad'},{status:403});
 if(d.ownerId && !canAssign(user.role))return NextResponse.json({error:'Sin permiso para reasignar'},{status:403});
 if(d.ownerId && !await db.user.findFirst({where:{id:d.ownerId,active:true}}))return NextResponse.json({error:'Responsable inválido'},{status:400});
 if(d.stage==='PERDIDO' && !(d.lostReason||old.lostReason))return NextResponse.json({error:'Indica motivo de pérdida'},{status:400});
 const updated=await db.$transaction(async tx=>{
 const o=await tx.opportunity.update({where:{id:d.id},data:{stage:d.stage,ownerId:d.ownerId,lostReason:d.lostReason}});
 await tx.auditLog.create({data:{actorId:user.id,entity:'Opportunity',entityId:o.id,action:'UPDATE',detail:{oldStage:old.stage,newStage:o.stage,oldOwner:old.ownerId,newOwner:o.ownerId}}});
 return o;
 });
 return NextResponse.json({...updated,amount:Number(updated.amount)});
}