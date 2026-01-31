'use client';

import { useState, useEffect, useCallback } from 'react';
import Navbar from '@/components/layout/Navbar';
import Loader from '@/components/ui/Loader';
import CustomSelect from '@/components/ui/CustomSelect';
import { Save, Plus, Trash, FileText, Link as LinkIcon, Upload, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import PasswordModal from '@/components/ui/PasswordModal';

// URL validation helper
const isValidUrl = (url) => {
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
    const [results, setResults] = useState([]);
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [selectedResultId, setSelectedResultId] = useState("");
    const [filterSport, setFilterSport] = useState("All");
    const [uploading, setUploading] = useState(false);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [confirmCallback, setConfirmCallback] = useState(null);
    const router = useRouter();

    const handleLogout = useCallback(async () => {
        await api.logout();
        router.push('/admin/login');
    }, [router]);

    useEffect(() => {
        const token = localStorage.getItem('adminToken');
        if (!token) router.push('/admin/login');

        const fetchData = async () => {
            try {
                const [resultsRes, teamsRes] = await Promise.all([
                    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/results`),
                    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/teams`)
                ]);

                const resultsData = await resultsRes.json();
                const teamsData = await teamsRes.json();

                const safeResults = Array.isArray(resultsData) ? resultsData : (resultsData ? [resultsData] : []);

                // Ensure all results have required fields
                const sanitizedResults = safeResults.map((result) => ({
                    ...result,
                    scoreA: result.scoreA || 0,
                    scoreB: result.scoreB || 0,
                    winner: result.winner || '',
                    date: result.date || '',
                    liveLink: result.liveLink || '',
                    scoreSheetType: result.scoreSheetType || 'url',
                    scoreSheetLink: result.scoreSheetLink || '',
                    category: result.category || 'Men',
                    streamStatus: result.streamStatus || 'Ended'
                }));

                setResults(sanitizedResults);
                setTeams(teamsData);
                if (sanitizedResults.length > 0) {
                    setSelectedResultId(sanitizedResults[0].id);
                }
                setLoading(false);
            } catch (error) {
                console.error("Error fetching data:", error);
                setLoading(false);
            }
        };

        fetchData();
    }, [router]);

    const handleSaveClick = async () => {
        for (const result of results) {
            if (!result.teamA || !result.teamB) {
                alert(`Match between ${result.teamA || 'Unknown'} and ${result.teamB || 'Unknown'} must have both teams selected.`);
                return;
            }
            if (result.teamA === result.teamB) {
                alert(`Team A and Team B cannot be the same for match between ${result.teamA} and ${result.teamB}.`);
                return;
            }
            if (result.scoreA < 0 || result.scoreB < 0) {
                alert(`Scores cannot be negative for match between ${result.teamA} and ${result.teamB}.`);
                return;
            }
            if (!result.winner) {
                alert(`Please select a Winner (or Draw) for match between ${result.teamA} and ${result.teamB}.`);
                return;
            }
        }

        setConfirmCallback(() => executeSave);
        setIsPasswordModalOpen(true);
    };

    const executeSave = async (password) => {
        setSaving(true);
        try {
            // Pass password in headers if your API supports it, or assume basic token auth + secondary check
            // Based on other files, it seems we might just need to pass it or just use it as a gatekeeper
            // If the API requires the password, we should pass it. 
            // The previous code in Standings used 'x-admin-password'. Let's attempt to use that.

            // Adjust api.post to accept headers or use fetch directly if api.post doesn't support custom headers easily without modification
            // Since api.post is a wrapper, let's use fetch directly for this sensitive action to ensure headers are accurate

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/results`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
                    'x-admin-password': password
                },
                body: JSON.stringify(results)
            });

            const data = await res.json();

            if (data.success) {
                alert('Results published successfully!');
                return true;
            } else {
                // If the backend returns 401/403 despite token, it might be the password check
                if (res.status === 401 || res.status === 403) {
                    return false; // Password incorrect
                }
                alert(data.message || 'Failed to save results.');
                return true; // Return true to close modal if it's not a password error but a logic error
            }
        } catch (error) {
            console.error('Error saving results:', error);
            alert('Failed to save results.');
            return true; // Close modal on error
        } finally {
            setSaving(false);
        }
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
            liveLink: '',
            streamStatus: 'Ended'
        };

        setResults([newResult, ...results]);
        setSelectedResultId(newId);
    };

    const updateResult = (index, field, value) => {
        setResults(prevResults => {
            const newResults = [...prevResults];
            newResults[index] = { ...newResults[index], [field]: value };
            return newResults;
        });
    };

    const removeResult = (index) => {
        if (index === -1) return;

        // We can just use confirm here, but user asked for password on changes. 
        // Integrating password modal for delete as well is safer.
        const resultToDelete = results[index];
        setConfirmCallback(() => (password) => executeDelete(index, password));
        setIsPasswordModalOpen(true);
    };

    const executeDelete = async (index, password) => {
        // Verify password by making a dummy check or simply proceeding if the design assumes 
        // that ANY action requires a password check against the backend.
        // Since we don't have a specific "check password" endpoint, we can use the save endpoint 
        // with the new state (deleted item) as the validation.

        const newResults = [...results];
        newResults.splice(index, 1);

        setSaving(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/results`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
                    'x-admin-password': password
                },
                body: JSON.stringify(newResults)
            });

            if (res.ok) {
                setResults(newResults);

                // Determine next selection
                let nextResult = newResults[index];
                if (!nextResult) {
                    nextResult = newResults[index - 1];
                }

                if (nextResult) {
                    if (filterSport === "All" || nextResult.sport === filterSport) {
                        setSelectedResultId(nextResult.id);
                    } else {
                        const visibleResults = newResults.filter(r => r.sport === filterSport);
                        setSelectedResultId(visibleResults.length > 0 ? visibleResults[0].id : "");
                    }
                } else {
                    setSelectedResultId("");
                }

                alert('Result deleted successfully!');
                return true;
            } else {
                if (res.status === 401 || res.status === 403) return false;
                alert('Failed to delete result.');
                return true;
            }
        } catch (error) {
            console.error("Error deleting result:", error);
            alert('Failed to delete result.');
            return true;
        } finally {
            setSaving(false);
        }
    };

    const handleScoreSheetUpload = async (index, file) => {
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('image', file);

        try {
            const data = await api.upload('/api/upload', formData);

            if (data.success) {
                updateResult(index, 'scoreSheetLink', data.url);
            } else {
                alert('Upload failed: ' + (data.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error uploading file:', error);
            if (error.status === 401 || error.status === 403) {
                handleLogout();
            } else {
                alert('Error uploading file');
            }
        } finally {
            setUploading(false);
        }
    };

    if (loading) return <Loader />;

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
                            onClick={handleSaveClick}
                            disabled={saving}
                            className="bg-primary hover:bg-primary/90 text-black font-bold px-6 py-3 rounded-xl flex items-center transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {saving ? (
                                <>
                                    <div className="h-5 w-5 mr-2 border-2 border-black border-t-transparent rounded-full animate-spin" /> Publish Live
                                </>
                            ) : (
                                <>
                                    <Save className="h-5 w-5 mr-2" /> Publish Live
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
                            options={(filterSport === "All" ? results : results.filter(r => r.sport === filterSport)).map((result) => ({
                                value: result.id,
                                label: `${result.teamA} vs ${result.teamB} (${result.category === 'Women' ? 'W' : result.category === 'Men' ? 'M' : 'X'})${result.date ? ` • ${new Date(result.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : ''}`
                            }))}
                        />
                        <p className="text-xs text-slate-500 mt-2">(M) = Men • (W) = Women • (X) = Mixed</p>
                    </div>
                </div>

                {selectedResult ? (
                    <div className="bg-white/5 backdrop-blur-sm p-6 rounded-2xl border border-white/10 flex flex-col gap-6 relative group hover:border-white/20 transition-colors">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
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
                                    value={selectedResult.date || ''}
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
                            <div>
                                <label className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-2 block">Stream Status</label>
                                <CustomSelect
                                    value={selectedResult.streamStatus || 'Ended'}
                                    onValueChange={(val) => updateResult(selectedResultIndex, 'streamStatus', val)}
                                    options={[
                                        { value: 'Ended', label: 'Ended' },
                                        { value: 'Live', label: 'Live' },
                                        { value: 'Upcoming', label: 'Upcoming' }
                                    ]}
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
                                    options={Array.from(new Set(teams.map(t => t.name))).map(name => ({ value: name, label: name }))}
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
                                    options={Array.from(new Set(teams.map(t => t.name))).map(name => ({ value: name, label: name }))}
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
