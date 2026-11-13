// Despacho por perfil económico: un motor por perfil, nunca todos sobre la misma empresa.
import * as financieras from './financieras.mjs';
export const PERFILES_FINANCIEROS = ['banco', 'aseguradora'];
/** fcff = {calculateAll, SCENARIOS, terminalSensitivity} del libro operativo (jmr-v2.html). */
export function crearMotor(fcff) {
  const soporta = p => p === 'operativa' ? !!fcff : PERFILES_FINANCIEROS.includes(p);
  const para = p => p === 'operativa' ? fcff : PERFILES_FINANCIEROS.includes(p) ? financieras : null;
  return {
    SCENARIOS: fcff?.SCENARIOS || financieras.SCENARIOS, soporta, para,
    calculateAll(model) {
      const m = para(model?.profile || 'operativa');
      return m ? m.calculateAll(model) : { status: 'INCOMPLETO', issues: [`Perfil «${model?.profile}» sin motor implementado.`], scenarios: {} };
    },
    sensibilidad(model, nombre = 'base') {
      return PERFILES_FINANCIEROS.includes(model?.profile) ? financieras.sensibilidad(model, nombre)
        : fcff.terminalSensitivity(model.financials, model.assumptions[nombre]);
    },
  };
}
