import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sessionUser } from '@/lib/auth';
export async function GET(){
 const user=await sessionUser();if(!user)return NextResponse.json({error:'No autorizado'},{status:401});
 if(user.role!=='ADMIN'&&user.role!=='COORDINACION')return NextResponse.json([{id:user.id,name:user.name,role:user.role}]);
 return NextResponse.json(await db.user.findMany({where:{active:true},select:{id:true,name:true,role:true},orderBy:{name:'asc'}}));
}