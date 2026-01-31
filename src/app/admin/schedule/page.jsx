'use client';

import { useState, useEffect, useCallback } from 'react';
import Navbar from '@/components/layout/Navbar';
import Loader from '@/components/ui/Loader';
import CustomSelect from '@/components/ui/CustomSelect';
import { Save, Plus, Trash, Calendar, Clock, MapPin } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import PasswordModal from '@/components/ui/PasswordModal';

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

// Common venues - admin can still type custom
const VENUES = [
    'Main Ground',
    'Basketball Court',
    'Football Ground',
    'Cricket Ground',
    'Indoor Stadium',
    'Badminton Court',
    'Volleyball Court',
    'Table Tennis Room',
    'Chess Room',
    'Gym/Weightlifting Room'
];

export default function ManageSchedule() {
    const [schedule, setSchedule] = useState([]);
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [selectedMatchId, setSelectedMatchId] = useState("");
    const [filterSport, setFilterSport] = useState("All");
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [confirmCallback, setConfirmCallback] = useState(null);
    const router = useRouter();

    const handleLogout = useCallback(async () => {
        await api.logout();
        router.push('/admin/login');
    }, [router]);

    useEffect(() => {
        const token = localStorage.getItem('adminToken');
        if (!token) {
            router.push('/admin/login');
            return;
        }

        const fetchData = async () => {
            try {
                const [scheduleData, teamsData] = await Promise.all([
                    api.get('/api/schedule'),
                    api.get('/api/teams')
                ]);

                // Ensure all matches have required fields
                const sanitizedSchedule = scheduleData.map((match) => ({
                    ...match,
                    date: match.date || '',
                    time: match.time || '',
                    venue: match.venue || '',
                    category: match.category || 'Men'
                }));

                setSchedule(sanitizedSchedule);
                setTeams(teamsData);
                if (sanitizedSchedule.length > 0) {
                    setSelectedMatchId(sanitizedSchedule[0].id);
                }
                setLoading(false);
            } catch (err) {
                console.error("Error fetching data:", err);
                if (err.status === 401 || err.status === 403) {
                    handleLogout();
                }
                setLoading(false);
            }
        };

        fetchData();
    }, [router, handleLogout]);

    const handleSaveClick = async () => {
        for (const match of schedule) {
            if (!match.teamA || !match.teamB) {
                alert(`Match between ${match.teamA || 'Unknown'} and ${match.teamB || 'Unknown'} must have both teams selected.`);
                return;
            }
            if (match.teamA === match.teamB) {
                alert(`Team A and Team B cannot be the same for match between ${match.teamA} and ${match.teamB}.`);
                return;
            }
            if (!match.date || !match.time || !match.venue) {
                alert(`Date, Time, and Venue are required for match between ${match.teamA} and ${match.teamB} (${match.sport}).`);
                return;
            }
        }

        setConfirmCallback(() => executeSave);
        setIsPasswordModalOpen(true);
    };

    const executeSave = async (password) => {
        setSaving(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/schedule`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
                    'x-admin-password': password
                },
                body: JSON.stringify(schedule)
            });

            if (res.ok) {
                alert('Schedule saved successfully!');
                return true;
            } else {
                if (res.status === 401 || res.status === 403) return false;
                alert('Failed to save schedule.');
                return true;
            }
        } catch (error) {
            console.error('Error saving schedule:', error);
            alert('Failed to save schedule.');
            return true;
        } finally {
            setSaving(false);
        }
    };

    const addMatch = () => {
        const newId = Date.now().toString();
        // Smart defaults: copy date/time/venue from last match if exists
        const lastMatch = schedule[0];
        const newMatch = {
            id: newId,
            sport: lastMatch?.sport || 'Football',
            category: lastMatch?.category || 'Men',
            teamA: teams[0]?.name || '',
            teamB: teams[1]?.name || '',
            date: lastMatch?.date || '',   // Copy from last
            time: lastMatch?.time || '',   // Copy from last  
            venue: lastMatch?.venue || ''  // Copy from last
        };

        setSchedule([newMatch, ...schedule]);
        setSelectedMatchId(newId);
    };

    // Duplicate selected match with new ID
    const duplicateMatch = () => {
        const selectedMatchIndex = schedule.findIndex(m => m.id === selectedMatchId);
        const selectedMatch = schedule[selectedMatchIndex];

        if (!selectedMatch) return;
        const newId = Date.now().toString();
        const newMatch = {
            ...selectedMatch,
            id: newId,
            teamA: teams[0]?.name || '',
            teamB: teams[1]?.name || ''
        };
        setSchedule([newMatch, ...schedule]);
        setSelectedMatchId(newId);
    };

    const updateMatch = (index, field, value) => {
        setSchedule(prevSchedule => {
            const newSchedule = [...prevSchedule];
            newSchedule[index] = { ...newSchedule[index], [field]: value };
            return newSchedule;
        });
    };

    const removeMatchClick = (index) => {
        if (index === -1) return;
        setConfirmCallback(() => (password) => executeRemoveMatch(index, password));
        setIsPasswordModalOpen(true);
    };

    const executeRemoveMatch = async (index, password) => {
        const newSchedule = [...schedule];
        newSchedule.splice(index, 1);

        setSaving(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/schedule`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
                    'x-admin-password': password
                },
                body: JSON.stringify(newSchedule)
            });

            if (res.ok) {
                setSchedule(newSchedule);

                // Determine next selection
                let nextMatch = newSchedule[index];
                if (!nextMatch) {
                    nextMatch = newSchedule[index - 1];
                }

                if (nextMatch) {
                    if (filterSport === "All" || nextMatch.sport === filterSport) {
                        setSelectedMatchId(nextMatch.id);
                    } else {
                        const visibleMatches = newSchedule.filter(m => m.sport === filterSport);
                        setSelectedMatchId(visibleMatches.length > 0 ? visibleMatches[0].id : "");
                    }
                } else {
                    setSelectedMatchId("");
                }

                alert('Match deleted successfully!');
                return true;
            } else {
                if (res.status === 401 || res.status === 403) return false;
                alert('Failed to delete match.');
                return true;
            }
        } catch (error) {
            console.error('Error deleting match:', error);
            alert('Failed to delete match.');
            return true;
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <Loader />;

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
                        {selectedMatch && (
                            <button
                                onClick={duplicateMatch}
                                className="bg-white/5 hover:bg-white/10 text-white px-4 py-3 rounded-xl flex items-center transition-all border border-white/10"
                                title="Duplicate selected match"
                            >
                                <Plus className="h-4 w-4 mr-1" /> Duplicate
                            </button>
                        )}
                        <button
                            onClick={handleSaveClick}
                            disabled={saving}
                            className="bg-primary hover:bg-primary/90 text-black font-bold px-6 py-3 rounded-xl flex items-center transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {saving ? (
                                <>
                                    <div className="h-5 w-5 mr-2 border-2 border-black border-t-transparent rounded-full animate-spin" /> Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="h-5 w-5 mr-2" /> Save Changes
                                </>
                            )}
                        </button>
                    </div>
                </div>

                <PasswordModal
                    isOpen={isPasswordModalOpen}
                    onClose={() => setIsPasswordModalOpen(false)}
                    onConfirm={(password) => confirmCallback ? confirmCallback(password) : Promise.resolve(false)}
                    onExceededAttempts={handleLogout}
                />

                {/* Match Selection - Two Step */}
                <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Step 1: Filter by Sport */}
                    <div>
                        <label className="text-sm text-slate-400 font-bold uppercase tracking-wider mb-2 block">1. Filter by Sport</label>
                        <CustomSelect
                            value={filterSport}
                            onValueChange={(val) => {
                                setFilterSport(val);
                                // Auto-select first match of this sport
                                const matches = val === "All" ? schedule : schedule.filter(m => m.sport === val);
                                if (matches.length > 0) {
                                    setSelectedMatchId(matches[0].id);
                                } else {
                                    setSelectedMatchId("");
                                }
                            }}
                            placeholder="All Sports"
                            options={[
                                { value: "All", label: "All Sports" },
                                ...SPORTS.filter(s => schedule.some(m => m.sport === s)).map(s => ({ value: s, label: s }))
                            ]}
                        />
                    </div>
                    {/* Step 2: Select Match */}
                    <div className="md:col-span-2">
                        <label className="text-sm text-slate-400 font-bold uppercase tracking-wider mb-2 block">2. Select Match</label>
                        <CustomSelect
                            value={selectedMatchId}
                            onValueChange={setSelectedMatchId}
                            placeholder="Select a Match"
                            options={(filterSport === "All" ? schedule : schedule.filter(m => m.sport === filterSport)).map((match) => ({
                                value: match.id,
                                label: `${match.teamA} vs ${match.teamB} (${match.category === 'Women' ? 'W' : match.category === 'Men' ? 'M' : 'X'})${match.date ? ` • ${new Date(match.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : ''}`
                            }))}
                        />
                        <p className="text-xs text-slate-500 mt-2">(M) = Men • (W) = Women • (X) = Mixed</p>
                    </div>
                </div>

                {
                    selectedMatch ? (
                        <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden">
                            {/* Header */}
                            <div className="bg-black/30 p-6 border-b border-white/10">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                                            <Calendar className="h-6 w-6 text-primary" />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-bold text-white">{selectedMatch.sport}</h2>
                                            <p className="text-slate-400 text-sm mt-1">{selectedMatch.category} • {selectedMatch.teamA} vs {selectedMatch.teamB}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => removeMatchClick(selectedMatchIndex)}
                                        className="text-red-500 hover:text-red-400 p-2 rounded-lg hover:bg-red-500/10 transition-colors flex items-center gap-2"
                                        title="Delete Match"
                                    >
                                        <Trash className="h-5 w-5" />
                                        <span className="hidden md:inline">Delete</span>
                                    </button>
                                </div>
                            </div>

                            {/* Match Details */}
                            <div className="p-6 space-y-6">
                                {/* Sport & Category */}
                                <div>
                                    <h3 className="text-sm text-slate-400 font-bold uppercase tracking-wider mb-4">Event Details</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                        <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                                            <label className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-2 block">Sport</label>
                                            <CustomSelect
                                                value={selectedMatch.sport}
                                                onValueChange={(val) => updateMatch(selectedMatchIndex, 'sport', val)}
                                                options={SPORTS.map(s => ({ value: s, label: s }))}
                                            />
                                        </div>
                                        <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                                            <label className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-2 block">Category</label>
                                            <CustomSelect
                                                value={selectedMatch.category || 'Men'}
                                                onValueChange={(val) => updateMatch(selectedMatchIndex, 'category', val)}
                                                options={CATEGORIES.map(c => ({ value: c, label: c }))}
                                            />
                                        </div>
                                        <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                                            <label className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-2 block flex items-center gap-1">
                                                <Calendar className="h-3 w-3" /> Date
                                            </label>
                                            <input
                                                type="date"
                                                value={selectedMatch.date || ''}
                                                onChange={(e) => updateMatch(selectedMatchIndex, 'date', e.target.value)}
                                                className="w-full bg-black/30 border border-white/10 rounded-lg p-3 text-white focus:border-primary focus:outline-none transition-colors"
                                            />
                                        </div>
                                        <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                                            <label className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-2 block flex items-center gap-1">
                                                <Clock className="h-3 w-3" /> Time
                                            </label>
                                            <input
                                                type="time"
                                                value={selectedMatch.time || ''}
                                                onChange={(e) => updateMatch(selectedMatchIndex, 'time', e.target.value)}
                                                className="w-full bg-black/30 border border-white/10 rounded-lg p-3 text-white focus:border-primary focus:outline-none transition-colors"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Teams */}
                                <div>
                                    <h3 className="text-sm text-slate-400 font-bold uppercase tracking-wider mb-4">Teams</h3>
                                    <div className="bg-gradient-to-r from-primary/5 via-transparent to-accent/5 p-6 rounded-xl border border-white/5">
                                        <div className="flex items-center gap-4">
                                            <div className="flex-1">
                                                <div className="bg-black/30 p-4 rounded-xl border border-white/10">
                                                    <label className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-2 block">Team A</label>
                                                    <CustomSelect
                                                        value={selectedMatch.teamA}
                                                        onValueChange={(val) => updateMatch(selectedMatchIndex, 'teamA', val)}
                                                        placeholder="Select Team"
                                                        options={teams.filter((t) => t.name !== selectedMatch.teamB).map((t) => ({ value: t.name, label: t.name }))}
                                                    />
                                                </div>
                                            </div>
                                            <div className="shrink-0">
                                                <div className="w-14 h-14 rounded-full bg-black/40 border border-white/10 flex items-center justify-center">
                                                    <span className="text-slate-400 font-bold text-sm">VS</span>
                                                </div>
                                            </div>
                                            <div className="flex-1">
                                                <div className="bg-black/30 p-4 rounded-xl border border-white/10">
                                                    <label className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-2 block">Team B</label>
                                                    <CustomSelect
                                                        value={selectedMatch.teamB}
                                                        onValueChange={(val) => updateMatch(selectedMatchIndex, 'teamB', val)}
                                                        placeholder="Select Team"
                                                        options={teams.filter((t) => t.name !== selectedMatch.teamA).map((t) => ({ value: t.name, label: t.name }))}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Venue */}
                                <div>
                                    <h3 className="text-sm text-slate-400 font-bold uppercase tracking-wider mb-4 flex items-center gap-1">
                                        <MapPin className="h-3 w-3" /> Venue
                                    </h3>
                                    <div className="flex gap-4 items-center">
                                        <CustomSelect
                                            value={VENUES.includes(selectedMatch.venue) ? selectedMatch.venue : 'custom'}
                                            onValueChange={(val) => {
                                                if (val !== 'custom') {
                                                    updateMatch(selectedMatchIndex, 'venue', val);
                                                }
                                            }}
                                            options={[
                                                ...VENUES.map(v => ({ value: v, label: v })),
                                                { value: 'custom', label: '✏️ Custom...' }
                                            ]}
                                        />
                                        {!VENUES.includes(selectedMatch.venue) && (
                                            <input
                                                value={selectedMatch.venue}
                                                onChange={(e) => updateMatch(selectedMatchIndex, 'venue', e.target.value)}
                                                className="flex-1 bg-black/20 border border-white/10 rounded-lg p-4 text-white focus:border-primary focus:outline-none transition-colors"
                                                placeholder="Enter custom venue"
                                            />
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-16 bg-white/5 rounded-2xl border border-white/10">
                            <Calendar className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                            <p className="text-slate-400 text-lg">
                                {schedule.length === 0 ? "No matches scheduled. Click 'Add Match' to start." : "Select a match from the dropdown to edit."}
                            </p>
                        </div>
                    )
                }
            </main >
        </div >
    );
}
