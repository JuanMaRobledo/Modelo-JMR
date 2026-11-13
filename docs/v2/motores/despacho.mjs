// Despacho por perfil económico: un motor por perfil, nunca todos sobre la misma empresa.
import * as financieras from './financieras.mjs';
import * as sotp from './sotp.mjs';
import * as alto from './alto-crecimiento.mjs';
export const PERFILES_FINANCIEROS = ['banco', 'aseguradora'];
export const PERFIL_HOLDING = 'holding';
export const PERFIL_ALTO = 'alto-crecimiento';
/** fcff = {calculateAll, SCENARIOS, terminalSensitivity} del libro operativo (jmr-v2.html). */
export function crearMotor(fcff) {
  const soporta = p => p === 'operativa' ? !!fcff : PERFILES_FINANCIEROS.includes(p) || p === PERFIL_HOLDING || p === PERFIL_ALTO;
  const para = p => p === 'operativa' ? fcff : PERFILES_FINANCIEROS.includes(p) ? financieras : p === PERFIL_HOLDING ? sotp : p === PERFIL_ALTO ? alto : null;
  return {
    SCENARIOS: fcff?.SCENARIOS || financieras.SCENARIOS, soporta, para,
    calculateAll(model) {
      const m = para(model?.profile || 'operativa');
      return m ? m.calculateAll(model) : { status: 'INCOMPLETO', issues: [`Perfil «${model?.profile}» sin motor implementado.`], scenarios: {} };
    },
    sensibilidad(model, nombre = 'base') {
      if (model?.profile === PERFIL_HOLDING) return sotp.sensibilidad(model, nombre);
      if (model?.profile === PERFIL_ALTO) return alto.sensibilidad(model, nombre);
      return PERFILES_FINANCIEROS.includes(model?.profile) ? financieras.sensibilidad(model, nombre)
        : fcff.terminalSensitivity(model.financials, model.assumptions[nombre]);
    },
  };
}
