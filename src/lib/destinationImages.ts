export const DESTINATION_PRIMARY_IMAGES: Record<string, string> = {
  'Atlantic City': 'images/destinations/atlantic-city.jpg',
  'Cape May': 'images/destinations/cape-may.jpg',
  'Wildwood': 'images/destinations/wildwood.jpg',
  'Seaside Heights': 'images/destinations/seaside-heights.jpg',
  'Asbury Park': 'images/destinations/asbury-park.jpg',
  'Long Beach Island': 'images/destinations/long-beach-island.jpg',
  'Ocean City NJ': 'images/destinations/ocean-city.jpg',
  'Sandy Hook': 'images/destinations/sandy-hook.jpg',
  'Princeton': 'images/destinations/princeton.jpg',
  'Delaware Water Gap': 'images/destinations/delaware-water-gap.jpg',
};

export const DESTINATION_BACKUP_IMAGES: Record<string, string> = {
  'Atlantic City': 'https://picsum.photos/seed/atlantic-city-beach/900/520',
  'Cape May': 'https://picsum.photos/seed/cape-may-shore/900/520',
  'Wildwood': 'https://picsum.photos/seed/wildwood-boardwalk/900/520',
  'Seaside Heights': 'https://picsum.photos/seed/seaside-heights-pier/900/520',
  'Asbury Park': 'https://picsum.photos/seed/asbury-park-coast/900/520',
  'Long Beach Island': 'https://picsum.photos/seed/long-beach-island/900/520',
  'Ocean City NJ': 'https://picsum.photos/seed/ocean-city-new-jersey/900/520',
  'Sandy Hook': 'https://picsum.photos/seed/sandy-hook-coastline/900/520',
  'Princeton': 'https://picsum.photos/seed/princeton-campus/900/520',
  'Delaware Water Gap': 'https://picsum.photos/seed/delaware-water-gap/900/520',
};

const withBase = (path: string) => {
  const base = import.meta.env.BASE_URL || '/';
  return `${base}${path.replace(/^\/+/, '')}`;
};

export const getDestinationPrimaryImage = (destination: string) =>
  withBase(DESTINATION_PRIMARY_IMAGES[destination] || 'images/destinations/default.jpg');

export const getDestinationBackupImage = (destination: string) =>
  DESTINATION_BACKUP_IMAGES[destination] || 'https://picsum.photos/seed/new-jersey-travel/900/520';
