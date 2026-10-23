import { test,expect } from '@playwright/test';
test.skip(process.env.RUN_LIVE!=='1','Opt-in; nunca forma parte de la suite local');
test('public bundle and health are available',async({page,request})=>{
 const url=process.env.LIVE_URL;if(!url)throw new Error('Falta LIVE_URL');await page.goto(url);await expect(page.getByRole('heading',{name:'Registro de Contratos Vigentes',exact:true})).toBeVisible();expect((await request.get(new URL('/api/health',url).href)).ok()).toBe(true);
});
