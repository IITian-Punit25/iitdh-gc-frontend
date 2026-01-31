'use client';

import { useState, useEffect, useCallback } from 'react';
import Navbar from '@/components/layout/Navbar';
import Loader from '@/components/ui/Loader';
import { Medal, Trophy, Play, FileText } from 'lucide-react';
import CustomSelect from '@/components/ui/CustomSelect';
import { io } from 'socket.io-client';

export default function ResultsPage() {
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [standings, setStandings] = useState({ men: [], women: [] });

    const [selectedSport, setSelectedSport] = useState(null);

    const calculateStandings = (events, teams) => {
        const scoresMen = {};
        const scoresWomen = {};

        // Initialize scores with dynamic teams filtered by category
        teams.forEach((team) => {
            if (team.category === 'Women') {
                scoresWomen[team.name] = { name: team.name, points: 0, gold: 0, silver: 0, bronze: 0 };
            } else {
                // Default to Men if category is missing or 'Men'
                scoresMen[team.name] = { name: team.name, points: 0, gold: 0, silver: 0, bronze: 0 };
            }
        });

        events.forEach((event) => {
            const { type, results, category } = event;
            let pointsMap = { first: 0, second: 0, third: 0, fourth: 0 };

            if (type === 'Standard') pointsMap = { first: 20, second: 12, third: 8, fourth: 4 };
            else if (type === 'Team') pointsMap = { first: 10, second: 6, third: 4, fourth: 2 };
            else if (type === 'Tug of War') pointsMap = { first: 5, second: 3, third: 2, fourth: 0 };

            const scores = (category === 'Women') ? scoresWomen : scoresMen;

            // Assign points
            if (results.first && scores[results.first]) {
                scores[results.first].points += pointsMap.first;
                scores[results.first].gold += 1;
            }
            if (results.second && scores[results.second]) {
                scores[results.second].points += pointsMap.second;
                scores[results.second].silver += 1;
            }
            if (results.third && scores[results.third]) {
                scores[results.third].points += pointsMap.third;
                scores[results.third].bronze += 1;
            }
            if (results.fourth && scores[results.fourth]) {
                scores[results.fourth].points += pointsMap.fourth;
            }
        });

        const sortStandings = (scores) => Object.values(scores).sort((a, b) => {
            if (b.points !== a.points) return b.points - a.points;
            return b.gold - a.gold;
        });

        return {
            men: sortStandings(scoresMen),
            women: sortStandings(scoresWomen)
        };
    };

    const fetchData = useCallback(() => {
        Promise.all([
            fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/results`, { cache: 'no-store' }).then(res => res.json()),
            fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/standings`, { cache: 'no-store' }).then(res => res.json()),
            fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/teams`, { cache: 'no-store' }).then(res => res.json())
        ]).then(([resultsData, standingsData, teamsData]) => {
            const safeResults = Array.isArray(resultsData) ? resultsData : (resultsData ? [resultsData] : []);
            setResults(safeResults);
            setStandings(calculateStandings(standingsData, teamsData));
            setLoading(false);
        }).catch((err) => {
            console.error('ResultsPage: Error fetching data:', err);
            setLoading(false);
        });
    }, []);

    useEffect(() => {
        if (results.length > 0 && !selectedSport) {
            const sports = Array.from(new Set(results.map((m) => m.sport)));
            if (sports.length > 0) {
                setSelectedSport(sports[0]);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [results]);

    useEffect(() => {
        fetchData();

        const socket = io(process.env.NEXT_PUBLIC_API_URL || '');

        socket.on('connect', () => {
            console.log('Connected to socket server');
        });

        socket.on('dataUpdate', (data) => {
            if (data.type === 'results' || data.type === 'standings' || data.type === 'teams') {
                fetchData();
            }
        });

        return () => {
            socket.disconnect();
        };
    }, [fetchData]);



    // Get unique sports
    const sports = Array.from(new Set(results.map(m => m.sport)));
    const filteredResults = results.filter(m => m.sport === selectedSport);

    return (
        <div className="min-h-screen bg-background text-foreground">
            <Navbar />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8 text-center">
                    <h1 className="text-3xl md:text-4xl font-black text-white mb-2 flex items-center justify-center">
                        <Medal className="h-8 w-8 text-primary mr-3" />
                        Results & Standings
                    </h1>
                    <p className="text-slate-400 text-base max-w-2xl mx-auto">Match results and leaderboard</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Recent Results */}
                    <div className="lg:col-span-2 space-y-4">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-white flex items-center">
                                <Trophy className="h-5 w-5 text-primary mr-2" />
                                Recent Results
                            </h2>

                            {/* Sport Selector */}
                            <div className="relative w-40">
                                <CustomSelect
                                    value={selectedSport || ''}
                                    onValueChange={setSelectedSport}
                                    options={sports.map((sport) => ({ value: sport, label: sport }))}
                                    className="w-full text-xs font-bold"
                                />
                                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-slate-400">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        {loading ? (
                            <Loader />
                        ) : filteredResults.length === 0 ? (
                            <div className="text-center py-8 bg-white/5 rounded-2xl border border-white/10">
                                <p className="text-slate-400 text-sm">No results found for this sport.</p>
                            </div>
                        ) : (
                            filteredResults.map((result) => (
                                <div
                                    key={result.id}
                                    className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4 hover:border-primary/50 transition-all"
                                >
                                    <div className="flex items-center justify-between mb-4">
                                        <span className="inline-block bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border border-primary/20">
                                            {result.sport} <span className="text-slate-500 ml-1">• {result.category || 'Men'}</span>
                                        </span>
                                        <span className="text-xs text-slate-400">{result.date}</span>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className={`text-lg font-bold ${result.winner === result.teamA ? 'text-primary' : 'text-slate-400'} flex items-center`}>
                                            {result.teamA}
                                            {result.winner === result.teamA && <Trophy className="inline h-4 w-4 ml-2 text-primary" />}
                                        </div>
                                        <div className="text-2xl font-black text-white bg-black/30 px-4 py-2 rounded-lg border border-white/5">
                                            {result.scoreA} - {result.scoreB}
                                        </div>
                                        <div className={`text-lg font-bold ${result.winner === result.teamB ? 'text-primary' : 'text-slate-400'} flex items-center`}>
                                            {result.winner === result.teamB && <Trophy className="inline h-4 w-4 mr-2 text-primary" />}
                                            {result.teamB}
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    {(result.liveLink || result.scoreSheetLink) && (
                                        <div className="flex justify-center gap-3 mt-4 pt-3 border-t border-white/5">
                                            {result.liveLink && (
                                                <a
                                                    href={result.liveLink}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className={`inline-flex items-center gap-2 px-5 py-2 rounded-full font-bold text-xs uppercase tracking-wider transition-all ${result.streamStatus === 'Live'
                                                        ? 'bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30'
                                                        : 'bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20'
                                                        }`}
                                                >
                                                    <Play className="h-3 w-3" fill="currentColor" />
                                                    Watch Stream
                                                </a>
                                            )}
                                            {result.scoreSheetLink && (
                                                <a
                                                    href={result.scoreSheetLink}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-2 px-5 py-2 rounded-full font-bold text-xs uppercase tracking-wider transition-all bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20"
                                                >
                                                    <FileText className="h-3 w-3" />
                                                    Score Sheet
                                                </a>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>

                    {/* Standings */}
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                            <Medal className="h-6 w-6 text-primary mr-2" />
                            GC Standings
                        </h2>
                        <div className="space-y-6">
                            {/* Men's Standings */}
                            <div>
                                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Men</h3>
                                <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 overflow-hidden">
                                    {standings.men.map((team, idx) => (
                                        <div
                                            key={team.name}
                                            className={`flex items-center justify-between p-3 ${idx !== standings.men.length - 1 ? 'border-b border-white/5' : ''} hover:bg-white/5 transition-colors`}
                                        >
                                            <div className="flex items-center">
                                                <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm mr-3 ${idx === 0 ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/50' :
                                                    idx === 1 ? 'bg-slate-300/20 text-slate-300 border border-slate-300/50' :
                                                        idx === 2 ? 'bg-amber-700/20 text-amber-700 border border-amber-700/50' :
                                                            'bg-slate-700/50 text-slate-500 border border-slate-600/50'
                                                    }`}>
                                                    {idx + 1}
                                                </span>
                                                <span className="font-bold text-sm text-white">{team.name}</span>
                                            </div>
                                            <span className="font-black text-lg text-primary">{team.points} <span className="text-[10px] font-normal text-slate-500">pts</span></span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Women's Standings */}
                            <div>
                                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Women</h3>
                                <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 overflow-hidden">
                                    {standings.women.map((team, idx) => (
                                        <div
                                            key={team.name}
                                            className={`flex items-center justify-between p-3 ${idx !== standings.women.length - 1 ? 'border-b border-white/5' : ''} hover:bg-white/5 transition-colors`}
                                        >
                                            <div className="flex items-center">
                                                <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm mr-3 ${idx === 0 ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/50' :
                                                    idx === 1 ? 'bg-slate-300/20 text-slate-300 border border-slate-300/50' :
                                                        idx === 2 ? 'bg-amber-700/20 text-amber-700 border border-amber-700/50' :
                                                            'bg-slate-700/50 text-slate-500 border border-slate-600/50'
                                                    }`}>
                                                    {idx + 1}
                                                </span>
                                                <span className="font-bold text-sm text-white">{team.name}</span>
                                            </div>
                                            <span className="font-black text-lg text-primary">{team.points} <span className="text-[10px] font-normal text-slate-500">pts</span></span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <footer className="border-t border-white/10 bg-black/50 py-12 mt-20">
                <div className="max-w-7xl mx-auto px-4 text-center">
                    <p className="text-slate-500">© 2025-26 IIT Dharwad Sports Council</p>
                </div>
            </footer>
        </div>
    );
}
