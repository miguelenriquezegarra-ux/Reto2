import { Budget } from './budget.js';
import type { Config } from '../config.js';
// Operator-only verification configuration. Never selected by requests or model output.
export function configuredBudget(root:string,config:Config,liveCheck=process.env.LIVE_CHECK_MODE==='1'){
 return new Budget(root,config.SESSION_TOKEN_BUDGET,liveCheck?Math.min(config.GLOBAL_TOKEN_BUDGET,1000000):config.GLOBAL_TOKEN_BUDGET,liveCheck?40:undefined);
}
