const truncateLabel = (label: string) => {
  const clean = label.trim();
  return clean.length > 22 ? clean.slice(0, 22) + '...' : clean;
};

export const getFallbackImageDataUrl = (label: string) => {
  const safeLabel = truncateLabel(label || 'New Jersey');
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='800' height='450' viewBox='0 0 800 450'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0%' stop-color='#0f766e'/><stop offset='100%' stop-color='#0e7490'/></linearGradient></defs><rect width='800' height='450' fill='url(#g)'/><rect x='24' y='24' width='752' height='402' rx='18' ry='18' fill='rgba(255,255,255,0.12)'/><text x='50%' y='48%' dominant-baseline='middle' text-anchor='middle' fill='#ffffff' font-family='Segoe UI, Arial, sans-serif' font-size='42' font-weight='700'>${safeLabel}</text><text x='50%' y='62%' dominant-baseline='middle' text-anchor='middle' fill='rgba(255,255,255,0.9)' font-family='Segoe UI, Arial, sans-serif' font-size='22'>New Jersey Travel</text></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};
