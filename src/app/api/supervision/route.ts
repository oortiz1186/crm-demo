import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sessionUser } from '@/lib/auth';
export async function GET(){
 const user=await sessionUser();
 if(!user)return NextResponse.json({error:'No autorizado'},{status:401});
 if(!['ADMIN','COORDINACION','DIRECCION'].includes(user.role))return NextResponse.json({error:'Sin permisos'},{status:403});
 const now=new Date();
 const start=new Date(now.getFullYear(),now.getMonth(),now.getDate());
 const cutoff=new Date(now.getTime()-7*86400000);
 const open=['NUEVO','CONTACTADO','COTIZADO','NEGOCIACION'] as const;
 const [overdue,opportunities]=await Promise.all([
 db.activity.findMany({where:{completedAt:null,dueAt:{lt:start}},select:{id:true,description:true,dueAt:true,opportunity:{select:{id:true,title:true,owner:{select:{id:true,name:true}},client:{select:{name:true}}}}},orderBy:{dueAt:'asc'},take:200}),
 db.opportunity.findMany({where:{stage:{in:[...open]}},select:{id:true,title:true,kind:true,stage:true,updatedAt:true,expectedClose:true,owner:{select:{id:true,name:true}},client:{select:{name:true}},activities:{select:{createdAt:true},orderBy:{createdAt:'desc'},take:1}},take:500})
 ]);
 const unattended=opportunities.filter(o=>!o.activities.length||o.activities[0].createdAt<cutoff).map(o=>({id:o.id,title:o.title,client:o.client.name,owner:o.owner.name,ownerId:o.owner.id,lastActivity:o.activities[0]?.createdAt||null}));
 const renewals=opportunities.filter(o=>o.kind==='RENOVACION'&&o.expectedClose&&o.expectedClose<new Date(start.getTime()+30*86400000)).map(o=>({id:o.id,title:o.title,client:o.client.name,owner:o.owner.name,expectedClose:o.expectedClose}));
 const byAdvisor:Record<string,{name:string,overdue:number,unattended:number,open:number}>={};
 for(const o of opportunities){const id=o.owner.id;byAdvisor[id]??={name:o.owner.name,overdue:0,unattended:0,open:0};byAdvisor[id].open++;}
 for(const a of overdue){const id=a.opportunity.owner.id;byAdvisor[id]??={name:a.opportunity.owner.name,overdue:0,unattended:0,open:0};byAdvisor[id].overdue++;}
 for(const o of unattended){byAdvisor[o.ownerId]??={name:o.owner,overdue:0,unattended:0,open:0};byAdvisor[o.ownerId].unattended++;}
 return NextResponse.json({overdue,unattended,renewals,byAdvisor:Object.values(byAdvisor).sort((a,b)=>b.overdue-a.overdue),rules:{inactiveDays:7,renewalWindowDays:30}});
}
