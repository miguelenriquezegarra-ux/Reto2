export const failAt=(step:number)=>{let n=0;return ()=>{if(++n===step)throw new Error('Fallo inyectado');};};
