export const validLessonId=(value:unknown):value is string=>typeof value==='string'&&/^c\d{2}-l\d{2}$/.test(value);
export function validNote(data:any){return data&&validLessonId(data.lessonId)&&typeof data.text==='string'&&data.text.length<=30000&&Number.isInteger(data.expectedRevision)&&data.expectedRevision>=0;}
export function validProgress(data:any){return data&&validLessonId(data.lessonId)&&['unread','read','practiced','verified'].includes(data.status)&&Array.isArray(data.checks)&&data.checks.length<=80&&data.checks.every((c:unknown)=>typeof c==='string'&&c.length<=1000);}
export function validateBackup(data:any){
 if(data?.version!==1||!Array.isArray(data.notes)||!Array.isArray(data.progress)||data.notes.length>500||data.progress.length>500)return false;
 return data.notes.every((n:any)=>validLessonId(n.lessonId)&&typeof n.text==='string'&&n.text.length<=30000)&&data.progress.every(validProgress);
}
