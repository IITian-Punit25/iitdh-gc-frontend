'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { Play, Calendar, Trophy } from 'lucide-react';

export default function LivePage() {
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/results`)
            .then((res) => res.json())
            .then((data) => {
                // Filter for matches that have a live link or are recent
                setResults(data);
                setLoading(false);
            })
            .catch((err) => {
                console.error('Error fetching results:', err);
                setLoading(false);
            });
    }, []);

    const liveMatches = results.filter(r => r.streamStatus === 'Live' || r.streamStatus === 'Upcoming');

    return (
        <div className="min-h-screen bg-background text-foreground">
            <Navbar />
            <main className="max-w-7xl mx-auto px-4 py-12">
                <div className="text-center mb-16">
                    <span className="inline-block py-1 px-3 rounded-full bg-red-500/10 text-red-500 text-sm font-bold mb-4 border border-red-500/20 animate-pulse">
                        LIVE CENTER
                    </span>
                    <h1 className="text-4xl md:text-5xl font-black mb-6">Live & Upcoming</h1>
                    <p className="text-slate-400 text-lg max-w-2xl mx-auto">
                        Watch live streams of ongoing matches and see what's coming up next.
                    </p>
                </div>

                {loading ? (
                    <div className="text-center py-12 text-slate-500">Loading live matches...</div>
                ) : liveMatches.length === 0 ? (
                    <div className="text-center py-20 bg-white/5 rounded-3xl border border-white/10">
                        <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Play className="h-8 w-8 text-slate-500" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">No Active Streams</h3>
                        <p className="text-slate-400">There are no matches currently live or starting soon.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {liveMatches.map((match) => (
                            <div key={match.id} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden hover:border-primary/50 transition-all group">
                                <div className="aspect-video bg-black/50 relative flex items-center justify-center group-hover:bg-black/40 transition-colors">
                                    <div className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-transform cursor-pointer ${match.streamStatus === 'Live' ? 'bg-red-600 shadow-red-600/20 group-hover:scale-110' : 'bg-blue-600 shadow-blue-600/20 group-hover:scale-110'}`}>
                                        <Play className="h-8 w-8 text-white ml-1" />
                                    </div>
                                    <div className={`absolute top-4 left-4 text-white text-xs font-bold px-2 py-1 rounded flex items-center ${match.streamStatus === 'Live' ? 'bg-red-600' : 'bg-blue-600'}`}>
                                        <span className={`w-2 h-2 bg-white rounded-full mr-2 ${match.streamStatus === 'Live' ? 'animate-pulse' : ''}`} />
                                        {match.streamStatus === 'Live' ? 'LIVE' : 'SOON'}
                                    </div>
                                </div>
                                <div className="p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <span className="text-primary text-sm font-bold uppercase tracking-wider">
                                            {match.sport} <span className="text-slate-500 ml-1">• {match.category || 'Men'}</span>
                                        </span>
                                        <span className="text-slate-400 text-sm flex items-center">
                                            <Calendar className="h-4 w-4 mr-1" /> {match.date}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="text-lg font-bold text-white">{match.teamA}</div>
                                        <div className="text-slate-500 font-bold px-2">VS</div>
                                        <div className="text-lg font-bold text-white text-right">{match.teamB}</div>
                                    </div>
                                    <a
                                        href={match.liveLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="block w-full bg-white/10 hover:bg-primary hover:text-black text-white text-center font-bold py-3 rounded-xl transition-all"
                                    >
                                        Watch Stream
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
