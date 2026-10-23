import { randomUUID } from 'node:crypto';
import type { ChatMessage } from '../llm/adapter.js';
import type { Extraction } from '../domain/schemas.js';
export interface CallView {id:string;name:string;args:unknown;resultSummary:string;ok:boolean}
export interface Pending {id:string;mensaje_id:string;candidate:Extraction;fields:string[];revision:string;turn:number}
export interface Session {id:string;turn:number;running:boolean;context:ChatMessage[];messages:{role:string;content:string;toolCalls?:CallView[]}[];pending:Pending[];status:string;alertDate?:string}
export class Sessions {
 private sessions=new Map<string,Session>();
 create():Session{const session:Session={id:randomUUID(),turn:0,running:false,context:[],messages:[],pending:[],status:'completed'};this.sessions.set(session.id,session);return session;}
 get(id:string){return this.sessions.get(id);}
}
