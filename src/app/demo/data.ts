// Product type definition (matches Supabase schema)
export interface Product {
  id: string;
  title: string;
  price: number;
  rating: number;
  reviews: number;
  category: string;
  keywords: string[];
}

// Filter rules for quality filtering
export const FILTER_RULES = {
  min_price: { value: 10.00, rule: 'Price > $10 (filter accessories)' },
  min_rating: { value: 3.0, rule: 'Rating >= 3.0 stars' },
  min_reviews: { value: 50, rule: 'At least 50 reviews' },
};

// Category mappings for smarter search
export const CATEGORY_KEYWORDS: Record<string, string[]> = {
  'water-bottle': ['water', 'bottle', 'hydration', 'drink', 'flask', 'tumbler'],
  'running-shoes': ['running', 'shoes', 'sneakers', 'athletic', 'jogging', 'marathon'],
  'wireless-earbuds': ['earbuds', 'headphones', 'wireless', 'bluetooth', 'audio', 'music', 'airpods'],
  'backpack': ['backpack', 'bag', 'pack', 'rucksack', 'daypack', 'laptop bag'],
  'yoga-mat': ['yoga', 'mat', 'exercise', 'fitness', 'pilates', 'stretching'],
  'tumbler': ['tumbler', 'mug', 'coffee', 'tea', 'travel mug', 'insulated cup'],
};
