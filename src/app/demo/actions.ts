'use server';

import { GlassBox } from '@/lib/glassbox';
import { supabase } from '@/lib/supabase';
import { Product, FILTER_RULES, CATEGORY_KEYWORDS } from './data';

// Fetch products from Supabase that match the search keywords
async function fetchProductsInternal(keywords: string[]): Promise<Product[]> {
  // Build a smart query that searches both keywords array and title
  const searchTerms = keywords.flatMap(k => k.toLowerCase().split(' '));
  
  // First, try to identify the category from keywords
  let matchedCategory: string | null = null;
  for (const [category, categoryKeywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (searchTerms.some(term => categoryKeywords.some(ck => ck.includes(term) || term.includes(ck)))) {
      matchedCategory = category;
      break;
    }
  }

  let query = supabase.from('products').select('id, title, price, rating, reviews, category, keywords');
  
  // If we identified a category, filter by it for more relevant results
  if (matchedCategory) {
    query = query.eq('category', matchedCategory);
  }

  const { data, error } = await query;
  
  if (error) {
    return [];
  }

  // Further filter by keyword matching in title or keywords array
  const filteredProducts = (data || []).filter((product: Product) => {
    return searchTerms.some(term => 
      product.keywords.some(kw => kw.includes(term) || term.includes(kw)) ||
      product.title.toLowerCase().includes(term)
    );
  });

  return filteredProducts;
}

// Helper to compute filter evaluations
function computeFilterEvaluations(candidates: Product[]) {
  const evaluations: any[] = [];

  candidates.forEach(item => {
    const filterResults = {
      min_price: {
        passed: item.price > FILTER_RULES.min_price.value,
        detail: item.price > FILTER_RULES.min_price.value
          ? `$${item.price.toFixed(2)} > $${FILTER_RULES.min_price.value.toFixed(2)}`
          : `$${item.price.toFixed(2)} ≤ $${FILTER_RULES.min_price.value.toFixed(2)}`,
      },
      min_rating: {
        passed: item.rating >= FILTER_RULES.min_rating.value,
        detail: item.rating >= FILTER_RULES.min_rating.value
          ? `${item.rating}★ >= ${FILTER_RULES.min_rating.value}★`
          : `${item.rating}★ < ${FILTER_RULES.min_rating.value}★`,
      },
      min_reviews: {
        passed: item.reviews >= FILTER_RULES.min_reviews.value,
        detail: item.reviews >= FILTER_RULES.min_reviews.value
          ? `${item.reviews} >= ${FILTER_RULES.min_reviews.value}`
          : `${item.reviews} < ${FILTER_RULES.min_reviews.value}`,
      },
    };

    const allPassed = Object.values(filterResults).every(f => f.passed);
    const failedFilters = Object.entries(filterResults).filter(([_, v]) => !v.passed).map(([k]) => k);

    let rejectionReason = null;
    if (!allPassed) {
      const reasons: string[] = [];
      if (!filterResults.min_price.passed) reasons.push(`Price $${item.price.toFixed(2)} is below $${FILTER_RULES.min_price.value.toFixed(2)} — likely an accessory.`);
      if (!filterResults.min_rating.passed) reasons.push(`Rating ${item.rating}★ below ${FILTER_RULES.min_rating.value}★ threshold.`);
      if (!filterResults.min_reviews.passed) reasons.push(`Only ${item.reviews} reviews (need ${FILTER_RULES.min_reviews.value}+).`);
      rejectionReason = reasons.join(' ');
    }

    evaluations.push({
      id: item.id,
      title: item.title,
      metrics: { price: item.price, rating: item.rating, reviews: item.reviews },
      filter_results: filterResults,
      qualified: allPassed,
      failed_filters: failedFilters,
      rejection_reason: rejectionReason,
    });
  });

  return {
    filters_applied: FILTER_RULES,
    total_evaluated: evaluations.length,
    passed_count: evaluations.filter(e => e.qualified).length,
    failed_count: evaluations.filter(e => !e.qualified).length,
    evaluations: evaluations,
  };
}

// Exported for browsing
export async function fetchProducts(keywords: string[]): Promise<Product[]> {
  return fetchProductsInternal(keywords);
}

// Fetch all products (for browsing)
export async function fetchAllProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('id, title, price, rating, reviews, category, keywords')
    .order('category', { ascending: true })
    .limit(100);
  
  if (error) {
    return [];
  }
  
  return data || [];
}

