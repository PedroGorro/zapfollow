// src/utils/chartCenterText.js
// Uso: registrar no chart e passar { centerText: "Sem dados"} como plugin option
export const CenterTextPlugin = {
  id: "centerText",
  afterDraw(chart, args, pluginOptions) {
    const { ctx, chartArea } = chart;
    const text = pluginOptions?.text;
    if (!text) return;

    const datasets = chart.config.data?.datasets || [];
    const hasData = datasets.some((ds) =>
      (ds.data || []).some((v) => (typeof v === "number" ? v > 0 : !!v))
    );
    if (hasData) return;

    const { left, right, top, bottom } = chartArea;
    const x = (left + right) / 2;
    const y = (top + bottom) / 2;

    ctx.save();
    ctx.font = "500 14px system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
    ctx.fillStyle = "#6B7280"; // gray-500
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, x, y);
    ctx.restore();
  },
};
