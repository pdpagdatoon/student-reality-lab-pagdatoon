import { UserControls } from './schema';

export function encodeControlsToUrl(controls: UserControls, destination?: string): string {
  const params = new URLSearchParams({
    b: String(controls.budget),
    t: String(controls.tripLength),
    l: String(controls.lodgingMode),
    ...(destination ? { d: destination } : {}),
  });
  return `${window.location.origin}${window.location.pathname}?${params.toString()}`;
}

export function decodeControlsFromUrl(): Partial<UserControls> & { destination?: string } {
  const params = new URLSearchParams(window.location.search);
  const result: Partial<UserControls> & { destination?: string } = {};
  
  const b = params.get('b');
  const t = params.get('t');
  const l = params.get('l');
  const d = params.get('d');
  
  if (b && Number(b) >= 100 && Number(b) <= 1000) result.budget = Number(b);
  if (t && Number(t) >= 1 && Number(t) <= 5) result.tripLength = Number(t);
  if (l && Number(l) >= 1 && Number(l) <= 4) result.lodgingMode = Number(l);
  if (d) result.destination = d;
  
  return result;
}
