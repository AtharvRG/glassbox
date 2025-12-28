'use client';

import { useState } from 'react';
import { 
  initExecution, 
  logKeywordStep, 
  searchCandidates, 
  applyFilters, 
  logRelevanceStep, 
  logSelectionStep, 
  finishExecution
} from './actions';
import { callLLM } from '@/lib/puter-llm';
import { Loader2, Search, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

// Helper to get qualified products (client-side)
function getQualifiedProducts(filterResult: any) {
  return filterResult.evaluations.filter((e: any) => e.qualified);
}

export default function DemoPage() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [result, setResult] = useState<any>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setResult(null);
    
    let executionId = '';

    try {
      // Step 1: Init execution
      setStatus('Initializing execution...');
      const newExecutionId = await initExecution(query);
      if (!newExecutionId) {
        throw new Error('Failed to initialize execution tracking');
      }
      executionId = newExecutionId;

      // Step 2: Generate keywords via Puter LLM
      setStatus('Generating search keywords...');
      const keywordPrompt = `Extract 3 search keywords for: "${query}". Return ONLY a JSON array. Example: ["keyword1", "keyword2"]`;
      const keywordResponse = await callLLM(keywordPrompt);
      const keywords = JSON.parse(keywordResponse.replace(/```json|```/g, '').trim());
      await logKeywordStep(executionId, query, keywords);

      // Step 3: Search candidates (server-side, no LLM)
      setStatus('Searching candidates...');
      const candidates = await searchCandidates(executionId, keywords);

      // Step 4: Apply filters (server-side, no LLM)
      setStatus('Applying quality filters...');
      const filterResult = await applyFilters(executionId, candidates);

      // Step 5: LLM Relevance Evaluation
      setStatus('Evaluating relevance with AI...');
      const qualifiedProducts = getQualifiedProducts(filterResult);
      
      if (qualifiedProducts.length === 0) {
        await logRelevanceStep(executionId, query, [], [], { true_matches: 0, close_alternatives: 0, false_positives_removed: 0 });
        await logSelectionStep(executionId, null, []);
        await finishExecution(executionId, 'completed');
        setResult({ success: true, data: null, executionId });
        return;
      }

      const relevancePrompt = `
User searched for: "${query}"

Evaluate each product's RELEVANCE. Classify as:
- TRUE_MATCH: Directly what user wants
- CLOSE_ALTERNATIVE: Similar but not exact
- FALSE_POSITIVE: Not relevant

Products:
${qualifiedProducts.map((p: any, i: number) => `${i + 1}. "${p.title}" - $${p.metrics.price}, ${p.metrics.rating}★, ${p.metrics.reviews} reviews`).join('\n')}

Return JSON array:
[{"title": "...", "match_type": "TRUE_MATCH|CLOSE_ALTERNATIVE|FALSE_POSITIVE", "relevance_score": 0-100, "reason": "..."}]
Only valid JSON, no markdown.`;

      const relevanceResponse = await callLLM(relevancePrompt);
      let evaluations: any[] = [];
      try {
        evaluations = JSON.parse(relevanceResponse.replace(/```json|```/g, '').trim());
      } catch {
        evaluations = qualifiedProducts.map((p: any) => ({
          title: p.title,
          match_type: 'CLOSE_ALTERNATIVE',
          relevance_score: 70,
          reason: 'Unable to determine exact relevance.'
        }));
      }

      // Enrich with metrics
      const enrichedEvaluations = evaluations.map(eval_ => {
        const product = qualifiedProducts.find((p: any) => p.title === eval_.title);
        return {
          ...eval_,
          id: product?.id,
          metrics: product?.metrics || null,
        };
      });

      const rankedList = [...enrichedEvaluations].sort((a, b) => b.relevance_score - a.relevance_score);
      const summary = {
        true_matches: evaluations.filter(e => e.match_type === 'TRUE_MATCH').length,
        close_alternatives: evaluations.filter(e => e.match_type === 'CLOSE_ALTERNATIVE').length,
        false_positives_removed: evaluations.filter(e => e.match_type === 'FALSE_POSITIVE').length,
      };

      await logRelevanceStep(executionId, query, enrichedEvaluations, rankedList, summary);

      // Step 6: Ranking & Selection with LLM explanation
      setStatus('Selecting best match...');
      const validResults = rankedList.filter(r => r.match_type !== 'FALSE_POSITIVE');

      if (validResults.length === 0) {
        await logSelectionStep(executionId, null, []);
        await finishExecution(executionId, 'completed');
        setResult({ success: true, data: null, executionId });
        return;
      }

      const rankingPrompt = `
User searched for: "${query}"

These products passed all filters. Explain the RANKING decision:
${validResults.map((p: any, i: number) => `${i + 1}. "${p.title}" - $${p.metrics?.price}, ${p.metrics?.rating}★, ${p.metrics?.reviews} reviews`).join('\n')}

Return JSON:
{
  "winner": {"title": "...", "reason_selected": "WHY this is BEST"},
  "not_selected": [{"title": "...", "reason_not_selected": "WHY this wasn't #1"}]
}
Be VERY specific! Only valid JSON.`;

      let rankingExplanation: any = null;
      try {
        const rankingResponse = await callLLM(rankingPrompt);
        rankingExplanation = JSON.parse(rankingResponse.replace(/```json|```/g, '').trim());
      } catch {
        rankingExplanation = {
          winner: { title: validResults[0].title, reason_selected: 'Highest relevance score and market presence.' },
          not_selected: validResults.slice(1).map((r: any) => ({ 
            title: r.title, 
            reason_not_selected: 'Ranked lower based on overall relevance.' 
          }))
        };
      }

      // Find the winner based on LLM's choice (match by title)
      const llmWinnerTitle = rankingExplanation.winner?.title;
      const winnerProduct = validResults.find((r: any) => r.title === llmWinnerTitle) || validResults[0];
      
      const best = {
        ...winnerProduct,
        reason_selected: rankingExplanation.winner?.reason_selected || 'Best match.',
      };

      const alternatives = validResults
        .filter((r: any) => r.title !== winnerProduct.title)
        .map((alt: any) => {
          const notSelectedInfo = rankingExplanation.not_selected?.find((n: any) => n.title === alt.title);
          // Calculate a composite score for ranking alternatives
          const rating = alt.metrics?.rating || 0;
          const reviews = alt.metrics?.reviews || 0;
          const price = alt.metrics?.price || 1;
          const normalizedReviews = Math.min(reviews / 10000, 1);
          const valueScore = rating / Math.log10(price + 1);
          const compositeScore = (rating * 0.5) + (normalizedReviews * 0.2) + (valueScore * 0.3);
          return {
            ...alt,
            reason_not_selected: notSelectedInfo?.reason_not_selected || 'Ranked lower.',
            _relevanceScore: alt.relevance_score || 0,
            _compositeScore: compositeScore,
          };
        })
        .sort((a: any, b: any) => {
          if (b._relevanceScore !== a._relevanceScore) {
            return b._relevanceScore - a._relevanceScore;
          }
          return b._compositeScore - a._compositeScore;
        })
        .map(({ _compositeScore, _relevanceScore, ...rest }: any) => rest);

      await logSelectionStep(executionId, best, alternatives);
      await finishExecution(executionId, 'completed');
      
      setResult({ success: true, data: best, executionId });

    } catch (err) {
      if (executionId) {
        await finishExecution(executionId, 'failed');
      }
      setResult({ success: false, error: (err as Error).message, executionId });
    } finally {
      setLoading(false);
      setStatus('');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-mosque/40 rounded-full blur-[120px] -z-10" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[400px] bg-inch-worm/10 rounded-full blur-[100px] -z-10" />
      
      <div className="glass-panel max-w-xl w-full rounded-2xl p-8 md:p-12 relative z-10">
        <div className="mb-10 text-center">
          <div className="inline-flex items-center justify-center mb-6">
            <Image 
              src="/logo.svg" 
              alt="GlassBox Logo" 
              width={56} 
              height={52} 
              className="rounded-xl border-[1.5px] border-[#ABF00C]"
            />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight font-heading">
            <span className="text-gradient">Competitor Finder</span>
          </h1>
          <p className="text-white/60 text-lg leading-relaxed max-w-sm mx-auto">
            Discover the perfect benchmark competitor using our advanced AI pipeline.
          </p>
        </div>

        <form onSubmit={handleSearch} className="space-y-6">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-mosque to-inch-worm/50 rounded-xl blur opacity-20 group-hover:opacity-30 transition-opacity duration-300" />
            <div className="relative">
              <Search className="absolute left-4 top-4 h-5 w-5 text-white/40 group-focus-within:text-inch-worm transition-colors" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g., Water Bottle"
                className="glass-input w-full pl-12 pr-4 py-4 rounded-xl text-lg outline-none"
              />
            </div>
          </div>
          
          <button
            disabled={loading}
            className="glass-button w-full py-4 rounded-xl font-semibold text-lg flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="animate-pulse">{status || 'Analyzing...'}</span>
              </>
            ) : (
              <>
                Find Competitor <ArrowRight className="h-5 w-5" />
              </>
            )}
          </button>
        </form>

        {result && (
          <div className="mt-10 pt-8 border-t border-inch-worm/10 animate-fade-in">
            {result.success ? (
              <div className="text-center animate-slide-up">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-inch-worm/20 to-inch-worm/10 border border-inch-worm/30 text-inch-worm mb-6 shadow-[0_0_30px_-5px_rgba(171,240,12,0.3)]">
                  <Search className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2 font-heading">Match Found</h3>
                <p className="text-white/80 text-lg mb-8 bg-mosque/30 py-3 px-6 rounded-lg inline-block border border-inch-worm/20">
                  {result.data?.title || "No suitable competitor found."}
                </p>
                
                <Link 
                  href={`/xray/${result.executionId}`}
                  className="inline-flex items-center gap-2 text-sm font-medium text-inch-worm hover:text-inch-worm-light transition-colors group"
                >
                  View Decision Trace 
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            ) : (
              <div className="text-center animate-slide-up">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/20 border border-red-500/30 text-red-400 mb-6">
                  <Search className="h-7 w-7" />
                </div>
                <p className="text-red-400 font-medium mb-4">Analysis Failed: {result.error}</p>
                {result.executionId && (
                  <Link 
                    href={`/xray/${result.executionId}`}
                    className="text-sm text-white/50 hover:text-white/70 underline decoration-white/30 underline-offset-4"
                  >
                    Debug Error
                  </Link>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      
      <div className="absolute bottom-6 text-white/30 text-xs font-medium tracking-widest uppercase">
        GlassBox AI • Powered by Puter.js
      </div>
    </div>
  );
}