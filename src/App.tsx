import React, { useState, useEffect } from 'react';
import { Play, Loader2, Video, CheckCircle2, AlertCircle, RefreshCcw } from 'lucide-react';
import { motion, AnimatePresence } from "motion/react";

interface Job {
  id: string;
  status: string;
  videoUrl?: string;
  error?: string;
  storyTitle?: string;
}

export default function App() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);

  const createJob = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/jobs', { method: 'POST' });
      const data = await res.json();
      const newJob = { id: data.jobId, status: 'pending' };
      setJobs(prev => [newJob, ...prev]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const interval = setInterval(async () => {
      const activeJobs = jobs.filter(j => !['completed', 'failed'].includes(j.status));
      if (activeJobs.length === 0) return;

      const updatedJobs = await Promise.all(
        jobs.map(async (job) => {
          if (['completed', 'failed'].includes(job.status)) return job;
          try {
            const res = await fetch(`/api/jobs/${job.id}`);
            if (res.ok) {
              const text = await res.text();
              try {
                return JSON.parse(text);
              } catch (e) {
                console.error('Failed to parse job JSON:', text);
                return job;
              }
            }
          } catch (err) {
            console.error(err);
          }
          return job;
        })
      );
      setJobs(updatedJobs);
    }, 2000);

    return () => clearInterval(interval);
  }, [jobs]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-6 md:p-12 selection:bg-purple-500/30">
      <div className="max-w-5xl mx-auto space-y-12">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-800 pb-8">
          <div>
            <motion.h1 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-5xl md:text-7xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400"
            >
              OpenPulse
            </motion.h1>
            <p className="text-slate-400 mt-4 text-lg font-medium max-w-xl leading-relaxed">
              Autonomous news-to-video pipeline. Transforming real-time feeds into cinematic vertical shorts.
            </p>
          </div>
          <button
            onClick={createJob}
            disabled={loading}
            className="group relative flex items-center gap-3 bg-white text-black px-8 py-4 rounded-full font-bold text-lg hover:bg-blue-400 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden active:scale-95"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            <span className="relative z-10 flex items-center gap-3">
              {loading ? <Loader2 className="animate-spin size-5" /> : <Play className="size-5 fill-current" />}
              Generate News Video
            </span>
          </button>
        </header>

        {/* Job List */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <Video className="text-blue-400 size-6" />
              Production Queue
            </h2>
            <span className="text-sm font-mono text-slate-500 bg-slate-900 px-3 py-1 rounded-full border border-slate-800">
              {jobs.length} Jobs
            </span>
          </div>

          <div className="grid gap-4">
            <AnimatePresence mode="popLayout">
              {jobs.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-20 border-2 border-dashed border-slate-800 rounded-3xl flex flex-col items-center justify-center text-slate-500 gap-4"
                >
                  <RefreshCcw className="size-12 opacity-20" />
                  <p className="text-xl">Your production queue is empty</p>
                </motion.div>
              ) : (
                jobs.map((job) => (
                  <motion.div
                    key={job.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="group bg-slate-900/50 border border-slate-800 p-6 rounded-3xl hover:border-slate-700 hover:bg-slate-900 transition-all duration-500"
                  >
                    <div className="flex flex-col md:flex-row gap-6 md:items-center">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                            job.status === 'completed' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                            job.status === 'failed' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                            'bg-blue-500/10 text-blue-400 border border-blue-500/20 animate-pulse'
                          }`}>
                            {job.status}
                          </span>
                          <span className="text-xs font-mono text-slate-500">{job.id}</span>
                        </div>
                        <h3 className="text-xl font-bold text-slate-200 line-clamp-1 group-hover:text-blue-400 transition-colors">
                          {job.storyTitle || 'Analyzing Trending News...'}
                        </h3>
                      </div>

                      <div className="flex items-center gap-4">
                        {job.status === 'completed' ? (
                          <a
                            href={job.videoUrl}
                            download
                            className="bg-slate-100 text-black px-6 py-2.5 rounded-full font-bold hover:bg-green-400 transition-colors flex items-center gap-2"
                          >
                            <CheckCircle2 className="size-4" />
                            Download MP4
                          </a>
                        ) : job.status === 'failed' ? (
                          <div className="flex flex-col items-end gap-1">
                            <div className="text-red-400 flex items-center gap-2 px-4 py-2 bg-red-400/10 rounded-xl border border-red-400/20">
                              <AlertCircle className="size-4" />
                              <span className="text-sm font-medium">Generation Error</span>
                            </div>
                            {job.error && (
                              <span className="text-[10px] text-red-500/60 font-mono mt-1 max-w-[200px] text-right truncate" title={job.error}>
                                {job.error}
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-3 text-slate-500 italic text-sm">
                            <Loader2 className="animate-spin size-4" />
                            Autonomous pipeline in progress...
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </section>
      </div>
    </div>
  );
}
