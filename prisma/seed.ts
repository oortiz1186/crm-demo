import { PrismaClient, Role } from '@prisma/client';
import { hash } from 'bcryptjs';
const db = new PrismaClient();
async function main() {
 const password = process.env.SEED_PASSWORD;
 if (!password || password.length < 12) throw new Error('Set SEED_PASSWORD (12+ chars) before seeding');
 const passwordHash = await hash(password, 12);
 const users: {email:string;name:string;role:Role}[] = [
 {email:'dulce@mida.local',name:'Dulce',role:'COORDINACION'},
 {email:'direccion@mida.local',name:'Dirección',role:'DIRECCION'},
 {email:'asesor@mida.local',name:'Asesor Demo',role:'ASESOR'}
 ];
 for (const u of users) await db.user.upsert({where:{email:u.email},update:{name:u.name,role:u.role},create:{...u,passwordHash}});
 console.log('Usuarios demo preparados. No se generaron clientes ni ventas ficticias.');
}
main().finally(()=>db.$disconnect());
