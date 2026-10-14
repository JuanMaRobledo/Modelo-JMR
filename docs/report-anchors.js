/* Internal links for valuation reports. Keep the target within its own report:
   previews, comparisons and Colombia can render identical source IDs. */
(function (win) {
  "use strict";
  function navigate(event, report) {
    var anchor = event.target && event.target.closest && event.target.closest('a[href^="#"]');
    if (!anchor || !report || !report.contains(anchor)) return false;
    var fragment = anchor.getAttribute("href").slice(1);
    var id;
    try { id = decodeURIComponent(fragment); } catch (e) { return false; }
    if (!id) return false;
    var target = Array.from(report.querySelectorAll("[id]")).find(function (node) {
      return node.id === id;
    });
    if (!target) {
      // Do not leave a dead "Ver cálculo" control in historical/partial reports.
      if (!/^ver c[aá]lculo\b/i.test(anchor.textContent.trim())) return false;
      event.preventDefault();
      var fallback = report.querySelector(".jmr-research-details, details");
      if (fallback) {
        fallback.open = true;
        if (typeof fallback.scrollIntoView === "function") {
          fallback.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }
      anchor.removeAttribute("href");
      anchor.textContent = "Cálculo específico no disponible en este informe";
      anchor.setAttribute("role", "status");
      return true;
    }
    event.preventDefault();
    // Native hash navigation is unreliable while <details> is still closed.
    var details = target.closest("details");
    while (details && report.contains(details)) {
      details.open = true;
      details = details.parentElement && details.parentElement.closest("details");
    }
    try {
      if (win.history && typeof win.history.replaceState === "function") {
        win.history.replaceState(null, "", "#" + encodeURIComponent(target.id));
      }
    } catch (e) { /* navigation still works without history access */ }
    var reveal = function () {
      if (typeof target.scrollIntoView === "function") {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    };
    if (typeof win.requestAnimationFrame === "function") win.requestAnimationFrame(reveal);
    else reveal();
    return true;
  }
  win.JmrReportAnchors = { navigate: navigate };
})(window);
