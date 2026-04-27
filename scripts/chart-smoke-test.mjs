import assert from 'node:assert/strict';
import {
  buildComparisonChartPayload,
  buildChartSummary,
  buildHotelComparisonChart,
  parsePriceRangeMidpoint,
} from '../api/chartTools.js';

const sampleCards = [
  { name: 'Hotel A', priceRange: '$89–$149' },
  { name: 'Hotel B', priceRange: '$65–$99' },
  { name: 'Hotel C', priceRange: '$120' },
];

const midpointChecks = [
  ['$89–$149', 119],
  ['$65–$99', 82],
  ['$120', 120],
  ['unknown', 0],
];

for (const [input, expected] of midpointChecks) {
  assert.equal(parsePriceRangeMidpoint(input), expected, `midpoint for ${input}`);
}

const barChart = buildComparisonChartPayload({
  chart_type: 'bar',
  title: 'Budget comparison',
  unit: '$',
  budget: 150,
  items: [
    { label: 'A', value: 120 },
    { label: 'B', value: 180 },
  ],
});

assert.equal(barChart.type, 'bar');
assert.equal(barChart.title, 'Budget comparison');
assert.equal(barChart.data.length, 2);
assert.equal(barChart.budget, 150);

const hotelChart = buildHotelComparisonChart(sampleCards, {
  chart_type: 'pie',
  title: 'Hotels',
  unit: '$',
});

assert.equal(hotelChart.type, 'pie');
assert.equal(hotelChart.data.length, 3);
assert.equal(hotelChart.data[0].label, 'Hotel A');
assert.equal(hotelChart.data[0].value, 119);

const summary = buildChartSummary(hotelChart);
assert.equal(summary.pointCount, 3);
assert.equal(summary.max, 120);
assert.equal(summary.total, 321);

console.log(JSON.stringify({ ok: true, summary }, null, 2));
