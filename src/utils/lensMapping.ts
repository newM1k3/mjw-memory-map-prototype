export const LENS_MAPPING: Record<string, string[]> = {
  'Food & Wine': [
    'food', 'plate', 'restaurant', 'wine', 'coffee', 'cup', 'meal', 'dish',
    'cuisine', 'cafe', 'bakery', 'pizza', 'sushi', 'menu', 'bread', 'dessert',
    'cake', 'fruit', 'vegetable', 'meat', 'seafood', 'ice cream', 'bar',
    'espresso', 'croissant', 'pasta', 'beer', 'cocktail',
  ],
  'Architecture': [
    'building', 'skyscraper', 'bridge', 'castle', 'church', 'cathedral',
    'tower', 'facade', 'arch', 'dome', 'palace', 'monument', 'temple',
    'mosque', 'ruins', 'column', 'staircase', 'window', 'gate', 'wall',
    'structure', 'architecture', 'historic', 'abbey', 'basilica',
  ],
  'Nature & Landscapes': [
    'tree', 'flower', 'mountain', 'lake', 'beach', 'forest', 'park',
    'garden', 'ocean', 'river', 'valley', 'waterfall', 'cliff', 'sunset',
    'sunrise', 'sky', 'cloud', 'field', 'hill', 'island', 'coast',
    'landscape', 'nature', 'wilderness', 'rock', 'sand', 'sea',
  ],
  'Street Life': [
    'street', 'market', 'crowd', 'traffic', 'sign', 'shop', 'pedestrian',
    'urban', 'alley', 'bicycle', 'bus', 'taxi', 'vendor', 'graffiti',
    'poster', 'storefront', 'neighborhood', 'bazaar', 'crosswalk',
  ],
  'Art & Culture': [
    'museum', 'painting', 'sculpture', 'art', 'gallery', 'theater',
    'statue', 'mural', 'performance', 'artwork', 'exhibition', 'canvas',
    'portrait', 'festival', 'ceremony', 'dance', 'music',
  ],
  'Adventure & Sports': [
    'hiking', 'skiing', 'surfing', 'climbing', 'boat', 'kayak', 'bike',
    'trail', 'sport', 'swimming', 'diving', 'cycling', 'running',
    'paragliding', 'rafting', 'camping',
  ],
};

export function discoverLens(tags: string[]): string {
  const scores: Record<string, number> = {};

  for (const [lens, keywords] of Object.entries(LENS_MAPPING)) {
    scores[lens] = 0;
    for (const tag of tags) {
      const lowerTag = tag.toLowerCase();
      for (const keyword of keywords) {
        if (lowerTag.includes(keyword) || keyword.includes(lowerTag)) {
          scores[lens]++;
        }
      }
    }
  }

  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  if (sorted[0][1] === 0) return 'Exploration';
  return sorted[0][0];
}
