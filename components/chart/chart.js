import "./chartjs.js";

(function () {
  'use strict';
  
  const chartInstances = new Map();
    function getThemeColors() {
      const style = getComputedStyle(document.documentElement);
      return {
        foreground: style.getPropertyValue("--foreground").trim() || "#000",
        background: style.getPropertyValue("--background").trim() || "#fff",
        mutedForeground:
          style.getPropertyValue("--muted-foreground").trim() || "#666",
        border: style.getPropertyValue("--border").trim() || "#ccc",
      };
    }

    function initChart(canvas) {
      if (!canvas || !canvas.id || !canvas.hasAttribute("data-tui-chart-id"))
        return;
      
      if (chartInstances.has(canvas.id)) {
        cleanupChart(canvas);
      }

      const dataId = canvas.getAttribute("data-tui-chart-id");
      const dataElement = document.getElementById(dataId);
      if (!dataElement) return;

      try {
        const chartConfig = JSON.parse(dataElement.textContent);
        const colors = getThemeColors();

        // eslint-disable-next-line no-undef
        Chart.defaults.elements.point.radius = 0;
        // eslint-disable-next-line no-undef
        Chart.defaults.elements.point.hoverRadius = 5;

        const isComplexChart = ["pie", "doughnut", "bar", "radar"].includes(
          chartConfig.type
        );

        const legendOptions = {
          display: chartConfig.showLegend || false,
          labels: { color: colors.foreground },
        };

        const tooltipOptions = {
          backgroundColor: colors.background,
          bodyColor: colors.mutedForeground,
          titleColor: colors.foreground,
          borderColor: colors.border,
          borderWidth: 1,
        };

        const scalesOptions =
          chartConfig.type === "radar"
            ? {
                r: {
                  grid: {
                    color: colors.border,
                    display: chartConfig.showYGrid !== false,
                  },
                  ticks: {
                    color: colors.mutedForeground,
                    backdropColor: "transparent",
                    display: chartConfig.showYLabels !== false,
                  },
                  angleLines: {
                    color: colors.border,
                    display: chartConfig.showXGrid !== false,
                  },
                  pointLabels: {
                    color: colors.foreground,
                    font: { size: 12 },
                  },
                  border: {
                    display: chartConfig.showYAxis !== false,
                    color: colors.border,
                  },
                  beginAtZero: true,
                },
              }
            : {
                x: {
                  beginAtZero: true,
                  display:
                    chartConfig.showXLabels !== false ||
                    chartConfig.showXGrid !== false ||
                    chartConfig.showXAxis !== false,
                  border: {
                    display: chartConfig.showXAxis !== false,
                    color: colors.border,
                  },
                  ticks: {
                    display: chartConfig.showXLabels !== false,
                    color: colors.mutedForeground,
                  },
                  grid: {
                    display: chartConfig.showXGrid !== false,
                    color: colors.border,
                  },
                  stacked: chartConfig.stacked || false,
                },
                y: {
                  offset: true,
                  beginAtZero: chartConfig.beginAtZero !== false,
                  min: chartConfig.yMin,
                  max: chartConfig.yMax,
                  display:
                    chartConfig.showYLabels !== false ||
                    chartConfig.showYGrid !== false ||
                    chartConfig.showYAxis !== false,
                  border: {
                    display: chartConfig.showYAxis !== false,
                    color: colors.border,
                  },
                  ticks: {
                    display: chartConfig.showYLabels !== false,
                    color: colors.mutedForeground,
                  },
                  grid: {
                    display: chartConfig.showYGrid !== false,
                    color: colors.border,
                  },
                  stacked: chartConfig.stacked || false,
                },
              };

        const finalChartConfig = {
          ...chartConfig,
          options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
              intersect: isComplexChart ? true : false,
              axis: "xy",
              mode: isComplexChart ? "nearest" : "index",
            },
            indexAxis: chartConfig.horizontal ? "y" : "x",
            plugins: {
              legend: legendOptions,
              tooltip: tooltipOptions,
            },
            scales: scalesOptions,
          },
        };

        // eslint-disable-next-line no-undef
        chartInstances.set(canvas.id, new Chart(canvas, finalChartConfig));
      } catch {}
    }

    function cleanupChart(canvas) {
      if (!canvas || !canvas.id || !chartInstances.has(canvas.id)) return;
      try {
        chartInstances.get(canvas.id).destroy();
      } finally {
        chartInstances.delete(canvas.id);
      }
    }

    function waitForChartAndInit() {
      if (typeof Chart !== "undefined") {
        document.querySelectorAll("canvas[data-tui-chart-id]").forEach(initChart);
        setupObservers();
      } else {
        setTimeout(waitForChartAndInit, 100);
      }
    }

    document.addEventListener("DOMContentLoaded", waitForChartAndInit);

    function setupObservers() {
      // Observe theme changes
      let themeTimeout;
      new MutationObserver(() => {
        clearTimeout(themeTimeout);
        themeTimeout = setTimeout(() => {
          document.querySelectorAll("canvas[data-tui-chart-id]").forEach((canvas) => {
            if (chartInstances.has(canvas.id)) {
              cleanupChart(canvas);
              initChart(canvas);
            }
          });
        }, 50);
      }).observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["class", "style"],
      });
      
      // Observe for new charts
      new MutationObserver(() => {
        document.querySelectorAll("canvas[data-tui-chart-id]").forEach((canvas) => {
          if (!chartInstances.has(canvas.id)) {
            initChart(canvas);
          }
        });
      }).observe(document.body, { childList: true, subtree: true });
    }
})();
