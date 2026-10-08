import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sessionUser } from '@/lib/auth';
export async function GET(){
 const user=await sessionUser();if(!user)return NextResponse.json({error:'No autorizado'},{status:401});
 const where=user.role==='ASESOR'?{ownerId:user.id}:{};
 const opportunities=await db.opportunity.findMany({where,select:{stage:true,kind:true,amount:true,owner:{select:{name:true}},product:true}});
 const byStage=Object.fromEntries(['NUEVO','CONTACTADO','COTIZADO','NEGOCIACION','GANADO','PERDIDO'].map(s=>[s,{count:0,amount:0}]));
 const byKind:Record<string,number>={};
 for(const o of opportunities){byStage[o.stage].count++;byStage[o.stage].amount+=Number(o.amount);byKind[o.kind]=(byKind[o.kind]||0)+1;}
 return NextResponse.json({total:opportunities.length,byStage,byKind,wonAmount:byStage.GANADO.amount,openAmount:opportunities.filter(o=>!['GANADO','PERDIDO'].includes(o.stage)).reduce((s,o)=>s+Number(o.amount),0)});
}