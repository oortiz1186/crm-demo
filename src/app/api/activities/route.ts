import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { canManage, sessionUser } from '@/lib/auth';
import { z } from 'zod';
export async function GET(){
 const user=await sessionUser();if(!user)return NextResponse.json({error:'No autorizado'},{status:401});
 const where=user.role==='ADMIN'||user.role==='COORDINACION'?{}:{opportunity:{ownerId:user.id}};
 return NextResponse.json(await db.activity.findMany({where,include:{opportunity:{select:{title:true,client:{select:{name:true}}}}},orderBy:[{dueAt:'asc'},{createdAt:'desc'}],take:500}));
}
export async function POST(req:Request){
 const user=await sessionUser();if(!user)return NextResponse.json({error:'No autorizado'},{status:401});
 const p=z.object({opportunityId:z.string(),type:z.enum(['LLAMADA','WHATSAPP','CORREO','COTIZACION','TAREA','NOTA']),description:z.string().trim().min(3).max(2000),dueAt:z.string().optional()}).safeParse(await req.json().catch(()=>null));
 if(!p.success)return NextResponse.json({error:'Datos inválidos'},{status:400});
 const o=await db.opportunity.findUnique({where:{id:p.data.opportunityId}});
 if(!o)return NextResponse.json({error:'Oportunidad no encontrada'},{status:404});
 if(!canManage(user.role,o.ownerId,user.id))return NextResponse.json({error:'Sin permisos'},{status:403});
 const dueAt=p.data.dueAt?new Date(p.data.dueAt):null;
 if(dueAt && Number.isNaN(dueAt.getTime()))return NextResponse.json({error:'Fecha inválida'},{status:400});
 const a=await db.activity.create({data:{opportunityId:o.id,userId:user.id,type:p.data.type,description:p.data.description,dueAt}});
 await db.auditLog.create({data:{actorId:user.id,entity:'Activity',entityId:a.id,action:'CREATE'}});
 return NextResponse.json(a,{status:201});
}
export async function PATCH(req:Request){
 const user=await sessionUser();if(!user)return NextResponse.json({error:'No autorizado'},{status:401});
 const p=z.object({id:z.string(),completed:z.boolean()}).safeParse(await req.json().catch(()=>null));
 if(!p.success)return NextResponse.json({error:'Datos inválidos'},{status:400});
 const old=await db.activity.findUnique({where:{id:p.data.id},include:{opportunity:true}});
 if(!old)return NextResponse.json({error:'No existe'},{status:404});
 if(!canManage(user.role,old.opportunity.ownerId,user.id))return NextResponse.json({error:'Sin permisos'},{status:403});
 const a=await db.activity.update({where:{id:old.id},data:{completedAt:p.data.completed?new Date():null}});
 await db.auditLog.create({data:{actorId:user.id,entity:'Activity',entityId:a.id,action:p.data.completed?'COMPLETE':'REOPEN'}});
 return NextResponse.json(a);
}