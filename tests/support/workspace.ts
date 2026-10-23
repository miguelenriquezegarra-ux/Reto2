import { mkdir,cp,rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { configureRuntime } from '../../src/application/runtime.js';
import { fixedClock } from '../../src/infrastructure/clock.js';
export async function workspace(){const directory=resolve('out/tests',randomUUID());await mkdir(directory,{recursive:true});await cp('fixtures',resolve(directory,'fixtures'),{recursive:true});await cp('agent',resolve(directory,'agent'),{recursive:true});await cp('src/knowledge',resolve(directory,'src/knowledge'),{recursive:true});const ctx={directory,sessionId:'test'};const rt=await configureRuntime(ctx,{clock:fixedClock()});return {ctx,rt,dispose:()=>rm(directory,{recursive:true,force:true})};}
