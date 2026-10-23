import { resolve } from 'node:path';
import type { Clock,ConfirmationPolicy,Context } from './ports.js';
import { systemClock } from '../infrastructure/clock.js';
import { FileContractRepository } from '../infrastructure/contracts-repository.js';
import { Audit } from '../infrastructure/audit.js';
export interface Runtime {repo:FileContractRepository;clock:Clock;audit:Audit;policy:ConfirmationPolicy}
const repositories=new Map<string,FileContractRepository>();
const runtimes=new Map<string,Runtime>();
const key=(ctx:Context)=>`${resolve(ctx.directory)}:${ctx.sessionId}`;
export async function configureRuntime(ctx:Context,options:{clock?:Clock;mode?:'direct'|'conversation'}={}):Promise<Runtime>{
 const root=resolve(ctx.directory);let repo=repositories.get(root);if(!repo){repo=new FileContractRepository(root);await repo.initialize();repositories.set(root,repo);}
 const clock=options.clock??systemClock();const rt={repo,clock,audit:new Audit(root,clock),policy:{mode:options.mode??'direct',grants:new Map()} satisfies ConfirmationPolicy};runtimes.set(key(ctx),rt);return rt;
}
export async function runtime(ctx:Context):Promise<Runtime>{return runtimes.get(key(ctx))??configureRuntime(ctx);}
