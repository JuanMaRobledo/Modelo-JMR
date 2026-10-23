#!/usr/bin/env node
/**
 * JMR · matrices DCF económicas adicionales (calculadas, nunca interpoladas).
 * Input: snapshot JSON {ticker, revision, dcfBase, inputs} que corresponde a
 * una única copia vigente de la hoja "Input sheet" y del modelo Base.
 * Usage: node scripts/generate_dcf_sensitivities.cjs snapshot.json > resultado.json
 * No escribe ni altera ninguna hoja, resultado oficial o artículo.
 */
'use strict';
const fs=require('node:fs');
const {runDCFDetalle}=require('../docs/jmr_engine.js');

const FIN=Number.isFinite;
const OFF=[-2,-1,0,1,2];
function same(a,b){return FIN(a)&&FIN(b)&&Math.abs(a-b)<=Math.max(.05,Math.abs(b)*.0001);}
function calculate(input,changes){
  const p=JSON.parse(JSON.stringify(input));
  const ch=changes||{};
  let growth=p.growthBase, first=p.growthY1Base, margin=p.marginBase;
  if(Object.prototype.hasOwnProperty.call(ch,'waccInitial'))p.wacc=ch.waccInitial;
  if(Object.prototype.hasOwnProperty.call(ch,'waccTerminal'))p.terminalWacc=ch.waccTerminal;
  if(Object.prototype.hasOwnProperty.call(ch,'roicTerminal'))p.roicTerminal=ch.roicTerminal;
  if(Object.prototype.hasOwnProperty.call(ch,'salesToCapital'))p.salesToCapital=ch.salesToCapital;
  if(Object.prototype.hasOwnProperty.call(ch,'taxMarginal'))p.taxMarginal=ch.taxMarginal;
  if(Object.prototype.hasOwnProperty.call(ch,'marginTarget'))margin=ch.marginTarget;
  if(Object.prototype.hasOwnProperty.call(ch,'growthDelta')){
    growth+=ch.growthDelta;
    if(FIN(first))first+=ch.growthDelta;
    if(Array.isArray(p.crecimientoAnios)){
      p.crecimientoAnios=p.crecimientoAnios.map((value,index)=>index<5&&FIN(value)?value+ch.growthDelta:value);
    }
  }
  const waccTerminal=p.terminalWacc,terminalGrowth=p.terminalGrowth;
  const roic=p.roicTerminal>0?p.roicTerminal:waccTerminal;
  if(![p.revenue0,p.ebit0,p.wacc,p.terminalWacc,p.terminalGrowth,p.taxMarginal,
      p.salesToCapital,p.shares0,growth,margin].every(FIN) ||
     !(p.shares0>0&&p.salesToCapital>0&&waccTerminal>terminalGrowth+.00001&&roic>terminalGrowth+.00001&&
       p.wacc>0&&p.taxMarginal>=0&&p.taxMarginal<1&&margin>0&&margin<1&&growth>-.5))return null;
  const result=runDCFDetalle(p,growth,margin,first,p.marginY1Base);
  const n=result&&result.valuePerShare;
  return FIN(n)?n:null;
}
const specs=[
 {id:'wacc-inicial-crecimiento',title:'WACC inicial × crecimiento de ventas FY+1 a FY+5',
  row:{key:'waccInitial',name:'WACC inicial',delta:.005,base:p=>p.wacc,unit:'percent'},
  col:{key:'growthDelta',name:'Variación en crecimiento FY+1 a FY+5',delta:.01,base:()=>0,unit:'changepp'}},
 {id:'sales-capital-margen',title:'Sales-to-Capital × margen EBIT objetivo',
  row:{key:'salesToCapital',name:'Sales-to-Capital inicial',factor:.10,base:p=>p.salesToCapital,unit:'times'},
  col:{key:'marginTarget',name:'Margen EBIT objetivo',delta:.015,base:p=>p.marginBase,unit:'percent'}},
 {id:'roic-wacc-terminal',title:'ROIC terminal × WACC terminal',
  row:{key:'roicTerminal',name:'ROIC terminal del capital nuevo',factor:.10,base:p=>p.roicTerminal,unit:'percent'},
  col:{key:'waccTerminal',name:'WACC terminal',delta:.005,base:p=>p.terminalWacc,unit:'percent'}},
 {id:'impuestos-capital',title:'Impuesto marginal × Sales-to-Capital',
  row:{key:'taxMarginal',name:'Impuesto marginal terminal',delta:.015,base:p=>p.taxMarginal,unit:'percent'},
  col:{key:'salesToCapital',name:'Sales-to-Capital inicial',factor:.10,base:p=>p.salesToCapital,unit:'times'}}
];
function values(axis,p){const b=axis.base(p);if(!FIN(b))throw Error('Supuesto obligatorio ausente: '+axis.name);
 return OFF.map(o=>axis.factor?b*(1+o*axis.factor):b+o*axis.delta);
}
function build(snapshot){
  if(!snapshot||typeof snapshot!=='object')throw Error('Falta snapshot');
  const {inputs,ticker,revision,dcfBase}=snapshot;
  if(!ticker||!revision||!inputs||!FIN(dcfBase))throw Error('Se requieren ticker, revision, dcfBase y inputs Base verificados');
  if(inputs.dcfFinanciero)throw Error('Para FCFE bancario se requiere generador específico: no usar FCFF');
  const recalculated=calculate(inputs,{});
  if(!same(recalculated,dcfBase))throw Error('DCF Base no concilia con snapshot oficial: calculado '+recalculated+' vs '+dcfBase);
  const matrices=specs.map(spec=>{
    const xValues=values(spec.col,inputs),yValues=values(spec.row,inputs);
    const cells=yValues.map((y,iy)=>xValues.map((x,ix)=>{
      const ch={[spec.row.key]:y,[spec.col.key]:x};
      return calculate(inputs,ch);
    }));
    const center=cells[2][2],allValid=cells.every(row=>row.every(FIN));
    if(!same(center,dcfBase)||!allValid)throw Error('Matriz '+spec.id+': celda faltante o centro no conciliado');
    return {id:spec.id,title:spec.title,rows:{label:spec.row.name,unit:spec.row.unit,values:yValues},
      cols:{label:spec.col.name,unit:spec.col.unit,values:xValues},
      values:cells,center,validated:true};
  });
  return {ticker,revision,dcfBaseOfficial:dcfBase,dcfBaseRecalculated:recalculated,
    method:'FCFF 10 años + valor terminal; recálculo completo con runDCFDetalle del mismo modelo JMR',
    note:'Los cambios son variaciones aisladas del escenario Base y no modifican el registro oficial. No sumarlos como efectos independientes.',
    matrices};
}
module.exports={build,calculate,specs};
if(require.main===module){
  try{
    if(!process.argv[2])throw Error('Uso: node scripts/generate_dcf_sensitivities.cjs snapshot.json');
    const snapshot=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));
    process.stdout.write(JSON.stringify({sensibilidadDCF:build(snapshot)},null,2)+'\n');
  }catch(e){process.stderr.write('ERROR: '+e.message+'\n');process.exitCode=1;}
}
