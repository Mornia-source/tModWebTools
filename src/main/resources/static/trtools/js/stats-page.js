(function () {
  "use strict";

  var canvas = document.getElementById("statsChart");
  var meta = document.getElementById("statsMeta");
  if (!canvas || typeof Chart === "undefined") return;

  var chart = null;

  function twtT(k, vars) {
    try {
      if (window.TWT_I18N && typeof window.TWT_I18N.t === "function") return window.TWT_I18N.t(k, vars);
    } catch (_) {}
    return k;
  }

  function accentRgb() {
    try {
      var s = getComputedStyle(document.documentElement).getPropertyValue("--twt-accent").trim();
      if (s) return s;
    } catch (_) {}
    return "59, 191, 122";
  }

  function surfaceLight() {
    try {
      var s = getComputedStyle(document.documentElement).getPropertyValue("--twt-surface-a").trim();
      if (s) return "rgba(" + s + ",.35)";
    } catch (_) {}
    return "rgba(186,242,201,.35)";
  }

  function metaLine(data) {
    return (
      twtT("stats.metaDay") +
      " " +
      (data.date || "") +
      " · " +
      twtT("stats.metaTz") +
      " " +
      (data.timezone || "")
    );
  }

  function datasetLabel() {
    return twtT("stats.dataset");
  }

  function render(data) {
    if (meta) meta.textContent = metaLine(data);
    var labels = data.labels || [];
    var visitors = data.visitors || [];
    var rgb = accentRgb();
    var fill = surfaceLight();
    if (chart) {
      chart.data.labels = labels;
      chart.data.datasets[0].data = visitors;
      chart.data.datasets[0].label = datasetLabel();
      chart.data.datasets[0].borderColor = "rgba(" + rgb + ",.95)";
      chart.data.datasets[0].backgroundColor = fill;
      chart.update("none");
      return;
    }
    chart = new Chart(canvas.getContext("2d"), {
      type: "line",
      data: {
        labels: labels,
        datasets: [
          {
            label: datasetLabel(),
            data: visitors,
            borderColor: "rgba(" + rgb + ",.95)",
            backgroundColor: fill,
            fill: true,
            tension: 0.25,
            pointRadius: 3,
            pointHoverRadius: 5,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        scales: {
          x: {
            ticks: { maxRotation: 45, minRotation: 0, font: { size: 10 } },
            grid: { color: "rgba(0,0,0,.06)" },
          },
          y: {
            beginAtZero: true,
            ticks: { precision: 0 },
            grid: { color: "rgba(0,0,0,.06)" },
          },
        },
        plugins: {
          legend: { display: true },
          tooltip: { enabled: true },
        },
      },
    });
  }

  async function load() {
    try {
      var r = await fetch("/trtools/stats/today", { cache: "no-store" });
      if (!r.ok) throw new Error("HTTP " + r.status);
      var data = await r.json();
      render(data);
    } catch (e) {
      if (meta) meta.textContent = twtT("stats.loadFail") + (e && e.message ? e.message : e);
    }
  }

  window.addEventListener("twt:i18n-applied", function () {
    try {
      if (chart && chart.data && chart.data.datasets && chart.data.datasets[0]) {
        chart.data.datasets[0].label = datasetLabel();
        chart.update("none");
      }
    } catch (_) {}
  });

  load();
  setInterval(load, 10000);
})();
