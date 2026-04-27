export function parsePriceRangeMidpoint(priceRange) {
  const nums = String(priceRange || '').match(/\d+/g)?.map(Number) || [];
  if (nums.length >= 2) return Math.round((nums[0] + nums[1]) / 2);
  if (nums.length === 1) return nums[0];
  return 0;
}

export function buildComparisonChartPayload({ chart_type, title, items, unit = '$', budget }) {
  const normalizedItems = Array.isArray(items)
    ? items
        .map((item) => ({
          label: String(item?.label || ''),
          value: Number(item?.value || 0),
          color: item?.color ? String(item.color) : undefined,
        }))
        .filter((item) => item.label.length > 0)
    : [];

  const type = chart_type === 'pie' || chart_type === 'budget_gauge' ? chart_type : 'bar';
  const payload = {
    type,
    title: String(title || 'Comparison'),
    unit: String(unit || '$'),
    data: normalizedItems,
  };

  if (typeof budget === 'number' && Number.isFinite(budget)) {
    payload.budget = budget;
  }

  return payload;
}

export function buildChartSummary(chart) {
  const total = (chart?.data || []).reduce((sum, item) => sum + Number(item?.value || 0), 0);
  const max = Math.max(...(chart?.data || []).map((item) => Number(item?.value || 0)), 0);
  return {
    title: String(chart?.title || 'Comparison'),
    type: String(chart?.type || 'bar'),
    pointCount: Array.isArray(chart?.data) ? chart.data.length : 0,
    total,
    max,
    budget: typeof chart?.budget === 'number' ? chart.budget : null,
  };
}

export function buildHotelComparisonChart(cards, options = {}) {
  const title = options.title || 'Hotel nightly price comparison';
  const unit = options.unit || '$';
  const chartType = options.chart_type || 'bar';
  const budget = typeof options.budget === 'number' ? options.budget : undefined;
  const items = (Array.isArray(cards) ? cards : []).slice(0, 8).map((card) => ({
    label: card?.name || 'Hotel',
    value: parsePriceRangeMidpoint(card?.priceRange),
  }));

  return buildComparisonChartPayload({ chart_type: chartType, title, items, unit, budget });
}
