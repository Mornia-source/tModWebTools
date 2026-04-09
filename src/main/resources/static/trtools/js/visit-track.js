(function () {
  "use strict";
  function ping() {
    fetch("/trtools/track", {
      method: "POST",
      credentials: "same-origin",
      keepalive: true,
    }).catch(function () {});
  }
  ping();
})();
