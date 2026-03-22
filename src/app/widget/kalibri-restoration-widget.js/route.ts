import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const u = new URL(req.url);
  const origin = u.origin;

  const js = `/*!
 * Kalibri Restoration Widget Loader
 * Served from: ${origin}/widget/kalibri-restoration-widget.js
 * Injects an iframe that loads the widget UI from your app.
 */
(function () {
  try {
    var mountId = "kalibri-restoration-widget";
    var mount = document.getElementById(mountId);

    if (!mount) {
      mount = document.createElement("div");
      mount.id = mountId;
      document.body.appendChild(mount);
    }

    // Read key from:
    // 1) window.KALIBRI_WIDGET.key
    // 2) this script URL (?key=...)
    // 3) mount data-widget-key
    var currentScript = document.currentScript;
    var scriptSrc = currentScript && currentScript.src ? currentScript.src : "";
    var scriptUrl = scriptSrc ? new URL(scriptSrc, window.location.href) : null;

    var key =
      (window.KALIBRI_WIDGET && window.KALIBRI_WIDGET.key) ||
      (scriptUrl && scriptUrl.searchParams.get("key")) ||
      mount.getAttribute("data-widget-key") ||
      "";

    if (!key) {
      console.warn("[KalibriWidget] Missing widget key.");
    }

    var iframe = document.createElement("iframe");

    // IMPORTANT:
    // If your widget page lives at /widget/frame, keep /widget/frame below.
    // If your widget page actually lives at /widget, change this path.
    iframe.src = "${origin}/widget/frame?key=" + encodeURIComponent(key);

    iframe.title = "Kalibri Restoration Widget";
    iframe.style.width = "380px";
    iframe.style.height = "520px";
    iframe.style.border = "0";
    iframe.style.position = "fixed";
    iframe.style.right = "16px";
    iframe.style.bottom = "16px";
    iframe.style.zIndex = "2147483647";
    iframe.style.background = "transparent";
    iframe.style.borderRadius = "16px";
    iframe.style.boxShadow = "0 10px 30px rgba(0,0,0,0.18)";
    iframe.allow = "clipboard-write";

    mount.innerHTML = "";
    mount.appendChild(iframe);
  } catch (e) {
    console.error("[KalibriWidget] Failed to load", e);
  }
})();`;

  return new NextResponse(js, {
    status: 200,
    headers: {
      "content-type": "application/javascript; charset=utf-8",
      "cache-control": "public, max-age=60",
    },
  });
}