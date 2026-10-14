import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { test } from "node:test";
import { parseHTML } from "linkedom";

const script = readFileSync(new URL("../docs/report-anchors.js", import.meta.url), "utf8");
function setup(markup) {
  const { window } = parseHTML(markup);
  const changes = [];
  window.requestAnimationFrame = fn => fn();
  window.history = { replaceState: (...args) => changes.push(args[2]) };
  runInNewContext(script, { window });
  return { window, changes };
}
function click(window, selector, root) {
  const anchor = window.document.querySelector(selector);
  const event = { target: anchor, prevented: false, preventDefault() { this.prevented = true; } };
  const handled = window.JmrReportAnchors.navigate(event, root);
  return { handled, event, anchor };
}

test("Ver cálculo reveals the collapsed matching table, not an off-report duplicate ID", () => {
  const { window, changes } = setup(`
    <div id="other"><h3 id="calculo-aapl-1"></h3></div>
    <div id="preview"><a id="jump" href="#calculo-aapl-1">Ver cálculo</a>
      <details id="level2"><summary>Cálculos</summary><h3 id="calculo-aapl-1"></h3></details></div>`);
  const root = window.document.getElementById("preview");
  const target = root.querySelector("h3");
  let scrolled = false;
  target.scrollIntoView = () => { scrolled = true; };
  const { handled, event } = click(window, "#jump", root);
  assert.equal(handled, true);
  assert.equal(event.prevented, true);
  assert.equal(root.querySelector("details").open, true);
  assert.equal(scrolled, true);
  assert.deepEqual(changes, ["#calculo-aapl-1"]);
});

test("Volver al artículo navigates out of an open calculations section", () => {
  const { window } = setup(`
    <section id="report"><h2 id="jmrArticleLevel">Artículo</h2>
    <details open><a id="back" href="#jmrArticleLevel">Volver al artículo</a></details></section>`);
  const report = window.document.getElementById("report");
  let scrolled = false;
  report.querySelector("h2").scrollIntoView = () => { scrolled = true; };
  const { handled } = click(window, "#back", report);
  assert.equal(handled, true);
  assert.equal(scrolled, true);
});

test("Missing calculation shows a transparent unavailable message, not a dead link", () => {
  const { window } = setup(`
    <div id="report"><a id="jump" href="#calculo-no-existe">Ver cálculo</a>
    <details><summary>Nivel 2</summary></details></div>`);
  const report = window.document.getElementById("report");
  const { handled, event, anchor } = click(window, "#jump", report);
  assert.equal(handled, true);
  assert.equal(event.prevented, true);
  assert.equal(anchor.hasAttribute("href"), false);
  assert.match(anchor.textContent, /no disponible/);
  assert.equal(report.querySelector("details").open, true);
});

test("Unrelated fragments are left to their original handler", () => {
  const { window } = setup('<div id="report"><a id="jump" href="#external">Otro enlace</a></div>');
  const { handled, event } = click(window, "#jump", window.document.getElementById("report"));
  assert.equal(handled, false);
  assert.equal(event.prevented, false);
});
