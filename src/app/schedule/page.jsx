'use client';

import { useState, useEffect, useCallback } from 'react';
import Navbar from '@/components/layout/Navbar';
import Loader from '@/components/ui/Loader';
import { Calendar, MapPin, Clock } from 'lucide-react';
import CustomSelect from '@/components/ui/CustomSelect';
import { io } from 'socket.io-client';

export default function SchedulePage() {
    const [schedule, setSchedule] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedSport, setSelectedSport] = useState(null);

    const fetchSchedule = useCallback(async () => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/schedule`, { cache: 'no-store' });
            const data = await res.json();
            setSchedule(data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching schedule:', error);
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (schedule.length > 0 && !selectedSport) {
            const sports = Array.from(new Set(schedule.map((m) => m.sport)));
            if (sports.length > 0) {
                setSelectedSport(sports[0]);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [schedule]);

    useEffect(() => {
        fetchSchedule();

        const socket = io(process.env.NEXT_PUBLIC_API_URL);

        socket.on('dataUpdate', (data) => {
            if (data.type === 'schedule') {
                console.log('Schedule update received, refreshing data...');
                fetchSchedule();
            }
        });

        return () => {
            socket.disconnect();
        };
    }, [fetchSchedule]);

    // Get unique sports
    const sports = Array.from(new Set(schedule.map(m => m.sport)));
    const filteredSchedule = schedule.filter(m => m.sport === selectedSport);

    return (
        <div className="min-h-screen bg-background text-foreground">
            <Navbar />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="mb-12 text-center">
                    <h1 className="text-4xl md:text-5xl font-black text-white mb-4 flex items-center justify-center">
                        <Calendar className="h-10 w-10 text-primary mr-4" />
                        Match Schedule
                    </h1>
                    <p className="text-slate-400 text-lg max-w-2xl mx-auto">Upcoming matches for GC 25-26</p>
                </div>

                {loading ? (
                    <Loader />
                ) : (
                    <div className="max-w-4xl mx-auto">
                        {/* Sport Selector */}
                        <div className="mb-8 flex justify-center">
                            <div className="relative w-full max-w-md">
                                <CustomSelect
                                    value={selectedSport || ''}
                                    onValueChange={setSelectedSport}
                                    options={sports.map((sport) => ({ value: sport, label: sport }))}
                                    className="w-full text-center"
                                />
                                <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-slate-400">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        {/* Filtered Schedule */}
                        <div className="space-y-4">
                            {filteredSchedule.length === 0 ? (
                                <div className="text-center text-slate-500 py-8">No matches scheduled for this sport.</div>
                            ) : (
                                filteredSchedule.map((match) => (
                                    <div
                                        key={match.id}
                                        className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6 hover:border-primary/50 transition-all group"
                                    >
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                            <div className="mb-4 md:mb-0">
                                                <span className="inline-block bg-primary/10 text-primary text-xs font-bold px-3 py-1 rounded-full uppercase mb-3 border border-primary/20">
                                                    {match.sport} <span className="text-slate-500 ml-1">• {match.category || 'Men'}</span>
                                                </span>
                                                <div className="text-2xl font-bold text-white group-hover:text-primary transition-colors">
                                                    {match.teamA} <span className="text-slate-500 mx-2 text-lg">vs</span> {match.teamB}
                                                </div>
                                            </div>

                                            <div className="flex flex-col md:flex-row md:items-center gap-6 text-sm text-slate-400">
                                                <div className="flex items-center bg-black/20 px-4 py-2 rounded-lg border border-white/5">
                                                    <Calendar className="h-4 w-4 mr-2 text-primary" />
                                                    {match.date}
                                                </div>
                                                <div className="flex items-center bg-black/20 px-4 py-2 rounded-lg border border-white/5">
                                                    <Clock className="h-4 w-4 mr-2 text-primary" />
                                                    {match.time}
                                                </div>
                                                <div className="flex items-center bg-black/20 px-4 py-2 rounded-lg border border-white/5">
                                                    <MapPin className="h-4 w-4 mr-2 text-primary" />
                                                    {match.venue}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </main>

            <footer className="border-t border-white/10 bg-black/50 py-12 mt-20">
                <div className="max-w-7xl mx-auto px-4 text-center">
                    <p className="text-slate-500">© 2025-26 IIT Dharwad Sports Council</p>
                </div>
            </footer>
        </div>
    );
}
