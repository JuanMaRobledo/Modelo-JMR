// Carga el motor FCFF integrado en docs/jmr-v2.html para scripts y pruebas (una sola fuente de verdad).
import fs from 'node:fs';
import vm from 'node:vm';
export function cargarMotor(htmlUrl = new URL('../docs/jmr-v2.html', import.meta.url)) {
  const html = fs.readFileSync(htmlUrl, 'utf8');
  const s = html.indexOf('const JMR_DCF=(()=>{'), e = html.indexOf('const JMR_IND=(()=>{');
  if (s < 0 || e <= s) throw new Error('No se encontró el motor FCFF en jmr-v2.html');
  return vm.runInNewContext(html.slice(s, e) + '\nJMR_DCF;', {});
}

/** Indicadores del navegador (JMR_IND) para contrastarlos contra el libro de cálculo. */
export function cargarIndicadores(htmlUrl = new URL('../docs/jmr-v2.html', import.meta.url)) {
  const html = fs.readFileSync(htmlUrl, 'utf8');
  const s = html.indexOf('const JMR_IND=(()=>{'), e = html.indexOf('const {calculateAll, SCENARIOS');
  if (s < 0 || e <= s) throw new Error('No se encontró JMR_IND en jmr-v2.html');
  return vm.runInNewContext(html.slice(s, e) + '\nJMR_IND;', {});
}
