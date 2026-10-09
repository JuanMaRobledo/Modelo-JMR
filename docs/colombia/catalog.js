// Selection, not an index. Identity and continued listing are checked on every fetch.
export const CATALOG = [
  {
    ticker: "ECOPETROL.CL",
    name: "Ecopetrol",
    model: "commodity",
    website: "https://www.ecopetrol.com.co/",
  },
  {
    ticker: "CELSIA.CL",
    name: "Celsia",
    model: "infrastructure",
    website: "https://www.celsia.com/",
  },
  {
    ticker: "ISA.CL",
    name: "ISA",
    model: "infrastructure",
    website: "https://www.isa.co/",
  },
  {
    ticker: "GEB.CL",
    name: "Grupo Energía Bogotá",
    model: "holding",
    website: "https://www.grupoenergiabogota.com/",
  },
  {
    ticker: "GRUPOSURA.CL",
    name: "Grupo SURA · ordinaria",
    model: "holding",
    website: "https://www.gruposura.com/",
  },
  {
    ticker: "PFGRUPSURA.CL",
    name: "Grupo SURA · preferencial",
    model: "holding",
    website: "https://www.gruposura.com/",
  },
  {
    ticker: "CEMARGOS.CL",
    name: "Cementos Argos · ordinaria",
    model: "operating",
    website: "https://argos.co/",
  },
  {
    ticker: "MINEROS.CL",
    name: "Mineros",
    model: "commodity",
    website: "https://mineros.com.co/",
  },
];
export const MODELS = {
  operating: "DCF de empresa (FCFF)",
  commodity: "DCF con ciclo y reservas",
  infrastructure: "DCF por activos y contratos",
  financial: "Patrimonio: FCFE / exceso de retornos",
  holding: "Suma de partes",
  unknown: "Pendiente de clasificar",
};
