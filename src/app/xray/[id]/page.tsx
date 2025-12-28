import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { ArrowLeft, BrainCircuit, Check, Clock, Database, Filter, Search, X, AlertTriangle, Target, ThumbsUp, ThumbsDown, Sparkles } from 'lucide-react';
import { format } from 'date-fns';

export const dynamic = 'force-dynamic';

const getStepIcon = (name: string) => {
  if (name.includes('keyword')) return <BrainCircuit className="h-5 w-5 text-purple-400" />;
  if (name.includes('search')) return <Search className="h-5 w-5 text-blue-400" />;
  if (name.includes('filter')) return <Filter className="h-5 w-5 text-orange-400" />;
  if (name.includes('relevance')) return <Sparkles className="h-5 w-5 text-pink-400" />;
  if (name.includes('select') || name.includes('rank')) return <Target className="h-5 w-5 text-emerald-400" />;
  return <Database className="h-5 w-5 text-slate-400" />;
};

const FilterEvaluationsTable = ({ evaluations }: { evaluations: any[] }) => {
  if (!evaluations || !Array.isArray(evaluations)) return null;
  const sorted = [...evaluations].sort((a, b) => (a.qualified === b.qualified) ? 0 : a.qualified ? 1 : -1);
  
  return (
    <div className="mt-4 space-y-3">
      {sorted.map((item, idx) => (
        <div key={idx} className={`rounded-xl border overflow-hidden ${item.qualified ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-red-500/5 border-red-500/30'}`}>
          <div className={`px-4 py-3 flex items-center justify-between ${item.qualified ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
            <div className="flex items-center gap-3">
              {item.qualified ? <Check className="h-5 w-5 text-emerald-400" /> : <X className="h-5 w-5 text-red-400" />}
              <div>
                <span className="font-semibold text-white text-sm">{item.title}</span>
                {item.metrics && (
                  <div className="flex gap-3 text-xs text-slate-400 mt-0.5">
                    <span>${item.metrics.price?.toFixed(2)}</span>
                    <span>{item.metrics.rating}★</span>
                    <span>{item.metrics.reviews?.toLocaleString()} reviews</span>
                  </div>
                )}
              </div>
            </div>
            <span className={`text-xs font-bold px-2 py-1 rounded ${item.qualified ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
              {item.qualified ? 'PASSED' : 'REJECTED'}
            </span>
          </div>
          {item.rejection_reason && (
            <div className="px-4 py-3 bg-red-500/5 border-t border-red-500/20">
              <div className="flex gap-2">
                <AlertTriangle className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs font-bold text-red-400">WHY REJECTED: </span>
                  <span className="text-xs text-red-200/90">{item.rejection_reason}</span>
                </div>
              </div>
            </div>
          )}
          {item.filter_results && (
            <div className="px-4 py-2 border-t border-white/5 flex gap-2 flex-wrap">
              {Object.entries(item.filter_results).map(([name, result]: [string, any]) => (
                <span key={name} className={`text-xs px-2 py-1 rounded ${result.passed ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                  {result.passed ? '✓' : '✗'} {name.replace('min_', '')}: {result.detail}
                </span>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

const LLMRelevanceDisplay = ({ output }: { output: any }) => {
  if (!output?.evaluations) return null;
  
  const getMatchColor = (type: string) => {
    switch (type) {
      case 'TRUE_MATCH': return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400';
      case 'CLOSE_ALTERNATIVE': return 'bg-amber-500/10 border-amber-500/30 text-amber-400';
      case 'FALSE_POSITIVE': return 'bg-red-500/10 border-red-500/30 text-red-400';
      default: return 'bg-slate-500/10 border-slate-500/30 text-slate-400';
    }
  };

  const getMatchIcon = (type: string) => {
    switch (type) {
      case 'TRUE_MATCH': return <ThumbsUp className="h-5 w-5 text-emerald-400" />;
      case 'CLOSE_ALTERNATIVE': return <Target className="h-5 w-5 text-amber-400" />;
      case 'FALSE_POSITIVE': return <ThumbsDown className="h-5 w-5 text-red-400" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-4">
      {output.user_query && (
        <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3">
          <span className="text-xs text-purple-300 font-medium">User searched for: </span>
          <span className="text-sm text-white font-semibold">&quot;{output.user_query}&quot;</span>
        </div>
      )}
      {output.summary && (
        <div className="flex gap-3">
          <div className="flex-1 bg-emerald-500/10 rounded-lg p-3 text-center border border-emerald-500/20">
            <div className="text-xl font-bold text-emerald-400">{output.summary.true_matches}</div>
            <div className="text-xs text-emerald-400/70">True Matches</div>
          </div>
          <div className="flex-1 bg-amber-500/10 rounded-lg p-3 text-center border border-amber-500/20">
            <div className="text-xl font-bold text-amber-400">{output.summary.close_alternatives}</div>
            <div className="text-xs text-amber-400/70">Alternatives</div>
          </div>
          <div className="flex-1 bg-red-500/10 rounded-lg p-3 text-center border border-red-500/20">
            <div className="text-xl font-bold text-red-400">{output.summary.false_positives_removed}</div>
            <div className="text-xs text-red-400/70">False Positives</div>
          </div>
        </div>
      )}
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">LLM Relevance Analysis</h4>
        {(output.ranked_list || output.evaluations).map((item: any, idx: number) => (
          <div key={idx} className={`rounded-xl border overflow-hidden ${getMatchColor(item.match_type)}`}>
            <div className="px-4 py-3 flex items-center justify-between bg-white/5">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/10">
                  {getMatchIcon(item.match_type)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white text-sm">{item.title}</span>
                    <span className="text-xs bg-white/10 px-2 py-0.5 rounded">{item.relevance_score}/100</span>
                  </div>
                  {item.metrics && (
                    <div className="flex gap-3 text-xs text-slate-400 mt-0.5">
                      <span>${item.metrics.price?.toFixed(2)}</span>
                      <span>{item.metrics.rating}★</span>
                      <span>{item.metrics.reviews?.toLocaleString()} reviews</span>
                    </div>
                  )}
                </div>
              </div>
              <span className={`text-xs font-bold px-2 py-1 rounded ${getMatchColor(item.match_type)}`}>
                {item.match_type?.replace('_', ' ')}
              </span>
            </div>
            <div className="px-4 py-3 border-t border-white/10">
              <div className="flex gap-2">
                <Sparkles className="h-4 w-4 text-pink-400 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs font-bold text-pink-400">LLM ANALYSIS: </span>
                  <span className="text-sm text-slate-200">{item.reason}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const FiltersAppliedCard = ({ filters }: { filters: any }) => {
  if (!filters) return null;
  return (
    <div className="mb-4 bg-orange-500/10 border border-orange-500/20 rounded-lg p-3">
      <h4 className="text-xs font-bold text-orange-300 uppercase tracking-wider mb-2">Filters Applied</h4>
      <div className="flex flex-wrap gap-2">
        {Object.entries(filters).map(([key, value]: [string, any]) => (
          <span key={key} className="text-xs bg-orange-500/10 text-orange-200 px-2 py-1 rounded border border-orange-500/20">
            {value.rule}
          </span>
        ))}
      </div>
    </div>
  );
};

const hasFilterEvaluations = (output: any) => output?.evaluations && output?.filters_applied;
const hasLLMRelevance = (output: any) => output?.evaluations && (output?.ranked_list || output?.user_query);
const hasRankedOutput = (output: any) => output?.selected || output?.alternatives;

export default async function TraceDetail({ params }: { params: { id: string } }) {
  const { data: execution } = await supabase.from('executions').select('*').eq('id', params.id).single();
  const { data: steps } = await supabase.from('steps').select('*').eq('execution_id', params.id).order('step_order', { ascending: true });

  if (!execution) return <div className="p-8 text-white">Execution not found</div>;

  return (
    <div className="min-h-screen flex flex-col items-center pb-20 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-[300px] bg-gradient-to-b from-indigo-900/20 to-transparent -z-10" />

      <div className="w-full bg-white/5 border-b border-white/10 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4 mb-2">
            <Link href="/xray" className="p-2 hover:bg-white/10 rounded-full transition-colors">
              <ArrowLeft className="h-5 w-5 text-slate-400" />
            </Link>
            <h1 className="text-xl font-bold text-white">{execution.name}</h1>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${execution.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
              {execution.status}
            </span>
          </div>
          <div className="flex items-center gap-6 text-sm text-slate-500 ml-14">
            <span className="font-mono text-xs opacity-70">{execution.id}</span>
            <span>{format(new Date(execution.created_at), 'PPpp')}</span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl w-full px-6 py-12">
        <div className="space-y-8">
          {steps?.map((step, index) => (
            <div key={step.id} className="relative pl-8 sm:pl-12 group">
              {index !== steps.length - 1 && (
                <div className="absolute left-[19px] sm:left-[27px] top-10 bottom-[-32px] w-0.5 bg-white/10" />
              )}
              <div className="absolute left-0 sm:left-2 top-0 bg-[#030712] border border-white/10 p-2 rounded-full shadow-lg z-10">
                {getStepIcon(step.step_name)}
              </div>

              <div className="glass-panel rounded-xl overflow-hidden">
                <div className="bg-white/5 px-6 py-3 border-b border-white/5 flex justify-between items-center">
                  <h3 className="font-semibold text-slate-200 font-mono text-sm">{step.step_name}</h3>
                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {step.duration_ms}ms</span>
                    {step.status === 'success' ? (
                      <span className="text-emerald-400 font-medium flex items-center gap-1"><Check className="h-3 w-3" /> Success</span>
                    ) : (
                      <span className="text-red-400 font-medium flex items-center gap-1"><X className="h-3 w-3" /> Failed</span>
                    )}
                  </div>
                </div>

                <div className="p-6">
                  {step.reasoning && (
                    <div className="mb-4 bg-indigo-500/10 border border-indigo-500/20 rounded-lg p-3">
                      <span className="text-xs font-bold text-indigo-300">REASONING: </span>
                      <span className="text-sm text-indigo-100">{step.reasoning}</span>
                    </div>
                  )}

                  {hasFilterEvaluations(step.output) && (
                    <>
                      <FiltersAppliedCard filters={step.output.filters_applied} />
                      <div className="flex gap-3 mb-4">
                        <div className="flex-1 bg-white/5 rounded-lg p-2 text-center border border-white/5">
                          <div className="text-lg font-bold text-white">{step.output.total_evaluated}</div>
                          <div className="text-xs text-slate-500">Evaluated</div>
                        </div>
                        <div className="flex-1 bg-emerald-500/10 rounded-lg p-2 text-center border border-emerald-500/20">
                          <div className="text-lg font-bold text-emerald-400">{step.output.passed_count}</div>
                          <div className="text-xs text-emerald-400/70">Passed</div>
                        </div>
                        <div className="flex-1 bg-red-500/10 rounded-lg p-2 text-center border border-red-500/20">
                          <div className="text-lg font-bold text-red-400">{step.output.failed_count}</div>
                          <div className="text-xs text-red-400/70">Rejected</div>
                        </div>
                      </div>
                      <FilterEvaluationsTable evaluations={step.output.evaluations} />
                    </>
                  )}

                  {hasLLMRelevance(step.output) && <LLMRelevanceDisplay output={step.output} />}

                  {/* FINAL SELECTION WITH WHY SELECTED AND WHY NOT SELECTED */}
                  {hasRankedOutput(step.output) && step.output.selected && (
                    <div className="space-y-4">
                      {/* Winner */}
                      <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Target className="h-5 w-5 text-emerald-400" />
                          <span className="text-sm font-bold text-emerald-400">SELECTED #1: </span>
                          <span className="text-white font-semibold">{step.output.selected.title}</span>
                          {step.output.selected.relevance_score && (
                            <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded">{step.output.selected.relevance_score}/100</span>
                          )}
                        </div>
                        {step.output.selected.reason_selected && (
                          <div className="ml-7 bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-3 mt-2">
                            <span className="text-xs font-bold text-emerald-400">WHY SELECTED: </span>
                            <span className="text-sm text-emerald-100">{step.output.selected.reason_selected}</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Alternatives with WHY NOT #1 */}
                      {step.output.alternatives?.length > 0 && (
                        <div>
                          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Why Others Weren&apos;t #1</h4>
                          <div className="space-y-3">
                            {step.output.alternatives.map((alt: any, i: number) => (
                              <div key={i} className="bg-amber-500/5 border border-amber-500/20 rounded-xl overflow-hidden">
                                <div className="px-4 py-3 flex items-center justify-between bg-amber-500/10">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-amber-400 font-bold">#{i + 2}</span>
                                    <span className="text-sm text-white font-medium">{alt.title}</span>
                                  </div>
                                  {alt.relevance_score && (
                                    <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded">{alt.relevance_score}/100</span>
                                  )}
                                </div>
                                {alt.reason_not_selected && (
                                  <div className="px-4 py-3 border-t border-amber-500/10">
                                    <div className="flex gap-2">
                                      <AlertTriangle className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
                                      <div>
                                        <span className="text-xs font-bold text-amber-400">WHY NOT #1: </span>
                                        <span className="text-sm text-amber-100/90">{alt.reason_not_selected}</span>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {!hasFilterEvaluations(step.output) && !hasLLMRelevance(step.output) && !hasRankedOutput(step.output) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Input</h4>
                        <div className="bg-[#0a0f1c] rounded-lg border border-white/5 p-3">
                          <pre className="text-xs text-slate-400 font-mono overflow-x-auto">{JSON.stringify(step.input, null, 2)}</pre>
                        </div>
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Output</h4>
                        <div className="bg-[#0a0f1c] rounded-lg border border-white/5 p-3">
                          <pre className="text-xs text-slate-400 font-mono overflow-x-auto">{JSON.stringify(step.output, null, 2)}</pre>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}