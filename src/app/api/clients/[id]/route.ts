import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sessionUser } from '@/lib/auth';
import { z } from 'zod';
type Context={params:Promise<{id:string}>};
export async function GET(_req:Request,{params}:Context){
 const user=await sessionUser();if(!user)return NextResponse.json({error:'No autorizado'},{status:401});
 const {id}=await params;
 const client=await db.client.findUnique({where:{id},include:{
 opportunities:{include:{owner:{select:{id:true,name:true}},activities:{orderBy:{createdAt:'desc'},take:20,include:{user:{select:{name:true}}}}},orderBy:{updatedAt:'desc'}}
 }});
 if(!client)return NextResponse.json({error:'Cliente no encontrado'},{status:404});
 return NextResponse.json({...client,opportunities:client.opportunities.map(o=>({
 ...o,amount:Number(o.amount),
 activities:(user.role==='ADMIN'||user.role==='COORDINACION'||o.ownerId===user.id)?o.activities:[]
 }))});
}
export async function PATCH(req:Request,{params}:Context){
 const user=await sessionUser();if(!user)return NextResponse.json({error:'No autorizado'},{status:401});
 if(!['ADMIN','COORDINACION'].includes(user.role))return NextResponse.json({error:'Solo coordinación comercial puede modificar la ficha central'},{status:403});
 const {id}=await params;
 const parsed=z.object({name:z.string().trim().min(2).max(180),rfc:z.string().trim().max(20).optional(),phone:z.string().trim().max(30).optional(),email:z.union([z.email(),z.literal('')]).optional(),notes:z.string().max(2000).optional()}).safeParse(await req.json().catch(()=>null));
 if(!parsed.success)return NextResponse.json({error:'Datos inválidos'},{status:400});
 const d=parsed.data;
 const current=await db.client.findUnique({where:{id}});if(!current)return NextResponse.json({error:'Cliente no encontrado'},{status:404});
 const rfc=d.rfc?.toUpperCase()||null;
 if(rfc){const duplicate=await db.client.findUnique({where:{rfc}});if(duplicate&&duplicate.id!==id)return NextResponse.json({error:'RFC registrado en otro cliente'},{status:409});}
 const client=await db.$transaction(async tx=>{
 const updated=await tx.client.update({where:{id},data:{name:d.name,rfc,phone:d.phone||null,email:d.email||null,notes:d.notes||null}});
 await tx.auditLog.create({data:{actorId:user.id,entity:'Client',entityId:id,action:'UPDATE',detail:{previousName:current.name,newName:d.name}}});
 return updated;
 });
 return NextResponse.json(client);
}