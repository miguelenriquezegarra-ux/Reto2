export const documentKind=(text:string):'contrato'|'otrosi'|'rechazado'=>{
 if(/^\s*OTROS[IÍ]/i.test(text)&&/CONTRATO/i.test(text))return 'otrosi';
 if(/^\s*CONTRATO/i.test(text)&&/OBJETO/i.test(text)&&/CONTRATANTE/i.test(text))return 'contrato';
 return 'rechazado';
};
