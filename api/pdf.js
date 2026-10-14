import puppeteer from "puppeteer-core";
import { createSession, SESSION_NAME } from "../sso-session.js";

// @sparticuz/chromium v131 configura LD_LIBRARY_PATH en el momento
// en que se importa el módulo, no cuando se llama executablePath().
// Vercel puede no definir AWS_EXECUTION_ENV y entonces se omiten las
// bibliotecas NSS necesarias para iniciar /tmp/chromium.
// IMPORTANTE: preparar el entorno ANTES del import dinámico.
function configureChromiumRuntime() {
  const env = process.env.AWS_EXECUTION_ENV || "";
  const other = process.env.AWS_LAMBDA_JS_RUNTIME || "";
  const usesAl2023 = /(?:20|22)\.x/.test(env) || /(?:20|22)\.x/.test(other);
  if (!usesAl2023) {
    // Vercel ejecuta funciones Node modernas sobre un entorno Linux compatible
    // con el bundle AL2023 de Sparticuz. Este valor activa la extracción
    // de al2023.tar.br, sin alterar la versión real de Node.js.
    process.env.AWS_EXECUTION_ENV = "AWS_Lambda_nodejs22.x";
  }
  // Refuerzo: la carga de bibliotecas también debe usar el directorio que
  // Sparticuz extrae a /tmp; no basta con disponer del binario de Chromium.
  const libPath = "/tmp/al2023/lib";
  const paths = (process.env.LD_LIBRARY_PATH || "").split(":").filter(Boolean);
  if (!paths.includes(libPath)) {
    process.env.LD_LIBRARY_PATH = [libPath, ...paths].join(":");
  }
}

// Genera un PDF real (texto y vectores, no una captura de pantalla) de una
// valoración guardada (visor.html) o un análisis fundamental (research.html),
// abriendo la página correspondiente en un Chromium headless — el mismo
// motor que usaría un usuario, así que hereda automáticamente cualquier
// cambio visual futuro de esas páginas sin tener que duplicar su HTML acá.
//
// El sitio entero está protegido por una cookie firmada (ver proxy.js).
// Chromium recibe una sesión local para abrir la página que va a imprimir.
export default async function handler(req, res) {
  const pageName = req.query.page;
  if (pageName !== "visor" && pageName !== "research") {
    res.status(400).json({ error: 'El parámetro "page" debe ser "visor" o "research".' });
    return;
  }

  const session = createSession();
  if (!session) {
    res.status(503).json({ error: "El acceso privado todavía no está configurado." });
    return;
  }

  const params = new URLSearchParams({ pdfmode: "1" });
  if (pageName === "visor") {
    const path = req.query.path;
    if (!path) {
      res.status(400).json({ error: 'Falta "path" (la ruta de la valoración guardada en Modelo-JMR-datos).' });
      return;
    }
    params.set("path", path);
  } else {
    const id = req.query.id;
    if (!id) {
      res.status(400).json({ error: 'Falta "id" (el id del análisis guardado).' });
      return;
    }
    params.set("id", id);
  }

  const proto = req.headers["x-forwarded-proto"] || "https";
  const host = req.headers.host;
  const targetUrl = `${proto}://${host}/${pageName}.html?${params.toString()}`;

  let browser;
  try {
    configureChromiumRuntime();
    // La importación tardía es imprescindible: el módulo consulta las
    // variables del entorno al evaluarse por primera vez.
    const { default: chromium } = await import("@sparticuz/chromium");
    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: { width: 1240, height: 1600 },
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });

    const page = await browser.newPage();
    await page.setCookie({ name: SESSION_NAME, value: session, url: `${proto}://${host}/`, httpOnly: true, secure: true, sameSite: "Lax" });
    await page.goto(targetUrl, { waitUntil: "networkidle0", timeout: 25000 });
    // La página tarda un momento en traer los datos guardados desde GitHub
    // (fetch asíncrono) después de que la red queda "quieta" — esperar este
    // flag propio (seteado en pdfmode dentro de cada página) es más
    // confiable que un timeout fijo o que networkidle0 solo.
    await page.waitForFunction("window.__pdfReady === true", { timeout: 20000 });

    const pdfBuffer = await page.pdf({
      format: "a4",
      printBackground: true,
      margin: { top: "14mm", bottom: "14mm", left: "12mm", right: "12mm" },
    });

    const filename = `modelo-jmr-${pageName}-${Date.now()}.pdf`;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Cache-Control", "no-store");
    res.status(200).send(Buffer.from(pdfBuffer));
  } catch (err) {
    res.status(500).json({ error: err?.message || "Error generando el PDF." });
  } finally {
    if (browser) await browser.close();
  }
}
