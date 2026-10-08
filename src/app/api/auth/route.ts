import { NextResponse } from 'next/server';
import { compare } from 'bcryptjs';
import { db } from '@/lib/db';
import { sessionUser, signInCookie } from '@/lib/auth';
export async function GET() { return NextResponse.json({ user: await sessionUser() }); }
export async function POST(req: Request) {
 try {
 const body = await req.json();
 if (typeof body.email !== 'string' || typeof body.password !== 'string') return NextResponse.json({error:'Credenciales inválidas'}, {status:400});
 const user = await db.user.findUnique({where:{email:body.email.toLowerCase().trim()}});
 if (!user?.active || !(await compare(body.password,user.passwordHash))) return NextResponse.json({error:'Correo o contraseña incorrectos'}, {status:401});
 await signInCookie(user.id);
 return NextResponse.json({user:{id:user.id,name:user.name,role:user.role}});
 } catch { return NextResponse.json({error:'Solicitud inválida'}, {status:400}); }
}
export async function DELETE() {
 const {cookies} = await import('next/headers');
 (await cookies()).delete('mida_session');
 return NextResponse.json({ok:true});
}