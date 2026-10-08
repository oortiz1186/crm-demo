export type Priority = 'VENCIDA' | 'HOY' | 'SEMANA' | 'PROGRAMADA' | 'SIN_FECHA';
export function classifyDueDate(value: Date | string | null | undefined, now = new Date()): Priority {
 if (!value) return 'SIN_FECHA';
 const date = new Date(value);
 if (Number.isNaN(date.getTime())) return 'SIN_FECHA';
 const today = new Date(now.getFullYear(),now.getMonth(),now.getDate());
 const tomorrow = new Date(today.getTime()+86400000);
 const week = new Date(today.getTime()+7*86400000);
 return date<today?'VENCIDA':date<tomorrow?'HOY':date<week?'SEMANA':'PROGRAMADA';
}
