import { readFile,readdir } from 'node:fs/promises';
import { messageSchema,type Message } from '../domain/schemas.js';
import { safePath } from './paths.js';
import { documentKind } from '../domain/document-kind.js';
export class FileMailboxRepository {
 constructor(private root:string){}
 async load(id:string):Promise<Message>{if(!/^[\w-]+$/.test(id))throw new Error('Mensaje inválido');return messageSchema.parse(JSON.parse(await readFile(await safePath(this.root,`fixtures/reto-02/buzon/${id}/correo.json`),'utf8')));}
 async list():Promise<Message[]>{const names=await readdir(await safePath(this.root,'fixtures/reto-02/buzon'));const messages:Message[]=[];for(const name of names.sort())messages.push(await this.load(name));return messages;}
 async document(m:Message):Promise<{text:string;filename:string}>{
  let fallback={text:'',filename:''};
  for(const filename of m.adjuntos){if(!/^[\w.-]+\.txt$/i.test(filename))throw new Error('Adjunto no autorizado');const text=await readFile(await safePath(this.root,`fixtures/reto-02/buzon/${m.id}/${filename}`),'utf8');if(!fallback.filename)fallback={text,filename};if(documentKind(text)!=='rechazado')return {text,filename};}
  return fallback;
 }
}
