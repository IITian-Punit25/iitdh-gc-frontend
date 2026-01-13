'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import { Save, Plus, Trash, Trophy, ChevronDown, RotateCcw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import * as Select from '@radix-ui/react-select';

interface Results {
    first: string;
    second: string;
    third: string;
    fourth: string;
}

interface Standing {
    id: string;
    sport: string;
    type: string;
    category: string;
    results: Results;
}

interface Team {
    id: string;
    name: string;
}

export default function ManageStandings() {
    const [standings, setStandings] = useState<Standing[]>([]);
    const [loading, setLoading] = useState(true);
    const [teams, setTeams] = useState<Team[]>([]);
    const [selectedSport, setSelectedSport] = useState<string>("");
    const [selectedCategory, setSelectedCategory] = useState<string>("");
    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem('adminToken');
        if (!token) router.push('/admin/login');

        Promise.all([
            fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/standings`).then(res => res.json()),
            fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/teams`).then(res => res.json())
        ]).then(([standingsData, teamsData]) => {
            setStandings(standingsData);
            setTeams(teamsData);
            // Auto-select first sport if available
            const sports = [...new Set(standingsData.map((e: Standing) => e.sport))].filter(Boolean) as string[];
            if (sports.length > 0) {
                setSelectedSport(sports[0]);
                const firstSportEvents = standingsData.filter((e: Standing) => e.sport === sports[0]);
                if (firstSportEvents.length > 0) {
                    setSelectedCategory(firstSportEvents[0].category || 'Men');
                }
            }
            setLoading(false);
        }).catch((err) => {
            console.error("Failed to fetch data:", err);
            setLoading(false);
            alert("Failed to load data. Ensure backend is running.");
        });
    }, [router]);

    const handleSave = async () => {
        for (const event of standings) {
            if (!event.sport) {
                alert("Sport Name is required for all events.");
                return;
            }
        }

        try {
            await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/standings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(standings),
            });
            alert('Standings saved successfully!');
        } catch (error) {
            console.error('Error saving standings:', error);
            alert('Failed to save standings.');
        }
    };

    const addEvent = () => {
        const newId = Date.now().toString();
        const newEvent: Standing = {
            id: newId,
            sport: '',
            type: 'Team', // Standard, Team, Tug of War
            category: 'Men',
            results: { first: '', second: '', third: '', fourth: '' }
        };

        setStandings([newEvent, ...standings]);
        setSelectedSport('');
        setSelectedCategory('Men');
    };

    const updateEvent = (index: number, field: string, value: string) => {
        setStandings(prevStandings => {
            const newStandings = [...prevStandings];
            // Create a shallow copy of the event being updated
            newStandings[index] = { ...newStandings[index] };

            if (field.includes('.')) {
                const [parent, child] = field.split('.') as [keyof Standing, keyof Results];
                if (parent === 'results') {
                    // Create a shallow copy of the results object
                    newStandings[index].results = { ...newStandings[index].results, [child]: value };
                }
            } else {
                (newStandings[index] as unknown as Record<string, string>)[field] = value;
            }
            return newStandings;
        });
    };

    const removeEvent = (index: number) => {
        if (confirm('Delete this event?')) {
            setStandings(prevStandings => {
                const newStandings = [...prevStandings];
                newStandings.splice(index, 1);

                // Reset selection
                const sports = [...new Set(newStandings.map(e => e.sport))].filter(Boolean) as string[];
                if (sports.length > 0) {
                    setSelectedSport(sports[0]);
                    const firstSportEvents = newStandings.filter(e => e.sport === sports[0]);
                    if (firstSportEvents.length > 0) {
                        setSelectedCategory(firstSportEvents[0].category || 'Men');
                    }
                } else {
                    setSelectedSport('');
                    setSelectedCategory('');
                }
                return newStandings;
            });
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-400">Loading...</div>;

    // Get unique sports
    const uniqueSports = [...new Set(standings.map(e => e.sport))].filter(Boolean) as string[];

    // Get categories available for selected sport
    const categoriesForSport = selectedSport
        ? [...new Set(standings.filter(e => e.sport === selectedSport).map(e => e.category))]
        : [];

    // Find the selected event based on sport and category
    const selectedEvent = standings.find(e => e.sport === selectedSport && e.category === selectedCategory);
    const selectedEventIndex = selectedEvent ? standings.findIndex(e => e.id === selectedEvent.id) : -1;

    // Handle sport change
    const handleSportChange = (sport: string) => {
        setSelectedSport(sport);
        const categories = [...new Set(standings.filter(e => e.sport === sport).map(e => e.category))];
        if (categories.length > 0) {
            setSelectedCategory(categories[0]);
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground">
            <Navbar />
            <main className="max-w-7xl mx-auto px-4 py-12">
                <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
                    <div>
                        <h1 className="text-4xl font-bold text-white mb-2">Manage Standings</h1>
                        <p className="text-slate-400">Enter final results for GC Points Calculation</p>
                    </div>
                    <div className="flex gap-4">
                        <button
                            onClick={addEvent}
                            className="bg-white/10 hover:bg-white/20 text-white font-bold px-6 py-3 rounded-xl flex items-center transition-all border border-white/10"
                        >
                            <Plus className="h-5 w-5 mr-2" />
                            Add Event
                        </button>
                        <button
                            onClick={handleSave}
                            className="bg-primary hover:bg-primary/90 text-black font-bold px-6 py-3 rounded-xl flex items-center transition-all shadow-lg shadow-primary/20"
                        >
                            <Save className="h-5 w-5 mr-2" />
                            Save Changes
                        </button>
                    </div>
                </div>

                {/* Event Selection - Two Step */}
                <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Step 1: Select Sport */}
                    <div>
                        <label className="text-sm text-slate-400 font-bold uppercase tracking-wider mb-2 block">1. Select Sport</label>
                        <Select.Root value={selectedSport} onValueChange={handleSportChange}>
                            <Select.Trigger className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white focus:border-primary focus:outline-none flex justify-between items-center text-lg font-medium hover:bg-white/5 transition-colors">
                                <Select.Value placeholder="Select a Sport" />
                                <Select.Icon>
                                    <ChevronDown className="h-5 w-5 opacity-50" />
                                </Select.Icon>
                            </Select.Trigger>
                            <Select.Portal>
                                <Select.Content className="overflow-hidden bg-slate-900 border border-white/10 rounded-xl shadow-xl z-50 max-h-[300px] w-[var(--radix-select-trigger-width)]">
                                    <Select.Viewport className="p-1">
                                        {uniqueSports.map(sport => (
                                            <Select.Item
                                                key={sport}
                                                value={sport}
                                                className="text-white text-base p-3 rounded-lg hover:bg-white/10 outline-none cursor-pointer flex items-center relative select-none data-[highlighted]:bg-white/10 data-[highlighted]:text-primary"
                                            >
                                                <Select.ItemText>{sport}</Select.ItemText>
                                            </Select.Item>
                                        ))}
                                    </Select.Viewport>
                                </Select.Content>
                            </Select.Portal>
                        </Select.Root>
                    </div>

                    {/* Step 2: Select Category */}
                    <div>
                        <label className="text-sm text-slate-400 font-bold uppercase tracking-wider mb-2 block">2. Select Category</label>
                        <Select.Root
                            value={selectedCategory}
                            onValueChange={setSelectedCategory}
                            disabled={!selectedSport || categoriesForSport.length === 0}
                        >
                            <Select.Trigger className={`w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white focus:border-primary focus:outline-none flex justify-between items-center text-lg font-medium transition-colors ${!selectedSport ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/5'}`}>
                                <Select.Value placeholder="Select Category" />
                                <Select.Icon>
                                    <ChevronDown className="h-5 w-5 opacity-50" />
                                </Select.Icon>
                            </Select.Trigger>
                            <Select.Portal>
                                <Select.Content className="overflow-hidden bg-slate-900 border border-white/10 rounded-xl shadow-xl z-50 max-h-[300px] w-[var(--radix-select-trigger-width)]">
                                    <Select.Viewport className="p-1">
                                        {categoriesForSport.map(cat => (
                                            <Select.Item
                                                key={cat}
                                                value={cat}
                                                className="text-white text-base p-3 rounded-lg hover:bg-white/10 outline-none cursor-pointer flex items-center relative select-none data-[highlighted]:bg-white/10 data-[highlighted]:text-primary"
                                            >
                                                <Select.ItemText>{cat}</Select.ItemText>
                                            </Select.Item>
                                        ))}
                                    </Select.Viewport>
                                </Select.Content>
                            </Select.Portal>
                        </Select.Root>
                    </div>
                </div>

                {selectedEvent ? (
                    <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden">
                        {/* Header with Sport & Type */}
                        <div className="bg-black/30 p-6 border-b border-white/10">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                                        <Trophy className="h-6 w-6 text-primary" />
                                    </div>
                                    <div>
                                        <input
                                            value={selectedEvent.sport}
                                            onChange={(e) => updateEvent(selectedEventIndex, 'sport', e.target.value)}
                                            className="bg-transparent text-2xl font-bold text-white focus:outline-none border-b border-transparent focus:border-primary transition-colors w-full"
                                            placeholder="Enter Sport Name"
                                        />
                                        <p className="text-slate-400 text-sm mt-1">{selectedCategory} • {selectedEvent.type}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <select
                                        value={selectedEvent.type}
                                        onChange={(e) => updateEvent(selectedEventIndex, 'type', e.target.value)}
                                        className="bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white text-sm focus:border-primary focus:outline-none appearance-none cursor-pointer"
                                    >
                                        <option value="Team">Team Sport</option>
                                        <option value="Standard">Standard (Athletics)</option>
                                        <option value="Tug of War">Tug of War</option>
                                    </select>
                                    <button
                                        onClick={() => removeEvent(selectedEventIndex)}
                                        className="text-red-500 hover:text-red-400 p-2 rounded-lg hover:bg-red-500/10 transition-colors"
                                        title="Delete Event"
                                    >
                                        <Trash className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Podium Results */}
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm text-slate-400 font-bold uppercase tracking-wider">Final Standings</h3>
                                <button
                                    onClick={() => {
                                        updateEvent(selectedEventIndex, 'results.first', '');
                                        updateEvent(selectedEventIndex, 'results.second', '');
                                        updateEvent(selectedEventIndex, 'results.third', '');
                                        updateEvent(selectedEventIndex, 'results.fourth', '');
                                    }}
                                    className="text-xs text-slate-400 hover:text-white flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-white/10 transition-all"
                                >
                                    <RotateCcw className="h-3 w-3" />
                                    Reset
                                </button>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {[
                                    { pos: 'first', label: '1st Place', color: 'from-yellow-500/20 to-yellow-600/10', border: 'border-yellow-500/30', icon: 'text-yellow-400' },
                                    { pos: 'second', label: '2nd Place', color: 'from-slate-400/20 to-slate-500/10', border: 'border-slate-400/30', icon: 'text-slate-300' },
                                    { pos: 'third', label: '3rd Place', color: 'from-amber-700/20 to-amber-800/10', border: 'border-amber-700/30', icon: 'text-amber-600' },
                                    { pos: 'fourth', label: '4th Place', color: 'from-white/5 to-white/0', border: 'border-white/10', icon: 'text-slate-500' }
                                ].map((item) => {
                                    // Get teams already selected in other positions
                                    const selectedTeams = ['first', 'second', 'third', 'fourth']
                                        .filter(p => p !== item.pos)
                                        .map(p => selectedEvent.results[p as keyof Results])
                                        .filter(Boolean);

                                    // Filter available teams (exclude already selected, but keep current selection)
                                    const availableTeams = teams.filter(t =>
                                        !selectedTeams.includes(t.name) ||
                                        t.name === selectedEvent.results[item.pos as keyof Results]
                                    );

                                    return (
                                        <div key={item.pos} className={`bg-gradient-to-b ${item.color} rounded-xl border ${item.border} p-4 transition-all hover:scale-[1.02]`}>
                                            <div className="flex items-center gap-2 mb-3">
                                                <Trophy className={`h-4 w-4 ${item.icon}`} />
                                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{item.label}</span>
                                            </div>
                                            <select
                                                value={selectedEvent.results[item.pos as keyof Results] || ''}
                                                onChange={(e) => updateEvent(selectedEventIndex, `results.${item.pos}`, e.target.value)}
                                                className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white font-medium focus:border-primary focus:outline-none appearance-none cursor-pointer"
                                            >
                                                <option value="">Select Team</option>
                                                {availableTeams.map(t => (
                                                    <option key={t.id} value={t.name}>{t.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-16 bg-white/5 rounded-2xl border border-white/10">
                        <Trophy className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                        <p className="text-slate-400 text-lg">
                            {standings.length === 0 ? "No events added. Click 'Add Event' to start." : "Select a sport and category above to edit standings."}
                        </p>
                    </div>
                )}
            </main>
        </div>
    );
}
