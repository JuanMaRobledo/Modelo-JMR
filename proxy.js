import { next } from "@vercel/functions";
import { validSession } from "./sso-session.js";

export default function proxy(request) {
  const url = new URL(request.url);
  if (url.pathname === "/api/sso") return next();
  if (!process.env.APP_PASSWORD) return new Response("El acceso privado todavía no está configurado.", { status: 503, headers: { "Cache-Control": "no-store" } });
  if (validSession(request.headers.get("cookie"))) {
    // La pantalla heredada de GitHub Pages detecta esta marca. El servidor
    // valida siempre la cookie firmada antes de entregar cada recurso.
    return next({ headers: { "Cache-Control": "private, no-store", "Set-Cookie": "jmr-server-auth=1; Path=/; Secure; SameSite=Lax; Max-Age=2592000" } });
  }
  if (!request.headers.get("accept")?.includes("text/html")) return new Response("No autorizado", { status: 401, headers: { "Cache-Control": "no-store" } });
  const destination = new URL("https://cartera-two-eta.vercel.app/api/sso/start");
  destination.searchParams.set("app", "modelo");
  destination.searchParams.set("path", url.pathname + url.search);
  // Solo la rama de revisión autorizada solicita volver a su Preview.
  // El Centro Financiero valida el origen contra una lista exacta;
  // producción y los demás hosts mantienen el flujo de acceso anterior.
  const previewOrigin = "https://modelo-jmr-git-fix-sync-sheet-ta-0c6a24-juanmarobledos-projects.vercel.app";
  if (url.origin === previewOrigin) destination.searchParams.set("target", previewOrigin);
  return Response.redirect(destination, 303);
}
