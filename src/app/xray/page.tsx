import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import { CheckCircle, XCircle, Clock, ArrowRight, ArrowLeft } from 'lucide-react';

// Force dynamic rendering so we always see new runs
export const dynamic = 'force-dynamic';

export default async function XrayDashboard() {
  const { data: executions } = await supabase
    .from('executions')
    .select('id, name, status, created_at')
    .order('created_at', { ascending: false })
    .limit(50);

  return (
    <div className="min-h-screen flex flex-col items-center p-8 relative overflow-hidden">
      {/* Ambient Background Glow */}
      <div className="absolute top-0 right-0 w-[800px] h-[600px] bg-mosque/30 rounded-full blur-[120px] -z-10" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[400px] bg-inch-worm/10 rounded-full blur-[100px] -z-10" />

      <div className="max-w-5xl w-full relative z-10">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white flex items-center gap-4 mb-2 font-heading">
              <Image 
                src="/logo.svg" 
                alt="GlassBox Logo" 
                width={48} 
                height={48} 
                className="rounded-xl border-[1.5px] border-[#ABF00C]"
              />
              <span className="text-gradient">GlassBox Dashboard</span>
            </h1>
            <p className="text-white/60 text-lg ml-16">Monitor and debug algorithmic decision trails.</p>
          </div>
          <Link 
            href="/demo" 
            className="glass-button px-6 py-3 rounded-xl font-medium text-sm flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Demo
          </Link>
        </div>

        <div className="glass-panel rounded-2xl overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-mosque/30 border-b border-inch-worm/10">
              <tr>
                <th className="px-8 py-5 font-semibold text-white/80">Execution Name</th>
                <th className="px-8 py-5 font-semibold text-white/80">Status</th>
                <th className="px-8 py-5 font-semibold text-white/80">Time</th>
                <th className="px-8 py-5 font-semibold text-white/80 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-inch-worm/5">
              {executions?.map((exec) => (
                <tr key={exec.id} className="hover:bg-mosque/20 transition-colors group">
                  <td className="px-8 py-5 font-medium text-white">
                    {exec.name}
                    <div className="text-xs text-white/40 font-normal mt-1 font-mono opacity-70">
                      {exec.id}
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border ${
                      exec.status === 'completed' 
                        ? 'bg-inch-worm/10 text-inch-worm border-inch-worm/20' 
                        : exec.status === 'failed'
                        ? 'bg-red-500/10 text-red-400 border-red-500/20'
                        : 'bg-mosque-light/20 text-mosque-light border-mosque-light/20'
                    }`}>
                      {exec.status === 'completed' && <CheckCircle className="h-3.5 w-3.5" />}
                      {exec.status === 'failed' && <XCircle className="h-3.5 w-3.5" />}
                      {exec.status === 'running' && <Clock className="h-3.5 w-3.5 animate-pulse" />}
                      {exec.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-white/60">
                    {formatDistanceToNow(new Date(exec.created_at), { addSuffix: true })}
                  </td>
                  <td className="px-8 py-5 text-right">
                    <Link 
                      href={`/xray/${exec.id}`}
                      className="inline-flex items-center gap-2 text-inch-worm font-medium hover:text-inch-worm-light transition-colors"
                    >
                      View Trace <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </td>
                </tr>
              ))}
              {executions?.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-8 py-16 text-center text-white/50">
                    No executions found. Run the demo app first!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}