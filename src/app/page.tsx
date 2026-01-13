'use client';

import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { Trophy, Calendar, Medal, Image as ImageIcon, Users } from 'lucide-react';
import { useState, useEffect } from 'react';

const QUICK_LINKS = [
  { href: '/teams', label: 'View Teams', icon: Users },
  { href: '/schedule', label: 'Match Schedule', icon: Calendar },
  { href: '/results', label: 'Results', icon: Medal },
  { href: '/gallery', label: 'Gallery', icon: ImageIcon },
];

export default function Home() {
  const [standings, setStandings] = useState<{ men: any[], women: any[] }>({ men: [], women: [] });

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/standings`, { cache: 'no-store' })
      .then(res => res.json())
      .then(data => {
        const calculated = calculateStandings(data);
        setStandings(calculated);
      });
  }, []);

  const calculateStandings = (events: any[]) => {
    const scoresMen: any = {};
    const scoresWomen: any = {};

    // Initialize scores
    ['Hostel 1', 'Hostel 2', 'Hostel 3', 'Hostel 4'].forEach(h => {
      scoresMen[h] = { name: h, points: 0, gold: 0, silver: 0, bronze: 0 };
      scoresWomen[h] = { name: h, points: 0, gold: 0, silver: 0, bronze: 0 };
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

    const sortStandings = (scores: any) => Object.values(scores).sort((a: any, b: any) => {
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

          <h1 className="text-4xl md:text-6xl font-black mb-4 tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60">
            General Championship <br />
            <span className="text-primary">2025-2026</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-400 mb-8 max-w-2xl mx-auto font-light">
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
              className="group relative overflow-hidden bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 text-center hover:bg-white/10 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-primary/10"
            >
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4 bg-gradient-to-br from-primary/80 to-primary shadow-lg group-hover:scale-110 transition-transform duration-300">
                <link.icon className="h-6 w-6 text-black" />
              </div>
              <span className="font-bold text-base text-slate-200 group-hover:text-white transition-colors">{link.label}</span>
            </Link>
          ))}
        </div>

        {/* Men's Standings Table */}
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl overflow-hidden shadow-2xl mb-8">
          <div className="px-6 py-4 border-b border-white/10 bg-white/5 flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center">
              <Trophy className="h-5 w-5 text-primary mr-2" />
              Men's GC Standings
            </h2>
            <div className="text-xs text-slate-400">Live Updates</div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="text-[10px] text-slate-400 uppercase bg-white/5">
                <tr>
                  <th className="px-6 py-3 font-semibold tracking-wider">Rank</th>
                  <th className="px-6 py-3 font-semibold tracking-wider">Team</th>
                  <th className="px-6 py-3 text-center font-semibold tracking-wider">🥇 Gold</th>
                  <th className="px-6 py-3 text-center font-semibold tracking-wider">🥈 Silver</th>
                  <th className="px-6 py-3 text-center font-semibold tracking-wider">🥉 Bronze</th>
                  <th className="px-6 py-3 text-right font-semibold tracking-wider">Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm">
                {standings.men.map((team, index) => (
                  <tr key={team.name} className="hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-4 font-bold text-white">
                      {index === 0 ? <span className="text-xl">🏆</span> :
                        index === 1 ? <span className="text-lg text-slate-300">🥈</span> :
                          index === 2 ? <span className="text-lg text-amber-700">🥉</span> :
                            <span className="text-slate-500">#{index + 1}</span>}
                    </td>
                    <td className="px-6 py-4 font-bold text-white group-hover:text-primary transition-colors">{team.name}</td>
                    <td className="px-6 py-4 text-center text-slate-300 font-medium">{team.gold}</td>
                    <td className="px-6 py-4 text-center text-slate-300 font-medium">{team.silver}</td>
                    <td className="px-6 py-4 text-center text-slate-300 font-medium">{team.bronze}</td>
                    <td className="px-6 py-4 text-right font-black text-lg text-primary">{team.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Women's Standings Table */}
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
          <div className="px-6 py-4 border-b border-white/10 bg-white/5 flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center">
              <Trophy className="h-5 w-5 text-pink-500 mr-2" />
              Women's GC Standings
            </h2>
            <div className="text-xs text-slate-400">Live Updates</div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="text-[10px] text-slate-400 uppercase bg-white/5">
                <tr>
                  <th className="px-6 py-3 font-semibold tracking-wider">Rank</th>
                  <th className="px-6 py-3 font-semibold tracking-wider">Team</th>
                  <th className="px-6 py-3 text-center font-semibold tracking-wider">🥇 Gold</th>
                  <th className="px-6 py-3 text-center font-semibold tracking-wider">🥈 Silver</th>
                  <th className="px-6 py-3 text-center font-semibold tracking-wider">🥉 Bronze</th>
                  <th className="px-6 py-3 text-right font-semibold tracking-wider">Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm">
                {standings.women.map((team, index) => (
                  <tr key={team.name} className="hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-4 font-bold text-white">
                      {index === 0 ? <span className="text-xl">🏆</span> :
                        index === 1 ? <span className="text-lg text-slate-300">🥈</span> :
                          index === 2 ? <span className="text-lg text-amber-700">🥉</span> :
                            <span className="text-slate-500">#{index + 1}</span>}
                    </td>
                    <td className="px-6 py-4 font-bold text-white group-hover:text-primary transition-colors">{team.name}</td>
                    <td className="px-6 py-4 text-center text-slate-300 font-medium">{team.gold}</td>
                    <td className="px-6 py-4 text-center text-slate-300 font-medium">{team.silver}</td>
                    <td className="px-6 py-4 text-center text-slate-300 font-medium">{team.bronze}</td>
                    <td className="px-6 py-4 text-right font-black text-lg text-primary">{team.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-black/50 py-12 mt-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-slate-500">© 2025-26 IIT Dharwad Sports Council</p>
        </div>
      </footer>
    </div>
  );
}
