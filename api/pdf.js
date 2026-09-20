import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";

// @sparticuz/chromium solo extrae las librerías del sistema que le faltan a
// su Chromium empaquetado (libnss3.so y demás) cuando detecta que corre
// dentro de AWS Lambda de verdad, mirando variables como AWS_EXECUTION_ENV.
// Las funciones de Vercel corren sobre esa misma infraestructura pero no
// definen esa variable, así que sin este parche la detección falla,
// Chromium arranca sin esas librerías y puppeteer explota con "Failed to
// launch the browser process: ... libnss3.so: cannot open shared object
// file". Fingir el valor (antes de pedirle el executablePath) hace que
// extraiga el paquete correcto para Node 20+ (Amazon Linux 2023).
if (!process.env.AWS_EXECUTION_ENV) {
  process.env.AWS_EXECUTION_ENV = "AWS_Lambda_nodejs20.x";
}

// Genera un PDF real (texto y vectores, no una captura de pantalla) de una
// valoración guardada (visor.html) o un análisis fundamental (research.html),
// abriendo la página correspondiente en un Chromium headless — el mismo
// motor que usaría un usuario, así que hereda automáticamente cualquier
// cambio visual futuro de esas páginas sin tener que duplicar su HTML acá.
//
// El sitio entero está protegido con Basic Auth (ver proxy.js), así que
// Chromium necesita autenticarse igual que un navegador real antes de poder
// cargar la página que va a imprimir.
export default async function handler(req, res) {
  const pageName = req.query.page;
  if (pageName !== "visor" && pageName !== "research") {
    res.status(400).json({ error: 'El parámetro "page" debe ser "visor" o "research".' });
    return;
  }

  const username = process.env.APP_USERNAME?.trim();
  const password = process.env.APP_PASSWORD;
  if (!username || !password) {
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
    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: { width: 1240, height: 1600 },
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });

    const page = await browser.newPage();
    await page.authenticate({ username, password });
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
