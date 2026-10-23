import type { Extraction, Message, Row } from '../domain/schemas.js';
export interface Clock { now():Date; today():string }
export interface MailboxRepository { list():Promise<Message[]>; load(id:string):Promise<Message>; document(message:Message):Promise<{text:string;filename:string}> }
export interface ContractRepository { rows():Promise<Row[]>; processed():Promise<Record<string,unknown>> }
export interface AuditSink { event(tool:string,id:string|null,ok:boolean,summary:string):Promise<void> }
export interface ConfirmationPolicy { mode:'direct'|'conversation'; grants:Map<string,{candidate:Extraction;revision:string}> }
export interface Context {directory:string;sessionId:string}
