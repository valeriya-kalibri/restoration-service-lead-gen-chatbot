import { NextResponse } from "next/server";

export const runtime = "nodejs"; // safest for Next route handlers on Vercel

export async function GET(req: Request) {
    const u = new URL(req.url);
    const origin = u.origin;

    // Plain JS string (no JSX). Keep it ASCII-clean.
    const js = `/*!
 * Kalibri Restoration Widget Loader
 * Served from: ${origin}/widget/kalibri-restoration-widget-js
 * Injects an iframe that loads the widget UI from your app.
 */
(function () {
  try {
    // Find (or create) mount element
    var mountId = "kalibri-restoration-widget";
    var mount = document.getElementById(mountId);
    if (!mount) {
      mount = document.createElement("div");
      mount.id = mountId;
      document.body.appendChild(mount);
    }

    // Read widget key (prefer explicit)
    var key =
      (window.KALIBRI_WIDGET && window.KALIBRI_WIDGET.key) ||
      mount.getAttribute("data-widget-key") ||
      "";

    if (!key) {
      console.warn("[KalibriWidget] Missing widget key. Set window.KALIBRI_WIDGET = { key: '...' }");
    }

    // Create iframe
    var iframe = document.createElement("iframe");
    iframe.src = "${origin}/widget?key=" + encodeURIComponent(key);
    iframe.title = "Kalibri Restoration Widget";
    iframe.style.width = "380px";
    iframe.style.height = "520px";
    iframe.style.border = "0";
    iframe.style.position = "fixed";
    iframe.style.right = "16px";
    iframe.style.bottom = "16px";
    iframe.style.zIndex = "2147483647";
    iframe.style.borderRadius = "16px";
    iframe.style.boxShadow = "0 10px 30px rgba(0,0,0,0.18)";
    iframe.allow = "clipboard-write;";

    // Replace mount contents
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
            // You can loosen/tighten this later; fine for now
            "cache-control": "public, max-age=60",
        },
    });
}

