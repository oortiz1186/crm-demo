import { NextResponse } from 'next/server';
import { sessionUser } from '@/lib/auth';
export async function GET() {
 const user = await sessionUser();
 if (!user) return NextResponse.json({error:'No autorizado'},{status:401});
 return NextResponse.json({items:[],status:'pending_database_model',message:'El módulo de cotizaciones requiere terminar la migración de base de datos.'});
}
