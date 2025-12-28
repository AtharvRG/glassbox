import Link from "next/link";
import { Activity, Search, ArrowRight, Layers, Sparkles } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 relative overflow-hidden">
      {/* Ambient Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] -z-10" />
      
      <div className="max-w-5xl w-full space-y-16 relative z-10">
        
        {/* Hero Section */}
        <div className="text-center space-y-6">
          <div className="inline-flex items-center justify-center p-4 rounded-2xl bg-white/5 border border-white/10 shadow-lg shadow-indigo-500/10 mb-2">
            <Layers className="h-10 w-10 text-indigo-400" />
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
            <span className="text-gradient">GlassBox</span>
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            An X-Ray system for debugging multi-step, non-deterministic algorithmic pipelines.
          </p>
        </div>

        {/* Navigation Cards */}
        <div className="grid md:grid-cols-2 gap-8">
          
          {/* Card 1: The Demo */}
          <Link 
            href="/demo"
            className="group relative glass-panel p-10 rounded-3xl hover:bg-white/10 transition-all duration-300 hover:-translate-y-1"
          >
            <div className="absolute top-8 right-8 bg-indigo-500/10 p-3 rounded-xl group-hover:bg-indigo-500/20 transition-colors border border-indigo-500/20">
              <Search className="h-6 w-6 text-indigo-400" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-3">
              Demo Application
            </h2>
            <p className="text-slate-400 mb-8 pr-12 text-lg leading-relaxed">
              Run the &quot;Competitor Finder&quot; pipeline. Uses Gemini LLM + Mock APIs to find product benchmarks.
            </p>
            <div className="flex items-center text-indigo-400 font-semibold group-hover:translate-x-2 transition-transform">
              Launch Demo <ArrowRight className="ml-2 h-5 w-5" />
            </div>
          </Link>

          {/* Card 2: The Dashboard */}
          <Link 
            href="/xray"
            className="group relative glass-panel p-10 rounded-3xl hover:bg-white/10 transition-all duration-300 hover:-translate-y-1"
          >
            <div className="absolute top-8 right-8 bg-purple-500/10 p-3 rounded-xl group-hover:bg-purple-500/20 transition-colors border border-purple-500/20">
              <Activity className="h-6 w-6 text-purple-400" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-3">
              X-Ray Dashboard
            </h2>
            <p className="text-slate-400 mb-8 pr-12 text-lg leading-relaxed">
              Visualize the decision trails. Inspect inputs, outputs, and reasoning for every execution step.
            </p>
            <div className="flex items-center text-purple-400 font-semibold group-hover:translate-x-2 transition-transform">
              Open Dashboard <ArrowRight className="ml-2 h-5 w-5" />
            </div>
          </Link>

        </div>

        {/* Footer */}
        <div className="text-center pt-12 border-t border-white/5">
          <p className="text-slate-500 text-sm font-medium tracking-wide uppercase opacity-60">
            Built for the Founding Engineer Take-Home Assignment
          </p>
        </div>
      </div>
    </main>
  );
}