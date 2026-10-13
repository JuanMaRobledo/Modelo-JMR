const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const c={};vm.createContext(c);vm.runInContext(fs.readFileSync(path.join(__dirname,'../docs/jmr_engine.js'),'utf8'),c);
const base={revenue0:1000,ebit0:200,taxEffective:.25,taxMarginal:.25,wacc:.10,terminalWacc:.09,
 terminalGrowth:.03,convergenceYear:5,salesToCapital:2,salesToCapital2:2,roicTerminal:0,
 reinvestLag:1,shares0:100,debt:0,cash:0,investedCapital0:800};
const run=i=>c.runDCFDetalle(i,.08,.20,.08,.20);
const d=run(base),v=d.valorCrecimiento;

// Activos actuales = NOPAT del año base / WACC terminal; crecimiento = resto del valor operativo.
assert.ok(Math.abs(v.activosActuales-150/.09)<1e-9);
assert.ok(Math.abs(v.activosActuales+v.valorCrecimiento-d.sumPV)<1e-9);
assert.ok(Math.abs(v.pctCrecimiento-v.valorCrecimiento/d.sumPV)<1e-12);

// Informativo: el valor por acción no depende de que se calcule el bloque ni del capital invertido.
assert.equal(run({...base,investedCapital0:undefined}).valuePerShare,d.valuePerShare);
assert.equal(run({...base,investedCapital0:undefined}).valorCrecimiento.roic,undefined);

// ROIC del año n = NOPAT_n / capital invertido al cierre del año anterior (fila ROIC de 'Valuation output').
let ic=base.investedCapital0,ws=0,rs=0;
for(let n=1;n<=10;n++){assert.ok(Math.abs(v.roic[n]-d.ebit1t[n]/ic)<1e-12);ic+=d.reinvestment[n];rs+=v.roic[n];ws+=d.wacc[n];}
assert.ok(Math.abs(v.spreadRoicWacc-(rs-ws)/10)<1e-12);
// ROIC terminal por defecto = costo de capital terminal: sin exceso de retorno en perpetuidad.
assert.ok(Math.abs(v.spreadTerminal)<1e-12);
assert.ok(Math.abs(run({...base,roicTerminal:.15}).valorCrecimiento.spreadTerminal-(.15-.09))<1e-12);

// Tasa de reinversión de los años 1-5 = reinversión acumulada / NOPAT acumulado.
let nop=0,re=0;for(let n=1;n<=5;n++){nop+=d.ebit1t[n];re+=d.reinvestment[n];}
assert.ok(Math.abs(v.tasaReinversion1a5-re/nop)<1e-12);

// Sin utilidad operativa actual no hay activos actuales que valorar (todo el valor es crecimiento).
const perdida=run({...base,ebit0:-50});
assert.equal(perdida.valorCrecimiento.activosActuales,0);
assert.ok(Math.abs(perdida.valorCrecimiento.valorCrecimiento-perdida.sumPV)<1e-9);

// El NOPAT del año base de la hoja ('Valuation output'!B9) tiene prioridad cuando existe.
assert.ok(Math.abs(run({...base,nopatBase:120}).valorCrecimiento.activosActuales-120/.09)<1e-9);

// Interruptor de capital: lee B120; B78 solo cuenta si es el texto antiguo Yes (hojas anteriores al 12-oct-2026).
const hoja=(IS)=>c.insumosDesdeHoja((h,a)=>h==='Input sheet'?IS[a]:null);
assert.equal(hoja({B120:'Yes',B78:12.5}).smoothTerminalCapital,true);
assert.equal(hoja({B120:'No',B78:'Yes'}).smoothTerminalCapital,true);   // compatibilidad con hojas viejas
assert.equal(hoja({B120:'No',B78:12.5}).smoothTerminalCapital,false);   // B78 numérico = solapamiento de arrendamientos
assert.equal(hoja({B78:0}).smoothTerminalCapital,false);
console.log('PASS valor del crecimiento: activos actuales, ROIC-WACC, reinversión y lectura del interruptor B120/B78');
