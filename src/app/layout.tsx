import type { Metadata } from 'next';
import './style.css';
export const metadata:Metadata={title:'MIDA CRM 360°',description:'Gestión comercial, renovaciones y oportunidades MIDA'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="es"><body>{children}</body></html>}