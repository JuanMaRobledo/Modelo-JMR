// Separación entre validación técnica y aprobación personal del propietario.
// Este módulo NO permite que una IA o el pase de CI aprueben un expediente.
// La aprobación debe constar explícitamente en el expediente y ser revisada
// en el historial de cambios. No es una firma criptográfica ni un endpoint de autorización.
const REVISOR = 'JuanMaRobledo';
const fechaValida = value => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value + 'T00:00:00Z');
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0,10) === value;
};

export function auditadaPorUsuario(expediente, controles) {
  const a = expediente?.auditoriaUsuario;
  return expediente?.fictional !== true
    && ['EN_REVISION','PUBLICADO'].includes(controles?.permitido)
    // Cada aprobación debe referirse a la huella de esta revisión del libro,
    // no a otra valoración ni a una declaración de identidad hecha por la IA.
    && /^[a-f0-9]{64}$/.test(expediente?.libro?.sha256 || '')
    && a?.revisionSha256 === expediente.libro.sha256
    && a?.resultado === 'APROBADA'
    && a?.aprobadaPor === REVISOR
    && fechaValida(a?.fecha)
    && typeof a?.evidencia === 'string'
    && a.evidencia.trim().length >= 12;
}

export function visorAuditoria(expediente, controles) {
  return auditadaPorUsuario(expediente, controles) ? 'auditadas' : 'pendientes';
}
