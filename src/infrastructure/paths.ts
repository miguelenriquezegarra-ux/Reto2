import { realpath,mkdir,lstat } from 'node:fs/promises';
import { resolve,relative,isAbsolute,dirname,sep } from 'node:path';
export function confined(root:string,path:string):string {
  const target=resolve(root,path),rel=relative(resolve(root),target);
  if(isAbsolute(path)||rel==='..'||rel.startsWith(`..${sep}`)||isAbsolute(rel)||path.includes('\0'))throw new Error('Ruta no autorizada');
  return target;
}
export async function safePath(root:string,path:string,createParents=false):Promise<string> {
  const base=await realpath(root),target=confined(base,path);
  let cursor=base;
  for(const part of relative(base,target).split(sep).filter(Boolean)) {
    cursor=resolve(cursor,part);
    try {const st=await lstat(cursor);if(st.isSymbolicLink())throw new Error('Enlace no autorizado');}
    catch(error){if((error as NodeJS.ErrnoException).code!=='ENOENT')throw error;}
  }
  if(createParents)await mkdir(dirname(target),{recursive:true});
  return target;
}
