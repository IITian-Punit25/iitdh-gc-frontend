'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import CustomSelect from '@/components/ui/CustomSelect';
import { Save, Plus, Trash, FileText, Link as LinkIcon, Upload, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

// URL validation helper
const isValidUrl = (url: string): boolean => {
    if (!url || url.trim() === '') return true;
    try {
        const parsed = new URL(url);
        return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
        return false;
    }
};

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

export default function ManageResults() {
    const [results, setResults] = useState<any[]>([]);
    const [teams, setTeams] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedResultId, setSelectedResultId] = useState<string>("");
    const [filterSport, setFilterSport] = useState<string>("All");
    const [uploading, setUploading] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem('adminToken');
        if (!token) router.push('/admin/login');

        const fetchData = async () => {
            try {
                const [resultsRes, teamsRes] = await Promise.all([
                    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/results`),
                    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/teams`)
                ]);

                const resultsData = await resultsRes.json();
                const teamsData = await teamsRes.json();

                setResults(resultsData);
                setTeams(teamsData);
                if (resultsData.length > 0) {
                    setSelectedResultId(resultsData[0].id);
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
        for (const result of results) {
            if (!result.teamA || !result.teamB) {
                alert("Both Team A and Team B must be selected for all matches.");
                return;
            }
            if (result.teamA === result.teamB) {
                alert("Team A and Team B cannot be the same.");
                return;
            }
            if (result.scoreA < 0 || result.scoreB < 0) {
                alert("Scores cannot be negative.");
                return;
            }
            if (!result.winner) {
                alert("Please select a Winner (or Draw) for all matches.");
                return;
            }
        }

        await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/results`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(results),
        });
        alert('Results published successfully!');
    };

    const addResult = () => {
        const newId = Date.now().toString();
        const newResult = {
            id: newId,
            sport: 'Football',
            category: 'Men',
            teamA: teams[0]?.name || '',
            teamB: teams[1]?.name || '',
            scoreA: 0,
            scoreB: 0,
            winner: '',
            date: '',
            liveLink: ''
        };

        setResults([newResult, ...results]);
        setSelectedResultId(newId);
    };

    const updateResult = (index: number, field: string, value: string | number) => {
        const newResults = [...results];
        newResults[index][field] = value;
        setResults(newResults);
    };

    const removeResult = (index: number) => {
        if (confirm('Are you sure you want to delete this result?')) {
            const newResults = [...results];
            newResults.splice(index, 1);
            setResults(newResults);
            if (newResults.length > 0) {
                setSelectedResultId(newResults[0].id);
            } else {
                setSelectedResultId("");
            }
        }
    };

    const handleScoreSheetUpload = async (index: number, file: File) => {
        if (!file) return;
        setUploading(true);
        const formData = new FormData();
        formData.append('image', file);

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/upload`, {
                method: 'POST',
                body: formData,
            });
            const data = await res.json();
            if (data.success) {
                updateResult(index, 'scoreSheetLink', data.url);
            } else {
                alert('Upload failed');
            }
        } catch (error) {
            console.error('Error uploading file:', error);
            alert('Error uploading file');
        } finally {
            setUploading(false);
        }
    };

    if (loading) return <div className="min-h-screen bg-background flex items-center justify-center text-slate-400">Loading...</div>;

    const selectedResultIndex = results.findIndex(r => r.id === selectedResultId);
    const selectedResult = results[selectedResultIndex];

    return (
        <div className="min-h-screen bg-background text-foreground">
            <Navbar />
            <main className="max-w-7xl mx-auto px-4 py-12">
                <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
                    <div>
                        <h1 className="text-4xl font-bold text-white mb-2">Manage Results</h1>
                        <p className="text-slate-400">Add, edit, and publish match results</p>
                    </div>
                    <div className="flex space-x-4">
                        <button
                            onClick={addResult}
                            className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-xl flex items-center transition-all border border-white/10"
                        >
                            <Plus className="h-5 w-5 mr-2" /> Add Result
                        </button>
                        <button
                            onClick={handleSave}
                            className="bg-primary hover:bg-primary/90 text-black font-bold px-6 py-3 rounded-xl flex items-center transition-all shadow-lg shadow-primary/20"
                        >
                            <Save className="h-5 w-5 mr-2" /> Publish Live
                        </button>
                    </div>
                </div>

                {/* Result Selection - Two Step */}
                <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Step 1: Filter by Sport */}
                    <div>
                        <label className="text-sm text-slate-400 font-bold uppercase tracking-wider mb-2 block">1. Filter by Sport</label>
                        <CustomSelect
                            value={filterSport}
                            onValueChange={(val) => {
                                setFilterSport(val);
                                const filteredResults = val === "All" ? results : results.filter(r => r.sport === val);
                                if (filteredResults.length > 0) {
                                    setSelectedResultId(filteredResults[0].id);
                                } else {
                                    setSelectedResultId("");
                                }
                            }}
                            placeholder="All Sports"
                            options={[
                                { value: "All", label: "All Sports" },
                                ...SPORTS.filter(s => results.some(r => r.sport === s)).map(s => ({ value: s, label: s }))
                            ]}
                        />
                    </div>
                    {/* Step 2: Select Result */}
                    <div className="md:col-span-2">
                        <label className="text-sm text-slate-400 font-bold uppercase tracking-wider mb-2 block">2. Select Match</label>
                        <CustomSelect
                            value={selectedResultId}
                            onValueChange={setSelectedResultId}
                            placeholder="Select a Match"
                            options={(filterSport === "All" ? results : results.filter(r => r.sport === filterSport)).map(result => ({
                                value: result.id,
                                label: `${result.teamA} vs ${result.teamB} (${result.category === 'Women' ? 'W' : result.category === 'Men' ? 'M' : 'X'})${result.date ? ` • ${new Date(result.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : ''}`
                            }))}
                        />
                        <p className="text-xs text-slate-500 mt-2">(M) = Men • (W) = Women • (X) = Mixed</p>
                    </div>
                </div>

                {selectedResult ? (
                    <div className="bg-white/5 backdrop-blur-sm p-6 rounded-2xl border border-white/10 flex flex-col gap-6 relative group hover:border-white/20 transition-colors">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div>
                                <label className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-2 block">Sport</label>
                                <CustomSelect
                                    value={selectedResult.sport}
                                    onValueChange={(val) => updateResult(selectedResultIndex, 'sport', val)}
                                    options={SPORTS.map(s => ({ value: s, label: s }))}
                                />
                            </div>
                            <div>
                                <label className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-2 block">Category</label>
                                <CustomSelect
                                    value={selectedResult.category || 'Men'}
                                    onValueChange={(val) => updateResult(selectedResultIndex, 'category', val)}
                                    options={CATEGORIES.map(c => ({ value: c, label: c }))}
                                />
                            </div>
                            <div>
                                <label className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-2 block">Date</label>
                                <input
                                    type="date"
                                    value={selectedResult.date}
                                    onChange={(e) => updateResult(selectedResultIndex, 'date', e.target.value)}
                                    className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:border-primary focus:outline-none transition-colors"
                                />
                            </div>
                            <div className="lg:col-span-1">
                                <label className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-2 block">Live Stream Link</label>
                                <input
                                    value={selectedResult.liveLink || ''}
                                    onChange={(e) => updateResult(selectedResultIndex, 'liveLink', e.target.value)}
                                    className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:border-primary focus:outline-none transition-colors"
                                    placeholder="https://youtube.com/..."
                                />
                            </div>
                        </div>

                        {/* Score Sheet Section */}
                        <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                            <div className="flex items-center justify-between mb-3">
                                <label className="text-xs text-slate-400 uppercase tracking-wider font-semibold flex items-center">
                                    <FileText className="h-3 w-3 mr-1" /> Score Sheet
                                </label>
                                <div className="flex bg-black/40 rounded-lg p-1 border border-white/10">
                                    <button
                                        onClick={() => updateResult(selectedResultIndex, 'scoreSheetType', 'url')}
                                        className={`px-3 py-1 rounded text-xs font-bold transition-all flex items-center gap-1 ${selectedResult.scoreSheetType !== 'upload' ? 'bg-primary text-black' : 'text-slate-400 hover:text-white'}`}
                                    >
                                        <LinkIcon className="h-3 w-3" /> Link
                                    </button>
                                    <button
                                        onClick={() => updateResult(selectedResultIndex, 'scoreSheetType', 'upload')}
                                        className={`px-3 py-1 rounded text-xs font-bold transition-all flex items-center gap-1 ${selectedResult.scoreSheetType === 'upload' ? 'bg-primary text-black' : 'text-slate-400 hover:text-white'}`}
                                    >
                                        <Upload className="h-3 w-3" /> Upload
                                    </button>
                                </div>
                            </div>
                            {selectedResult.scoreSheetType === 'upload' ? (
                                <div className="relative">
                                    <input
                                        type="file"
                                        accept=".pdf,.doc,.docx,.xls,.xlsx,image/*"
                                        onChange={(e) => e.target.files && handleScoreSheetUpload(selectedResultIndex, e.target.files[0])}
                                        className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white text-sm file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-bold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
                                        disabled={uploading}
                                    />
                                    {uploading && (
                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                                            <Loader2 className="h-5 w-5 text-primary animate-spin" />
                                        </div>
                                    )}
                                    {selectedResult.scoreSheetLink && (
                                        <p className="text-xs text-green-400 mt-2 flex items-center gap-1">
                                            <CheckCircle className="h-3 w-3" /> File uploaded: {selectedResult.scoreSheetLink.split('/').pop()}
                                        </p>
                                    )}
                                </div>
                            ) : (
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <LinkIcon className="h-4 w-4 text-slate-500" />
                                    </div>
                                    <input
                                        value={selectedResult.scoreSheetLink || ''}
                                        onChange={(e) => updateResult(selectedResultIndex, 'scoreSheetLink', e.target.value)}
                                        className={`w-full bg-black/20 border rounded-lg pl-10 pr-10 p-3 text-white focus:outline-none transition-colors ${selectedResult.scoreSheetLink && !isValidUrl(selectedResult.scoreSheetLink)
                                            ? 'border-red-500 focus:border-red-500'
                                            : selectedResult.scoreSheetLink && isValidUrl(selectedResult.scoreSheetLink)
                                                ? 'border-green-500/50 focus:border-green-500'
                                                : 'border-white/10 focus:border-primary'
                                            }`}
                                        placeholder="https://docs.google.com/..."
                                    />
                                    {selectedResult.scoreSheetLink && (
                                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                            {isValidUrl(selectedResult.scoreSheetLink) ? (
                                                <CheckCircle className="h-4 w-4 text-green-500" />
                                            ) : (
                                                <AlertCircle className="h-4 w-4 text-red-500" />
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                            {selectedResult.scoreSheetLink && !isValidUrl(selectedResult.scoreSheetLink) && selectedResult.scoreSheetType !== 'upload' && (
                                <p className="text-red-400 text-xs mt-1">Please enter a valid URL</p>
                            )}
                        </div>

                        <div className="flex items-center gap-4 bg-black/20 p-4 rounded-xl border border-white/5">
                            <div className="flex-1">
                                <label className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-2 block">Team A</label>
                                <CustomSelect
                                    value={selectedResult.teamA}
                                    onValueChange={(val) => updateResult(selectedResultIndex, 'teamA', val)}
                                    placeholder="Select Team"
                                    options={teams.map(t => ({ value: t.name, label: t.name }))}
                                    className="bg-transparent border-b border-white/10 rounded-none p-2 text-lg font-medium"
                                />
                            </div>
                            <div className="flex items-center gap-4">
                                <input
                                    type="number"
                                    value={selectedResult.scoreA}
                                    onChange={(e) => updateResult(selectedResultIndex, 'scoreA', parseInt(e.target.value))}
                                    className="w-16 bg-black/40 border border-white/10 rounded-lg p-2 text-center text-2xl font-bold text-white focus:border-primary focus:outline-none"
                                />
                                <span className="text-slate-500 font-bold">-</span>
                                <input
                                    type="number"
                                    value={selectedResult.scoreB}
                                    onChange={(e) => updateResult(selectedResultIndex, 'scoreB', parseInt(e.target.value))}
                                    className="w-16 bg-black/40 border border-white/10 rounded-lg p-2 text-center text-2xl font-bold text-white focus:border-primary focus:outline-none"
                                />
                            </div>
                            <div className="flex-1 text-right">
                                <label className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-2 block">Team B</label>
                                <CustomSelect
                                    value={selectedResult.teamB}
                                    onValueChange={(val) => updateResult(selectedResultIndex, 'teamB', val)}
                                    placeholder="Select Team"
                                    options={teams.map(t => ({ value: t.name, label: t.name }))}
                                    className="bg-transparent border-b border-white/10 rounded-none p-2 text-lg font-medium text-right"
                                />
                            </div>
                        </div>

                        <div className="flex justify-between items-end">
                            <div className="flex-1 max-w-xs">
                                <label className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-2 block">Winner</label>
                                <CustomSelect
                                    value={selectedResult.winner}
                                    onValueChange={(val) => updateResult(selectedResultIndex, 'winner', val)}
                                    placeholder="Select Winner"
                                    options={[
                                        { value: 'Draw', label: 'Draw' },
                                        ...(selectedResult.teamA ? [{ value: selectedResult.teamA, label: selectedResult.teamA }] : []),
                                        ...(selectedResult.teamB ? [{ value: selectedResult.teamB, label: selectedResult.teamB }] : [])
                                    ]}
                                />
                            </div>
                            <button
                                onClick={() => removeResult(selectedResultIndex)}
                                className="p-3 rounded-lg text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors flex items-center gap-2"
                                title="Remove Result"
                            >
                                <Trash className="h-5 w-5" /> Delete Result
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-12 text-slate-500 bg-white/5 rounded-2xl border border-white/10">
                        {results.length === 0 ? "No results found. Click 'Add Result' to start." : "Select a match from the dropdown to edit."}
                    </div>
                )}
            </main>
        </div>
    );
}
