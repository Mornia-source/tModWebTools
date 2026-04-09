(function () {
  "use strict";
  var el = document.getElementById("onlineCount");
  if (!el) return;
  if (!/^https?:$/.test(location.protocol)) return;

  var sseUrl = new URL("./events", location.href).toString();
  var countUrl = new URL("./count", location.href).toString();

  function applyCount(msg) {
    if (typeof msg.count === "number") el.textContent = String(msg.count);
  }

  (async function () {
    var ok = false;
    try {
      var res = await fetch(countUrl, { cache: "no-store" });
      if (res.ok) {
        applyCount(await res.json());
        ok = true;
      }
    } catch (_) {}
    if (!ok) {
      el.textContent = "-";
      return;
    }
    var pollTimer = null;
    function poll() {
      fetch(countUrl, { cache: "no-store" })
        .then(function (r) {
          return r.ok ? r.json() : null;
        })
        .then(function (j) {
          if (j) applyCount(j);
        })
        .catch(function () {});
    }
    function startPolling() {
      if (pollTimer) return;
      pollTimer = setInterval(poll, 8000);
    }
    try {
      var es = new EventSource(sseUrl);
      es.onmessage = function (ev) {
        try {
          applyCount(JSON.parse(ev.data || "{}"));
        } catch (_) {}
      };
      es.onerror = function () {
        try {
          es.close();
        } catch (_) {}
        startPolling();
      };
    } catch (_) {
      startPolling();
    }
  })();
})();
