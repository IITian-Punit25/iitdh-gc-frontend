'use client';

import { useState, useEffect, useCallback } from 'react';
import Navbar from '@/components/layout/Navbar';
import { Users, Crown } from 'lucide-react';
import CustomSelect from '@/components/ui/CustomSelect';
import { io } from 'socket.io-client';

interface Member {
    name: string;
    year: string;
    branch: string;
    isCaptain: boolean;
    image: string;
}

interface Team {
    id: string;
    name: string;
    members: Member[];
}

export default function TeamsPage() {
    const [teams, setTeams] = useState<Team[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);

    const fetchTeams = useCallback(async () => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/teams`, { cache: 'no-store' });
            const data = await res.json();
            setTeams(data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching teams:', error);
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (teams.length > 0 && !selectedTeamId) {
            setSelectedTeamId(teams[0].id);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [teams]);

    useEffect(() => {
        fetchTeams();

        const socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000');

        socket.on('connect', () => {
            console.log('Connected to socket server');
        });

        socket.on('dataUpdate', (data: { type: string }) => {
            if (data.type === 'teams') {
                console.log('Teams update received, refreshing data...');
                fetchTeams();
            }
        });

        return () => {
            socket.disconnect();
        };
    }, [fetchTeams]);

    const selectedTeam = teams.find(t => t.id === selectedTeamId);

    return (
        <div className="min-h-screen bg-background text-foreground">
            <Navbar />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="mb-12 text-center">
                    <h1 className="text-4xl md:text-5xl font-black text-white mb-4 flex items-center justify-center">
                        <Users className="h-10 w-10 text-primary mr-4" />
                        Hostel Teams
                    </h1>
                    <p className="text-slate-400 text-lg max-w-2xl mx-auto">All hostel members participating in GC 25-26</p>
                </div>

                {loading ? (
                    <div className="text-center text-slate-400 py-12">Loading teams...</div>
                ) : (
                    <div className="max-w-4xl mx-auto">
                        {/* Team Selector */}
                        <div className="mb-8 flex justify-center">
                            <div className="relative w-full max-w-md">
                                <CustomSelect
                                    value={selectedTeamId || ''}
                                    onValueChange={setSelectedTeamId}
                                    options={teams.map((team) => ({ value: team.id, label: team.name }))}
                                    className="w-full text-center"
                                />
                                <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-slate-400">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        {/* Selected Team Members */}
                        {selectedTeam && (
                            <div className="bg-white/5 backdrop-blur-sm rounded-3xl border border-white/10 overflow-hidden">
                                <div className="bg-gradient-to-r from-primary/20 to-transparent px-8 py-8 border-b border-white/10 text-center">
                                    <h2 className="text-3xl font-black text-white mb-2">{selectedTeam.name}</h2>
                                    <p className="text-slate-400">{selectedTeam.members.length} Members</p>
                                </div>
                                <div className="p-8">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {selectedTeam.members.map((member: Member, idx: number) => (
                                            <div
                                                key={idx}
                                                className="flex items-center justify-between p-4 rounded-xl bg-black/20 hover:bg-white/5 transition-colors border border-white/5 group"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg overflow-hidden ${member.isCaptain ? 'bg-yellow-500/20 text-yellow-500' : 'bg-white/10 text-slate-400'}`}>
                                                        {member.image ? (
                                                            <img src={member.image} alt={member.name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            member.name.charAt(0)
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-white flex items-center gap-2 text-lg">
                                                            {member.name}
                                                            {member.isCaptain && (
                                                                <Crown className="h-4 w-4 text-yellow-500" fill="currentColor" />
                                                            )}
                                                        </div>
                                                        <div className="text-xs text-slate-500 uppercase tracking-wider font-bold">
                                                            {member.year} • {member.branch}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
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
