'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { Save, Plus, Trash, Trophy, ChevronDown } from 'lucide-react';
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
    const [selectedEventId, setSelectedEventId] = useState<string>("");
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
            if (standingsData.length > 0) {
                setSelectedEventId(standingsData[0].id);
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
        setSelectedEventId(newId);
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

                if (newStandings.length > 0) {
                    setTimeout(() => {
                        if (newStandings.length > 0) {
                            setSelectedEventId(newStandings[0].id);
                        } else {
                            setSelectedEventId("");
                        }
                    }, 0);
                } else {
                    setTimeout(() => setSelectedEventId(""), 0);
                }
                return newStandings;
            });
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-400">Loading...</div>;

    const selectedEventIndex = standings.findIndex(e => e.id === selectedEventId);
    const selectedEvent = standings[selectedEventIndex];

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

                {/* Event Selection Dropdown */}
                <div className="mb-8">
                    <label className="text-sm text-slate-400 font-bold uppercase tracking-wider mb-2 block">Select Event to Edit</label>
                    <Select.Root value={selectedEventId} onValueChange={setSelectedEventId}>
                        <Select.Trigger className="w-full md:w-1/3 bg-black/40 border border-white/10 rounded-xl p-4 text-white focus:border-primary focus:outline-none flex justify-between items-center text-lg font-medium hover:bg-white/5 transition-colors">
                            <Select.Value placeholder="Select an Event" />
                            <Select.Icon>
                                <ChevronDown className="h-5 w-5 opacity-50" />
                            </Select.Icon>
                        </Select.Trigger>
                        <Select.Portal>
                            <Select.Content className="overflow-hidden bg-slate-900 border border-white/10 rounded-xl shadow-xl z-50 max-h-[300px] w-[var(--radix-select-trigger-width)]">
                                <Select.Viewport className="p-1">
                                    {standings.map(event => (
                                        <Select.Item
                                            key={event.id}
                                            value={event.id}
                                            className="text-white text-base p-3 rounded-lg hover:bg-white/10 outline-none cursor-pointer flex items-center relative select-none data-[highlighted]:bg-white/10 data-[highlighted]:text-primary"
                                        >
                                            <Select.ItemText>
                                                {event.sport || 'New Event'} {event.category ? `(${event.category})` : ''}
                                            </Select.ItemText>
                                        </Select.Item>
                                    ))}
                                </Select.Viewport>
                            </Select.Content>
                        </Select.Portal>
                    </Select.Root>
                </div>

                {selectedEvent ? (
                    <div className="bg-white/5 backdrop-blur-sm p-6 rounded-2xl border border-white/10 hover:border-primary/30 transition-all">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                            <div className="md:col-span-3 space-y-2">
                                <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">Sport Name</label>
                                <input
                                    value={selectedEvent.sport}
                                    onChange={(e) => updateEvent(selectedEventIndex, 'sport', e.target.value)}
                                    className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:border-primary focus:outline-none"
                                    placeholder="e.g. Cricket"
                                />
                            </div>
                            <div className="md:col-span-2 space-y-2">
                                <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">Type</label>
                                <select
                                    value={selectedEvent.type}
                                    onChange={(e) => updateEvent(selectedEventIndex, 'type', e.target.value)}
                                    className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:border-primary focus:outline-none appearance-none cursor-pointer"
                                >
                                    <option value="Team">Team Sport</option>
                                    <option value="Standard">Standard (Athletics)</option>
                                    <option value="Tug of War">Tug of War</option>
                                </select>
                            </div>
                            <div className="md:col-span-2 space-y-2">
                                <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">Category</label>
                                <select
                                    value={selectedEvent.category || 'Men'}
                                    onChange={(e) => updateEvent(selectedEventIndex, 'category', e.target.value)}
                                    className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:border-primary focus:outline-none appearance-none cursor-pointer"
                                >
                                    <option value="Men">Men</option>
                                    <option value="Women">Women</option>
                                    <option value="Mixed">Mixed</option>
                                </select>
                            </div>

                            <div className="md:col-span-6 grid grid-cols-2 md:grid-cols-4 gap-2">
                                {['first', 'second', 'third', 'fourth'].map((pos, i) => (
                                    <div key={pos} className="space-y-2">
                                        <label className="text-xs text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                                            {i === 0 && <Trophy className="h-3 w-3 text-yellow-400" />}
                                            {i === 1 && <Trophy className="h-3 w-3 text-slate-400" />}
                                            {i === 2 && <Trophy className="h-3 w-3 text-amber-700" />}
                                            {i + 1}{i === 0 ? 'st' : i === 1 ? 'nd' : i === 2 ? 'rd' : 'th'}
                                        </label>
                                        <select
                                            value={selectedEvent.results[pos as keyof Results] || ''}
                                            onChange={(e) => updateEvent(selectedEventIndex, `results.${pos}`, e.target.value)}
                                            className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-sm text-white focus:border-primary focus:outline-none appearance-none cursor-pointer"
                                        >
                                            <option value="">Select</option>
                                            {teams.map(t => (
                                                <option key={t.id} value={t.name}>{t.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                ))}
                            </div>

                            <div className="md:col-span-1 flex justify-end pb-2">
                                <button
                                    onClick={() => removeEvent(selectedEventIndex)}
                                    className="text-red-500 hover:text-red-400 p-2 rounded-lg hover:bg-red-500/10 transition-colors"
                                >
                                    <Trash className="h-5 w-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-12 text-slate-500 bg-white/5 rounded-2xl border border-white/10">
                        {standings.length === 0 ? "No events added. Click 'Add Event' to start." : "Select an event from the dropdown to edit."}
                    </div>
                )}
            </main>
        </div>
    );
}
