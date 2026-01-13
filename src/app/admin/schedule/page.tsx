'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import CustomSelect from '@/components/CustomSelect';
import { Save, Plus, Trash } from 'lucide-react';
import { useRouter } from 'next/navigation';

const SPORTS = [
    'Athletics',
    'Badminton',
    'Basketball',
    'Chess',
    'Cricket',
    'Football',
    'Squash',
    'Table Tennis',
    'Volleyball',
    'Weightlifting',
    'Powerlifting',
    'Tug of War'
];

const CATEGORIES = ['Men', 'Women', 'Mixed'];

export default function ManageSchedule() {
    const [schedule, setSchedule] = useState<any[]>([]);
    const [teams, setTeams] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedMatchId, setSelectedMatchId] = useState<string>("");
    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem('adminToken');
        if (!token) router.push('/admin/login');

        const fetchData = async () => {
            try {
                const [scheduleRes, teamsRes] = await Promise.all([
                    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/schedule`),
                    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/teams`)
                ]);

                const scheduleData = await scheduleRes.json();
                const teamsData = await teamsRes.json();

                setSchedule(scheduleData);
                setTeams(teamsData);
                if (scheduleData.length > 0) {
                    setSelectedMatchId(scheduleData[0].id);
                }
                setLoading(false);
            } catch (error) {
                console.error("Error fetching data:", error);
                setLoading(false);
            }
        };

        fetchData();
    }, [router]);

    const handleSave = async () => {
        for (const match of schedule) {
            if (!match.teamA || !match.teamB) {
                alert("Both Team A and Team B must be selected for all matches.");
                return;
            }
            if (match.teamA === match.teamB) {
                alert("Team A and Team B cannot be the same.");
                return;
            }
            if (!match.date || !match.time || !match.venue) {
                alert("Date, Time, and Venue are required for all matches.");
                return;
            }
        }

        await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/schedule`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(schedule),
        });
        alert('Schedule saved successfully!');
    };

    const addMatch = () => {
        const newId = Date.now().toString();
        const newMatch = {
            id: newId,
            sport: 'Football',
            category: 'Men',
            teamA: teams[0]?.name || '',
            teamB: teams[1]?.name || '',
            date: '',
            time: '',
            venue: ''
        };

        setSchedule([newMatch, ...schedule]);
        setSelectedMatchId(newId);
    };

    const updateMatch = (index: number, field: string, value: string) => {
        const newSchedule = [...schedule];
        newSchedule[index][field] = value;
        setSchedule(newSchedule);
    };

    const removeMatch = (index: number) => {
        if (confirm('Are you sure you want to delete this match?')) {
            const newSchedule = [...schedule];
            newSchedule.splice(index, 1);
            setSchedule(newSchedule);
            if (newSchedule.length > 0) {
                setSelectedMatchId(newSchedule[0].id);
            } else {
                setSelectedMatchId("");
            }
        }
    };

    if (loading) return <div className="min-h-screen bg-background flex items-center justify-center text-slate-400">Loading...</div>;

    const selectedMatchIndex = schedule.findIndex(m => m.id === selectedMatchId);
    const selectedMatch = schedule[selectedMatchIndex];

    return (
        <div className="min-h-screen bg-background text-foreground">
            <Navbar />
            <main className="max-w-7xl mx-auto px-4 py-12">
                <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
                    <div>
                        <h1 className="text-4xl font-bold text-white mb-2">Manage Schedule</h1>
                        <p className="text-slate-400">Create and edit match schedules</p>
                    </div>
                    <div className="flex space-x-4">
                        <button
                            onClick={addMatch}
                            className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-xl flex items-center transition-all border border-white/10"
                        >
                            <Plus className="h-5 w-5 mr-2" /> Add Match
                        </button>
                        <button
                            onClick={handleSave}
                            className="bg-primary hover:bg-primary/90 text-black font-bold px-6 py-3 rounded-xl flex items-center transition-all shadow-lg shadow-primary/20"
                        >
                            <Save className="h-5 w-5 mr-2" /> Save Changes
                        </button>
                    </div>
                </div>

                {/* Match Selection Dropdown */}
                <div className="mb-8">
                    <label className="text-sm text-slate-400 font-bold uppercase tracking-wider mb-2 block">Select Match to Edit</label>
                    <CustomSelect
                        value={selectedMatchId}
                        onValueChange={setSelectedMatchId}
                        placeholder="Select a Match"
                        options={schedule.map(match => ({
                            value: match.id,
                            label: `${match.sport} - ${match.teamA} vs ${match.teamB}`
                        }))}
                        className="w-full md:w-1/3"
                    />
                </div>

                {selectedMatch ? (
                    <div className="bg-white/5 backdrop-blur-sm p-6 rounded-2xl border border-white/10 flex flex-col gap-6 relative group hover:border-white/20 transition-colors">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div>
                                <label className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-2 block">Sport</label>
                                <CustomSelect
                                    value={selectedMatch.sport}
                                    onValueChange={(val) => updateMatch(selectedMatchIndex, 'sport', val)}
                                    options={SPORTS.map(s => ({ value: s, label: s }))}
                                />
                            </div>
                            <div>
                                <label className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-2 block">Category</label>
                                <CustomSelect
                                    value={selectedMatch.category || 'Men'}
                                    onValueChange={(val) => updateMatch(selectedMatchIndex, 'category', val)}
                                    options={CATEGORIES.map(c => ({ value: c, label: c }))}
                                />
                            </div>
                            <div>
                                <label className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-2 block">Date</label>
                                <input
                                    type="date"
                                    value={selectedMatch.date}
                                    onChange={(e) => updateMatch(selectedMatchIndex, 'date', e.target.value)}
                                    className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:border-primary focus:outline-none transition-colors"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-2 block">Time</label>
                                <input
                                    type="time"
                                    value={selectedMatch.time}
                                    onChange={(e) => updateMatch(selectedMatchIndex, 'time', e.target.value)}
                                    className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:border-primary focus:outline-none transition-colors"
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-4 bg-black/20 p-4 rounded-xl border border-white/5">
                            <div className="flex-1">
                                <label className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-2 block">Team A</label>
                                <CustomSelect
                                    value={selectedMatch.teamA}
                                    onValueChange={(val) => updateMatch(selectedMatchIndex, 'teamA', val)}
                                    placeholder="Select Team"
                                    options={teams.map(t => ({ value: t.name, label: t.name }))}
                                    className="bg-transparent border-b border-white/10 rounded-none p-2 text-lg font-medium"
                                />
                            </div>
                            <div className="flex items-center justify-center px-4">
                                <span className="text-slate-500 font-bold text-xl">VS</span>
                            </div>
                            <div className="flex-1 text-right">
                                <label className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-2 block">Team B</label>
                                <CustomSelect
                                    value={selectedMatch.teamB}
                                    onValueChange={(val) => updateMatch(selectedMatchIndex, 'teamB', val)}
                                    placeholder="Select Team"
                                    options={teams.map(t => ({ value: t.name, label: t.name }))}
                                    className="bg-transparent border-b border-white/10 rounded-none p-2 text-lg font-medium text-right"
                                />
                            </div>
                        </div>

                        <div className="flex justify-between items-end">
                            <div className="flex-1 max-w-md">
                                <label className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-2 block">Venue</label>
                                <input
                                    value={selectedMatch.venue}
                                    onChange={(e) => updateMatch(selectedMatchIndex, 'venue', e.target.value)}
                                    className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:border-primary focus:outline-none transition-colors"
                                    placeholder="e.g. Main Ground"
                                />
                            </div>
                            <button
                                onClick={() => removeMatch(selectedMatchIndex)}
                                className="p-3 rounded-lg text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors flex items-center gap-2"
                                title="Remove Match"
                            >
                                <Trash className="h-5 w-5" /> Delete Match
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-12 text-slate-500 bg-white/5 rounded-2xl border border-white/10">
                        {schedule.length === 0 ? "No matches scheduled. Click 'Add Match' to start." : "Select a match from the dropdown to edit."}
                    </div>
                )}
            </main>
        </div>
    );
}
