import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sessionUser } from '@/lib/auth';
export async function GET(request:Request){
 const user=await sessionUser();if(!user)return NextResponse.json({error:'No autorizado'},{status:401});
 const url=new URL(request.url);
 const scope=url.searchParams.get('scope');
 const where={kind:'RENOVACION' as const,...(scope==='mine'?{ownerId:user.id}:{})};
 const renewals=await db.opportunity.findMany({where,include:{client:{select:{id:true,name:true,rfc:true,phone:true}},owner:{select:{id:true,name:true}},activities:{orderBy:{createdAt:'desc'},take:1}},orderBy:[{expectedClose:'asc'},{createdAt:'desc'}],take:500});
 const today=new Date();today.setHours(0,0,0,0);
 const data=renewals.map(o=>{
 const days=o.expectedClose?Math.ceil((o.expectedClose.getTime()-today.getTime())/86400000):null;
 const closed=o.stage==='GANADO'||o.stage==='PERDIDO';
 const urgency=closed?'CERRADA':days===null?'SIN_FECHA':days<0?'VENCIDA':days<=30?'PROXIMA':'PROGRAMADA';
 return {id:o.id,title:o.title,product:o.product,amount:Number(o.amount),stage:o.stage,ownerId:o.ownerId,owner:o.owner,client:o.client,expectedClose:o.expectedClose,daysRemaining:days,urgency,lastActivity:o.activities[0]?{type:o.activities[0].type,createdAt:o.activities[0].createdAt,description:o.activities[0].description}:null};
 });
 return NextResponse.json({items:data,summary:{total:data.length,overdue:data.filter(x=>x.urgency==='VENCIDA').length,upcoming:data.filter(x=>x.urgency==='PROXIMA').length,undated:data.filter(x=>x.urgency==='SIN_FECHA').length,won:data.filter(x=>x.stage==='GANADO').length}});
}
