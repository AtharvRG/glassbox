import Link from "next/link";
import Image from "next/image";
import { Activity, Search, ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 relative overflow-hidden">
      {/* Ambient Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-mosque/40 rounded-full blur-[120px] -z-10" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[400px] bg-inch-worm/10 rounded-full blur-[100px] -z-10" />
      
      <div className="max-w-5xl w-full space-y-16 relative z-10">
        
        {/* Hero Section */}
        <div className="text-center space-y-6">
          <div className="inline-flex items-center justify-center mb-4">
            <Image 
              src="/logo.svg" 
              alt="GlassBox Logo" 
              width={72} 
              height={67} 
              className="rounded-xl border-[1.5px] border-[#ABF00C]"
            />
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight font-heading">
            <span className="text-gradient">GlassBox</span>
          </h1>
          <p className="text-xl text-white/70 max-w-2xl mx-auto leading-relaxed">
            An X-Ray system for debugging multi-step, non-deterministic algorithmic pipelines.
          </p>
        </div>

        {/* Navigation Cards */}
        <div className="grid md:grid-cols-2 gap-8">
          
          {/* Card 1: The Demo */}
          <Link 
            href="/demo"
            className="group relative glass-panel p-10 rounded-3xl hover:bg-mosque/30 transition-all duration-300 hover:-translate-y-1"
          >
            <div className="absolute top-8 right-8 bg-inch-worm/10 p-3 rounded-xl group-hover:bg-inch-worm/20 transition-colors border border-inch-worm/30">
              <Search className="h-6 w-6 text-inch-worm" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-3 font-heading">
              Demo Application
            </h2>
            <p className="text-white/60 mb-8 pr-12 text-lg leading-relaxed">
              Run the &quot;Competitor Finder&quot; pipeline. Uses AI + Database to find product benchmarks.
            </p>
            <div className="flex items-center text-inch-worm font-semibold group-hover:translate-x-2 transition-transform">
              Launch Demo <ArrowRight className="ml-2 h-5 w-5" />
            </div>
          </Link>

          {/* Card 2: The Dashboard */}
          <Link 
            href="/xray"
            className="group relative glass-panel p-10 rounded-3xl hover:bg-mosque/30 transition-all duration-300 hover:-translate-y-1"
          >
            <div className="absolute top-8 right-8 bg-mosque-light/20 p-3 rounded-xl group-hover:bg-mosque-light/30 transition-colors border border-inch-worm/20">
              <Activity className="h-6 w-6 text-inch-worm" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-3 font-heading">
              X-Ray Dashboard
            </h2>
            <p className="text-white/60 mb-8 pr-12 text-lg leading-relaxed">
              Visualize the decision trails. Inspect inputs, outputs, and reasoning for every execution step.
            </p>
            <div className="flex items-center text-inch-worm font-semibold group-hover:translate-x-2 transition-transform">
              Open Dashboard <ArrowRight className="ml-2 h-5 w-5" />
            </div>
          </Link>

        </div>

        {/* Footer */}
        <div className="text-center pt-12 border-t border-inch-worm/10">
          <p className="text-white/40 text-sm font-medium tracking-wide uppercase">
            Built for the Founding Engineer Take-Home Assignment
          </p>
        </div>
      </div>
    </main>
  );
}