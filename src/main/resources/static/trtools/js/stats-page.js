(function () {
  "use strict";

  var canvas = document.getElementById("statsChart");
  var trendCanvas = document.getElementById("statsTrendChart");
  var meta = document.getElementById("statsMeta");
  var trendMeta = document.getElementById("statsTrendMeta");
  var daySelect = document.getElementById("statsDaySelect");
  var trendPeriodSelect = document.getElementById("statsTrendPeriodSelect");
  var rangeWeekBtn = document.getElementById("statsRangeWeek");
  var rangeMonthBtn = document.getElementById("statsRangeMonth");
  if (!canvas || typeof Chart === "undefined") return;

  var hourlyChart = null;
  var trendChart = null;
  var selectedDay = "";
  var selectedRange = "week";
  var selectedTrendPeriod = "";
  var availableWeeks = [];
  var availableMonths = [];

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

  function chartOptions() {
    return {
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
    };
  }

  function upsertLineChart(existing, targetCanvas, labels, visitors, label) {
    var rgb = accentRgb();
    var fill = surfaceLight();
    if (existing) {
      existing.data.labels = labels;
      existing.data.datasets[0].data = visitors;
      existing.data.datasets[0].label = label;
      existing.data.datasets[0].borderColor = "rgba(" + rgb + ",.95)";
      existing.data.datasets[0].backgroundColor = fill;
      existing.update("none");
      return existing;
    }
    return new Chart(targetCanvas.getContext("2d"), {
      type: "line",
      data: {
        labels: labels,
        datasets: [
          {
            label: label,
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
      options: chartOptions(),
    });
  }

  function metaLine(data) {
    var total = typeof data.dailyTotal === "number" ? data.dailyTotal : null;
    var line =
      twtT("stats.metaDay") +
      " " +
      (data.date || "") +
      " · " +
      twtT("stats.metaTz") +
      " " +
      (data.timezone || "");
    if (total !== null) {
      line += " · " + twtT("stats.metaDailyTotal", { n: total });
    }
    return line;
  }

  function trendMetaLine(data) {
    var rangeLabel = data.range === "month" ? twtT("stats.rangeMonth") : twtT("stats.rangeWeek");
    return (
      rangeLabel +
      " · " +
      (data.start || "") +
      " — " +
      (data.end || "") +
      " · " +
      twtT("stats.metaTz") +
      " " +
      (data.timezone || "")
    );
  }

  function periodLabel(item) {
    if (!item) return "";
    if (selectedRange === "month") {
      return twtT("stats.monthOption", { period: item.period || "" });
    }
    return twtT("stats.weekOption", {
      start: item.start || item.period || "",
      end: item.end || "",
    });
  }

  function currentPeriodList() {
    return selectedRange === "month" ? availableMonths : availableWeeks;
  }

  function populateDaySelect(dates) {
    if (!daySelect) return;
    var list = dates.slice();
    if (!list.length) {
      list.push(new Date().toISOString().slice(0, 10));
    }
    var prev = selectedDay || daySelect.value;
    daySelect.innerHTML = list
      .slice()
      .reverse()
      .map(function (d) {
        return '<option value="' + d + '">' + d + "</option>";
      })
      .join("");
    if (prev && list.indexOf(prev) >= 0) {
      daySelect.value = prev;
      selectedDay = prev;
    } else {
      selectedDay = daySelect.value;
    }
  }

  function populateTrendPeriodSelect() {
    if (!trendPeriodSelect) return;
    var list = currentPeriodList().slice();
    var prev = selectedTrendPeriod || trendPeriodSelect.value;
    if (!list.length) {
      trendPeriodSelect.innerHTML = "";
      selectedTrendPeriod = "";
      return;
    }
    trendPeriodSelect.innerHTML = list
      .map(function (item) {
        var val = item.period || "";
        return (
          '<option value="' +
          val +
          '">' +
          periodLabel(item) +
          "</option>"
        );
      })
      .join("");
    var hasPrev = list.some(function (item) {
      return (item.period || "") === prev;
    });
    if (hasPrev) {
      trendPeriodSelect.value = prev;
      selectedTrendPeriod = prev;
    } else {
      selectedTrendPeriod = list[0].period || "";
      trendPeriodSelect.value = selectedTrendPeriod;
    }
  }

  function renderHourly(data) {
    if (meta) meta.textContent = metaLine(data);
    hourlyChart = upsertLineChart(
      hourlyChart,
      canvas,
      data.labels || [],
      data.visitors || [],
      twtT("stats.dataset")
    );
  }

  function renderTrend(data) {
    if (trendMeta) trendMeta.textContent = trendMetaLine(data);
    if (data && data.period) {
      selectedTrendPeriod = data.period;
      if (trendPeriodSelect && trendPeriodSelect.value !== data.period) {
        trendPeriodSelect.value = data.period;
      }
    }
    if (!trendCanvas) return;
    trendChart = upsertLineChart(
      trendChart,
      trendCanvas,
      data.labels || [],
      data.visitors || [],
      twtT("stats.trendDataset")
    );
  }

  async function loadAvailablePeriods() {
    try {
      var r = await fetch("/trtools/stats/csv-info", { cache: "no-store" });
      if (!r.ok) return;
      var info = await r.json();
      populateDaySelect(info.availableDates || []);
      availableWeeks = Array.isArray(info.availableWeeks) ? info.availableWeeks : [];
      availableMonths = Array.isArray(info.availableMonths) ? info.availableMonths : [];
      populateTrendPeriodSelect();
    } catch (_) {}
  }

  async function loadHourly() {
    var date = selectedDay || (daySelect && daySelect.value) || "";
    var url = "/trtools/stats/day" + (date ? "?date=" + encodeURIComponent(date) : "");
    try {
      var r = await fetch(url, { cache: "no-store" });
      if (!r.ok) throw new Error("HTTP " + r.status);
      renderHourly(await r.json());
    } catch (e) {
      if (meta) meta.textContent = twtT("stats.loadFail") + (e && e.message ? e.message : e);
    }
  }

  async function loadTrend() {
    var url =
      "/trtools/stats/daily?range=" +
      encodeURIComponent(selectedRange) +
      (selectedTrendPeriod ? "&period=" + encodeURIComponent(selectedTrendPeriod) : "");
    try {
      var r = await fetch(url, { cache: "no-store" });
      if (!r.ok) throw new Error("HTTP " + r.status);
      renderTrend(await r.json());
    } catch (e) {
      if (trendMeta) trendMeta.textContent = twtT("stats.loadFail") + (e && e.message ? e.message : e);
    }
  }

  function setRange(range) {
    selectedRange = range === "month" ? "month" : "week";
    if (rangeWeekBtn) rangeWeekBtn.setAttribute("aria-pressed", selectedRange === "week" ? "true" : "false");
    if (rangeMonthBtn) rangeMonthBtn.setAttribute("aria-pressed", selectedRange === "month" ? "true" : "false");
    populateTrendPeriodSelect();
    loadTrend();
  }

  if (daySelect) {
    daySelect.addEventListener("change", function () {
      selectedDay = daySelect.value;
      loadHourly();
    });
  }
  if (trendPeriodSelect) {
    trendPeriodSelect.addEventListener("change", function () {
      selectedTrendPeriod = trendPeriodSelect.value;
      loadTrend();
    });
  }
  if (rangeWeekBtn) rangeWeekBtn.addEventListener("click", function () { setRange("week"); });
  if (rangeMonthBtn) rangeMonthBtn.addEventListener("click", function () { setRange("month"); });

  window.addEventListener("twt:i18n-applied", function () {
    try {
      populateTrendPeriodSelect();
      if (hourlyChart && hourlyChart.data && hourlyChart.data.datasets && hourlyChart.data.datasets[0]) {
        hourlyChart.data.datasets[0].label = twtT("stats.dataset");
        hourlyChart.update("none");
      }
      if (trendChart && trendChart.data && trendChart.data.datasets && trendChart.data.datasets[0]) {
        trendChart.data.datasets[0].label = twtT("stats.trendDataset");
        trendChart.update("none");
      }
    } catch (_) {}
  });

  loadAvailablePeriods().then(function () {
    loadHourly();
    loadTrend();
  });
  setInterval(function () {
    loadAvailablePeriods();
    loadHourly();
    loadTrend();
  }, 10000);
})();
