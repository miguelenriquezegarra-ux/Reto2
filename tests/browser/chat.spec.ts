import { test,expect } from '@playwright/test';
test('shows tools and requires complete human data before writing',async({page})=>{
 await page.goto('/');await page.getByLabel('Mensaje').fill('Procesa el buzon con fecha 2026-09-03');await page.getByRole('button',{name:'Enviar',exact:true}).click();
 await expect(page.getByRole('heading',{name:'Revisión humana'})).toBeVisible();await expect(page.getByRole('table')).toBeVisible();
 await page.getByRole('button',{name:'Confirmar datos revisados'}).click();await expect(page.getByLabel('fecha_inicio',{exact:true})).toBeVisible();
 await page.getByLabel('Mensaje').fill('confirmo el valor 0 y la fecha fin 2027-08-31');await page.getByRole('button',{name:'Enviar',exact:true}).click();
 await expect(page.getByText('Faltan datos precisos; confirmación parcial conservada.',{exact:false})).toBeVisible();await expect(page.getByLabel('fecha_inicio',{exact:true})).toHaveValue('');
 for(const [field,value] of Object.entries({fecha_inicio:'2026-08-01',fecha_fin:'2027-08-31',valor:'0',moneda:'COP',tipo_poliza:'',estado_poliza:'no_aplica'}))await page.getByLabel(field,{exact:true}).fill(value);
 await page.getByLabel('requiere_poliza',{exact:true}).selectOption('false');await page.getByRole('button',{name:'Confirmar datos revisados'}).click();
 await expect(page.getByRole('heading',{name:'Revisión humana'})).not.toBeVisible();await page.reload();await expect(page.getByText('contratos_registrar',{exact:true}).last()).toBeVisible();
});
