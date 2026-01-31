'use client';

import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Loader from '@/components/ui/Loader';
import { Trophy, Calendar, Medal, Image as ImageIcon, Users } from 'lucide-react';
import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

const QUICK_LINKS = [
    { href: '/teams', label: 'View Teams', icon: Users },
    { href: '/schedule', label: 'Match Schedule', icon: Calendar },
    { href: '/results', label: 'Results', icon: Medal },
    { href: '/gallery', label: 'Gallery', icon: ImageIcon },
];

export default function Home() {
    const [standings, setStandings] = useState({ men: [], women: [] });
    const [loading, setLoading] = useState(true);

    const fetchStandings = () => {
        Promise.all([
            fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/standings`, { cache: 'no-store' }).then(res => res.json()),
            fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/teams`, { cache: 'no-store' }).then(res => res.json())
        ])
            .then(([standingsData, teamsData]) => {
                const calculated = calculateStandings(standingsData, teamsData);
                setStandings(calculated);
                setLoading(false);
            })
            .catch(err => {
                console.error('Error fetching data:', err);
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchStandings();

        const socket = io(process.env.NEXT_PUBLIC_API_URL);

        socket.on('connect', () => {
            console.log('Connected to socket server');
        });

        socket.on('dataUpdate', (data) => {
            if (data.type === 'standings' || data.type === 'teams') {
                fetchStandings();
            }
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    const calculateStandings = (events, teams) => {
        const scoresMen = {};
        const scoresWomen = {};

        // Initialize scores with dynamic teams filtered by category
        teams.forEach(team => {
            if (team.category === 'Women') {
                scoresWomen[team.name] = { name: team.name, points: 0, gold: 0, silver: 0, bronze: 0 };
            } else {
                // Default to Men if category is missing or 'Men'
                scoresMen[team.name] = { name: team.name, points: 0, gold: 0, silver: 0, bronze: 0 };
            }
        });

        events.forEach(event => {
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

    return (
        <div className="min-h-screen bg-background text-foreground">
            <Navbar />

            {/* Hero Section */}
            <div className="relative pt-24 pb-12 px-4 overflow-hidden">
                {/* Background Effects */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-primary/20 blur-[120px] rounded-full pointer-events-none" />

                <div className="max-w-7xl mx-auto text-center relative z-10">

                    <h1 className="text-4xl md:text-6xl font-black mb-4 tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/60">
                        General Championship <br />
                        <span className="text-primary">2025-2026</span>
                    </h1>
                    <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto font-light">
                        IIT Dharwad's Premier Inter-Hostel Sports Tournament
                    </p>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Quick Links */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
                    {QUICK_LINKS.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className="group relative overflow-hidden bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-6 text-center hover:bg-accent/10 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-primary/10"
                        >
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4 bg-gradient-to-br from-primary/80 to-primary shadow-lg group-hover:scale-110 transition-transform duration-300">
                                <link.icon className="h-6 w-6 text-primary-foreground" />
                            </div>
                            <span className="font-bold text-base text-card-foreground group-hover:text-primary transition-colors">{link.label}</span>
                        </Link>
                    ))}
                </div>

                {loading ? (
                    <Loader />
                ) : (
                    <>
                        {/* Men's Standings Table */}
                        <div className="bg-card/50 backdrop-blur-md border border-border rounded-3xl overflow-hidden shadow-2xl mb-8">
                            <div className="px-6 py-4 border-b border-border bg-card/50 flex items-center justify-between">
                                <h2 className="text-3xl font-bold text-foreground flex items-center">
                                    <Trophy className="h-8 w-8 text-primary mr-2" />
                                    Men's GC Standings
                                </h2>
                                <div className="text-xs text-muted-foreground">Live Updates</div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="text-xs text-muted-foreground uppercase bg-card/50">
                                        <tr>
                                            <th className="px-6 py-3 font-semibold tracking-wider">Rank</th>
                                            <th className="px-6 py-3 font-semibold tracking-wider">Team</th>
                                            <th className="px-6 py-3 text-center font-semibold tracking-wider">🥇 Gold</th>
                                            <th className="px-6 py-3 text-center font-semibold tracking-wider">🥈 Silver</th>
                                            <th className="px-6 py-3 text-center font-semibold tracking-wider">🥉 Bronze</th>
                                            <th className="px-6 py-3 text-right font-semibold tracking-wider">Points</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border text-base">
                                        {standings.men.map((team, index) => (
                                            <tr key={team.name} className="hover:bg-accent/5 transition-colors group">
                                                <td className="px-6 py-4 font-bold text-foreground">
                                                    {index === 0 ? <span className="text-2xl text-chart-5">🏆</span> :
                                                        index === 1 ? <span className="text-xl text-muted-foreground">🥈</span> :
                                                            index === 2 ? <span className="text-xl text-amber-700">🥉</span> :
                                                                <span className="text-muted-foreground">#{index + 1}</span>}
                                                </td>
                                                <td className="px-6 py-4 font-bold text-lg text-foreground group-hover:text-primary transition-colors">{team.name}</td>
                                                <td className="px-6 py-4 text-center text-muted-foreground font-bold">{team.gold}</td>
                                                <td className="px-6 py-4 text-center text-muted-foreground font-bold">{team.silver}</td>
                                                <td className="px-6 py-4 text-center text-muted-foreground font-bold">{team.bronze}</td>
                                                <td className="px-6 py-4 text-right font-black text-2xl text-primary">{team.points}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Women's Standings Table */}
                        <div className="bg-card/50 backdrop-blur-md border border-border rounded-3xl overflow-hidden shadow-2xl">
                            <div className="px-6 py-4 border-b border-border bg-card/50 flex items-center justify-between">
                                <h2 className="text-3xl font-bold text-foreground flex items-center">
                                    <Trophy className="h-8 w-8 text-chart-5 mr-2" />
                                    Women's GC Standings
                                </h2>
                                <div className="text-xs text-muted-foreground">Live Updates</div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="text-xs text-muted-foreground uppercase bg-card/50">
                                        <tr>
                                            <th className="px-6 py-3 font-semibold tracking-wider">Rank</th>
                                            <th className="px-6 py-3 font-semibold tracking-wider">Team</th>
                                            <th className="px-6 py-3 text-center font-semibold tracking-wider">🥇 Gold</th>
                                            <th className="px-6 py-3 text-center font-semibold tracking-wider">🥈 Silver</th>
                                            <th className="px-6 py-3 text-center font-semibold tracking-wider">🥉 Bronze</th>
                                            <th className="px-6 py-3 text-right font-semibold tracking-wider">Points</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border text-base">
                                        {standings.women.map((team, index) => (
                                            <tr key={team.name} className="hover:bg-accent/5 transition-colors group">
                                                <td className="px-6 py-4 font-bold text-foreground">
                                                    {index === 0 ? <span className="text-2xl text-chart-5">🏆</span> :
                                                        index === 1 ? <span className="text-xl text-muted-foreground">🥈</span> :
                                                            index === 2 ? <span className="text-xl text-amber-700">🥉</span> :
                                                                <span className="text-muted-foreground">#{index + 1}</span>}
                                                </td>
                                                <td className="px-6 py-4 font-bold text-lg text-foreground group-hover:text-primary transition-colors">{team.name}</td>
                                                <td className="px-6 py-4 text-center text-muted-foreground font-bold">{team.gold}</td>
                                                <td className="px-6 py-4 text-center text-muted-foreground font-bold">{team.silver}</td>
                                                <td className="px-6 py-4 text-center text-muted-foreground font-bold">{team.bronze}</td>
                                                <td className="px-6 py-4 text-right font-black text-2xl text-primary">{team.points}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}
            </main>

            {/* Footer */}
            <footer className="border-t border-border bg-muted/50 py-12 mt-20">
                <div className="max-w-7xl mx-auto px-4 text-center">
                    <p className="text-muted-foreground">© 2025-26 IIT Dharwad Sports Council</p>
                </div>
            </footer>
        </div>
    );
}
