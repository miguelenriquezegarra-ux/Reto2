import type { Context } from './ports.js';
import { FileMailboxRepository } from '../infrastructure/mailbox-repository.js';
import { extract } from '../domain/extract.js';
export async function extractMessage(id:string,ctx:Context){const box=new FileMailboxRepository(ctx.directory);return extract((await box.document(await box.load(id))).text);}
