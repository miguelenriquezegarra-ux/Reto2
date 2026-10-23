import assert from 'node:assert/strict';
import type { Server } from 'node:http';
process.env.PORT='3102';process.env.OPENAI_API_KEY='';
const before=performance.now();
const {start}=await import(new URL('../dist/src/server.js',import.meta.url).href) as {start:()=>Promise<Server>};
const server=await start();
try{if(!server.listening)await new Promise<void>(resolve=>server.once('listening',resolve));const home=await fetch('http://127.0.0.1:3102/'),health=await fetch('http://127.0.0.1:3102/api/health');assert.equal(home.status,200);assert.equal(health.status,503);const startupMs=performance.now()-before;assert.ok(startupMs<120000);console.log(JSON.stringify({startupMs,frontendStatus:home.status,healthWithoutKey:health.status}));}finally{await new Promise<void>(resolve=>server.close(()=>resolve()));}
