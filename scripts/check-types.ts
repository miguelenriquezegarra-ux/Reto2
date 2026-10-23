import ts from 'typescript';
import { readdir, readFile } from 'node:fs/promises';
async function check(dir:string):Promise<void> {
  for(const entry of await readdir(dir,{withFileTypes:true})) {
    const path=`${dir}/${entry.name}`;
    if(entry.isDirectory()) await check(path);
    else if(path.endsWith('.ts')) {
      const ast=ts.createSourceFile(path,await readFile(path,'utf8'),ts.ScriptTarget.Latest,true);
      const visit=(node:ts.Node):void=>{if(node.kind===ts.SyntaxKind.AnyKeyword) throw new Error(`Explicit any: ${path}`); ts.forEachChild(node,visit);};
      visit(ast);
    }
  }
}
for(const dir of ['src','web','tests','scripts']) {try {await check(dir);}catch(error){if((error as NodeJS.ErrnoException).code!=='ENOENT')throw error;}}
