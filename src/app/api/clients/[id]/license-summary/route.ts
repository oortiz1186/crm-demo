import { NextResponse } from 'next/server';
import { sessionUser } from '@/lib/auth';
import { db } from '@/lib/db';
type Context={params:Promise<{id:string}>};
export async function GET(_request:Request,{params}:Context){
 const user=await sessionUser();if(!user)return NextResponse.json({error:'No autorizado'},{status:401});
 const {id}=await params;
 const client=await db.client.findUnique({where:{id},select:{id:true,externalLicenseClientId:true}});
 if(!client)return NextResponse.json({error:'Cliente no encontrado'},{status:404});
 return NextResponse.json({connected:false,licenses:[],message:'Licencias MIDA permanece independiente. La API de consulta se habilitará tras validar su contrato, autenticación y correspondencia de clientes.'});
}