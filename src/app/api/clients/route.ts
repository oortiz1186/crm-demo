import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sessionUser } from '@/lib/auth';
import { z } from 'zod';
const schema = z.object({name:z.string().trim().min(2).max(180),rfc:z.string().trim().max(20).optional(),phone:z.string().trim().max(30).optional(),email:z.union([z.email(),z.literal('')]).optional(),notes:z.string().max(2000).optional()});
export async function GET() {
 if (!await sessionUser()) return NextResponse.json({error:'No autorizado'},{status:401});
 const clients = await db.client.findMany({orderBy:{name:'asc'},take:300,include:{_count:{select:{opportunities:true}}}});
 return NextResponse.json(clients);
}
export async function POST(req:Request) {
 const user=await sessionUser(); if(!user)return NextResponse.json({error:'No autorizado'},{status:401});
 const parsed=schema.safeParse(await req.json().catch(()=>null));if(!parsed.success)return NextResponse.json({error:'Datos inválidos'},{status:400});
 const d=parsed.data;const rfc=d.rfc?.toUpperCase()||null;
 if(rfc && await db.client.findUnique({where:{rfc}}))return NextResponse.json({error:'Ya existe un cliente con este RFC'},{status:409});
 const client=await db.client.create({data:{name:d.name,rfc,phone:d.phone||null,email:d.email||null,notes:d.notes||null}});
 await db.auditLog.create({data:{actorId:user.id,entity:'Client',entityId:client.id,action:'CREATE'}});
 return NextResponse.json(client,{status:201});
}