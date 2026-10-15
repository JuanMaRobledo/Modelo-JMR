#!/usr/bin/env node
// Fresh, isolated data execution. Shares the exact contract used by the app.
import { mkdir, writeFile, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { obtainColombia } from "../api/colombia.js";
import { csvFor } from "../docs/colombia/core.js";
const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const args = process.argv.slice(2);
if (args.length !== 3 || args[1] !== "--output") {
  console.error(
    "Uso: node scripts/colombia-datos.mjs ECOPETROL.CL --output /ruta/de/trabajo",
  );
  process.exit(2);
}
try {
  const dossier = await obtainColombia(args[0]);
  const folder = path.join(
    path.resolve(args[2]),
    "colombia",
    dossier.ticker,
    dossier.runId,
  );
  await mkdir(path.dirname(folder), { recursive: true });
  // A run cannot overwrite an earlier execution, including its own reports.
  await mkdir(folder);
  const identity = {
    market: "CO",
    ticker: dossier.ticker,
    company: dossier.company,
    analysis_date: dossier.analysisDate,
    run_id: dossier.runId,
    model: dossier.instrument.model,
  };
  await writeFile(
    path.join(folder, "expediente.json"),
    JSON.stringify(dossier, null, 2) + "\n",
  );
  await writeFile(path.join(folder, "observaciones.csv"), csvFor(dossier));
  for (const kind of ["research", "valuation"]) {
    const prompt = await readFile(
      path.join(root, `docs/prompts/colombia-${kind}-v1.md`),
      "utf8",
    );
    await writeFile(
      path.join(folder, `prompt-${kind}.md`),
      prompt +
        "\n\n## Identidad de esta ejecución\n" +
        JSON.stringify(identity, null, 2) +
        "\n",
    );
  }
  await writeFile(
    path.join(folder, "LEEME.md"),
    `# ${dossier.company} · ${dossier.ticker}\n\nEjecución ${dossier.runId}, consultada ${dossier.retrievedAt}.\n\nAdjunta expediente.json al prompt de research. Concilia documentos oficiales antes de calcular; luego usa el prompt de valoración. No se publica automáticamente.\n\n${dossier.audit.warnings.map((w) => "- " + w).join("\n")}\n`,
  );
  console.log(
    JSON.stringify(
      {
        folder,
        ticker: dossier.ticker,
        runId: dossier.runId,
        annualYears: dossier.coverage.annualYears,
        observations: dossier.observations.length,
        status: "data-obtained; primary-reconciliation-and-valuation-pending",
      },
      null,
      2,
    ),
  );
} catch (e) {
  console.error(e.message);
  process.exitCode = 1;
}