// Initialize execution
export async function initExecution(productName: string) {
  const xray = new GlassBox(`Competitor Analysis: ${productName}`);
  const executionId = await xray.start({ user_intent: 'find_benchmark_product' });
  return executionId;
}

// Log keyword generation step with LLM duration passed from client
export async function logKeywordStep(executionId: string, productName: string, keywords: string[], llmDurationMs?: number) {
  const xray = new GlassBox('');
  (xray as any).executionId = executionId;
  (xray as any).stepCount = 0;
  
  await xray.step('keyword_generation', async () => ({
    output: keywords,
    reasoning: `Generated search terms to find relevant products in our catalog.`
  }), { input_product: productName }, llmDurationMs);
}

// Search candidates from Supabase - wraps DB query inside step
export async function searchCandidates(executionId: string, keywords: string[]) {
  const xray = new GlassBox('');
  (xray as any).executionId = executionId;
  (xray as any).stepCount = 1;

  // Wrap the actual DB query inside the step to capture timing
  const results = await xray.step('candidate_search', async () => {
    const products = await fetchProductsInternal(keywords);
    return {
      output: products,
      reasoning: `Found ${products.length} products matching search terms: ${keywords.join(', ')}`
    };
  }, { search_keywords: keywords });

  return results;
}

// Apply filters - wraps computation inside step
export async function applyFilters(executionId: string, candidates: Product[]) {
  const xray = new GlassBox('');
  (xray as any).executionId = executionId;
  (xray as any).stepCount = 2;

  // Wrap the filter computation inside the step to capture timing
  const output = await xray.step('apply_filters', async () => {
    const result = computeFilterEvaluations(candidates);
    return {
      output: result,
      reasoning: `Applied quality filters. ${result.passed_count} passed, ${result.failed_count} rejected.`
    };
  }, { candidates_count: candidates.length, filters: FILTER_RULES });

  return output;
}

// Log LLM relevance step with duration from client
export async function logRelevanceStep(
  executionId: string, 
  productName: string, 
  evaluations: any[], 
  rankedList: any[], 
  summary: any,
  llmDurationMs?: number
) {
  const xray = new GlassBox('');
  (xray as any).executionId = executionId;
  (xray as any).stepCount = 3;

  await xray.step('llm_relevance_evaluation', async () => ({
    output: {
      user_query: productName,
      evaluations,
      ranked_list: rankedList,
      summary,
    },
    reasoning: `LLM evaluated ${evaluations.length} products. Found ${summary.true_matches} true matches, ${summary.close_alternatives} alternatives, removed ${summary.false_positives_removed} false positives.`
  }), { user_query: productName, candidates_for_review: evaluations.map(e => e.title) }, llmDurationMs);
}

// Log final selection step with duration from client
export async function logSelectionStep(executionId: string, selected: any, alternatives: any[], llmDurationMs?: number) {
  const xray = new GlassBox('');
  (xray as any).executionId = executionId;
  (xray as any).stepCount = 4;

  await xray.step('rank_and_select', async () => ({
    output: {
      selected,
      alternatives,
      total_relevant: 1 + alternatives.length,
    },
    reasoning: `Selected "${selected?.title || 'none'}" as #1. ${alternatives.length} alternatives with reasons why each wasn't chosen.`
  }), { ranked_candidates: [selected?.title, ...alternatives.map((a: any) => a.title)].filter(Boolean) }, llmDurationMs);
}

// Finish execution
export async function finishExecution(executionId: string, status: 'completed' | 'failed') {
  const xray = new GlassBox('');
  (xray as any).executionId = executionId;
  await xray.finish(status);
}