'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { Save, Plus, Trash, Crown } from 'lucide-react';
import CustomSelect from '@/components/CustomSelect';
import { useRouter } from 'next/navigation';

export default function ManageTeams() {
    const [teams, setTeams] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState<{ [key: string]: boolean }>({});
    const [selectedTeamId, setSelectedTeamId] = useState<string>("");
    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem('adminToken');
        if (!token) router.push('/admin/login');

        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/teams`)
            .then((res) => res.json())
            .then((data) => {
                setTeams(data);
                if (data.length > 0) {
                    setSelectedTeamId(data[0].id);
                }
                setLoading(false);
            });
    }, [router]);

    const handleSave = async () => {
        for (const team of teams) {
            if (!team.name) {
                alert("All teams must have a name.");
                return;
            }
            if (team.members.length === 0) {
                alert(`Team "${team.name}" must have at least one member.`);
                return;
            }
            for (const member of team.members) {
                if (!member.name) {
                    alert(`All members in team "${team.name}" must have a name.`);
                    return;
                }
            }
        }

        await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/teams`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(teams),
        });
        alert('Teams saved successfully!');
    };

    const updateTeamName = (index: number, name: string) => {
        const newTeams = [...teams];
        newTeams[index].name = name;
        setTeams(newTeams);
    };

    const addTeam = () => {
        const teamName = prompt("Enter Team Name:");
        if (!teamName) return;

        const memberName = prompt("Enter First Member Name:");
        if (!memberName) return;

        const newTeamId = Date.now().toString();
        const newTeam = {
            id: newTeamId,
            name: teamName,
            members: [{ name: memberName, year: '1st Year', branch: 'CSE', isCaptain: true, image: '' }]
        };

        setTeams([newTeam, ...teams]);
        setSelectedTeamId(newTeamId);
    };

    const removeTeam = (index: number) => {
        if (confirm('Are you sure you want to delete this team?')) {
            const newTeams = [...teams];
            newTeams.splice(index, 1);
            setTeams(newTeams);
            if (newTeams.length > 0) {
                setSelectedTeamId(newTeams[0].id);
            } else {
                setSelectedTeamId("");
            }
        }
    };

    const addMember = (teamIndex: number) => {
        const newTeams = [...teams];
        newTeams[teamIndex].members.unshift({ name: '', year: '', branch: '', isCaptain: false, image: '' });
        setTeams(newTeams);
    };

    const updateMember = (teamIndex: number, memberIndex: number, field: string, value: string) => {
        const newTeams = [...teams];
        newTeams[teamIndex].members[memberIndex][field] = value;
        setTeams(newTeams);
    };

    const toggleCaptain = (teamIndex: number, memberIndex: number) => {
        const newTeams = [...teams];
        // Unset captain for all other members in the team
        newTeams[teamIndex].members.forEach((member: any, idx: number) => {
            member.isCaptain = idx === memberIndex;
        });
        setTeams(newTeams);
    };

    const removeMember = (teamIndex: number, memberIndex: number) => {
        if (teams[teamIndex].members.length <= 1) {
            alert("A team must have at least one member.");
            return;
        }
        const newTeams = [...teams];
        newTeams[teamIndex].members.splice(memberIndex, 1);
        // If we removed the captain, make the first member captain
        if (newTeams[teamIndex].members.length > 0 && !newTeams[teamIndex].members.some((m: any) => m.isCaptain)) {
            newTeams[teamIndex].members[0].isCaptain = true;
        }
        setTeams(newTeams);
    };

    const handleFileUpload = async (teamIndex: number, memberIndex: number, file: File) => {
        if (!file) return;

        const uploadKey = `${teamIndex}-${memberIndex}`;
        setUploading(prev => ({ ...prev, [uploadKey]: true }));
        const formData = new FormData();
        formData.append('image', file);

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/upload`, {
                method: 'POST',
                body: formData,
            });
            const data = await res.json();
            if (data.success) {
                updateMember(teamIndex, memberIndex, 'image', data.url);
            } else {
                alert('Upload failed');
            }
        } catch (error) {
            console.error('Error uploading file:', error);
            alert('Error uploading file');
        } finally {
            setUploading(prev => ({ ...prev, [uploadKey]: false }));
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-400">Loading...</div>;

    const selectedTeamIndex = teams.findIndex(t => t.id === selectedTeamId);
    const selectedTeam = teams[selectedTeamIndex];

    return (
        <div className="min-h-screen bg-background text-foreground">
            <Navbar />
            <main className="max-w-7xl mx-auto px-4 py-12">
                <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
                    <div>
                        <h1 className="text-4xl font-bold text-white mb-2">Manage Teams</h1>
                        <p className="text-slate-400">Add or edit hostel teams and members</p>
                    </div>
                    <div className="flex gap-4">
                        <button
                            onClick={addTeam}
                            className="bg-white/10 hover:bg-white/20 text-white font-bold px-6 py-3 rounded-xl flex items-center transition-all border border-white/10"
                        >
                            <Plus className="h-5 w-5 mr-2" />
                            Add Team
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

                {/* Team Selection Dropdown */}
                <div className="mb-8">
                    <label className="text-sm text-slate-400 font-bold uppercase tracking-wider mb-2 block">Select Team to Edit</label>
                    <CustomSelect
                        value={selectedTeamId}
                        onValueChange={setSelectedTeamId}
                        placeholder="Select a Team"
                        options={teams.map(team => ({ value: team.id, label: team.name }))}
                        className="w-full md:w-1/3"
                    />
                </div>

                {selectedTeam ? (
                    <div className="bg-white/5 backdrop-blur-sm p-6 rounded-2xl border border-white/10 hover:border-primary/30 transition-all relative group">
                        <div className="flex justify-between items-center mb-6">
                            <input
                                value={selectedTeam.name}
                                onChange={(e) => updateTeamName(selectedTeamIndex, e.target.value)}
                                className="text-2xl font-bold bg-transparent border-b border-white/10 w-full focus:outline-none focus:border-primary text-white pb-2 mr-4"
                                placeholder="Team Name"
                            />
                            <button
                                onClick={() => removeTeam(selectedTeamIndex)}
                                className="text-red-500 hover:text-red-400 p-2 rounded-lg hover:bg-red-500/10 transition-colors"
                                title="Delete Team"
                            >
                                <Trash className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="space-y-3">
                            <button
                                onClick={() => addMember(selectedTeamIndex)}
                                className="w-full py-4 rounded-xl border border-dashed border-white/20 text-slate-400 hover:text-white hover:border-white/40 transition-all flex items-center justify-center font-medium mb-6"
                            >
                                <Plus className="h-5 w-5 mr-2" /> Add Member
                            </button>

                            <div className="space-y-3">
                                {selectedTeam.members.map((member: any, memberIndex: number) => (
                                    <div key={memberIndex} className="grid grid-cols-12 gap-3 items-center bg-black/40 p-3 rounded-xl border border-white/5 group/member hover:border-white/10 transition-all">
                                        <div className="col-span-1 flex justify-center">
                                            <div className="relative w-8 h-8 rounded-full overflow-hidden bg-white/10 border border-white/10 cursor-pointer group/img">
                                                {member.image ? (
                                                    <img src={member.image} alt="Member" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-[8px] text-slate-400">Img</div>
                                                )}
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={(e) => e.target.files && handleFileUpload(selectedTeamIndex, memberIndex, e.target.files[0])}
                                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                                    title="Upload Image"
                                                />
                                                {uploading[`${selectedTeamIndex}-${memberIndex}`] && (
                                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                                        <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="col-span-4">
                                            <input
                                                placeholder="Name"
                                                value={member.name}
                                                onChange={(e) => updateMember(selectedTeamIndex, memberIndex, 'name', e.target.value)}
                                                className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-2 focus:border-primary focus:outline-none text-slate-200 text-sm transition-colors"
                                            />
                                        </div>
                                        <div className="col-span-3 relative">
                                            <CustomSelect
                                                value={member.year}
                                                onValueChange={(val) => updateMember(selectedTeamIndex, memberIndex, 'year', val)}
                                                placeholder="Year"
                                                options={[
                                                    { value: '1st Year', label: '1st Year' },
                                                    { value: '2nd Year', label: '2nd Year' },
                                                    { value: '3rd Year', label: '3rd Year' },
                                                    { value: '4th Year', label: '4th Year' },
                                                    { value: '5th Year', label: '5th Year' }
                                                ]}
                                                className="bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-2 text-sm"
                                            />
                                        </div>
                                        <div className="col-span-2 relative">
                                            <CustomSelect
                                                value={member.branch}
                                                onValueChange={(val) => updateMember(selectedTeamIndex, memberIndex, 'branch', val)}
                                                placeholder="Branch"
                                                options={[
                                                    { value: 'CSE', label: 'CSE' },
                                                    { value: 'EE', label: 'EE' },
                                                    { value: 'ME', label: 'ME' },
                                                    { value: 'ECE', label: 'ECE' },
                                                    { value: 'EEE', label: 'EEE' },
                                                    { value: 'M&C', label: 'M&C' },
                                                    { value: 'EP', label: 'EP' },
                                                    { value: 'C&IE', label: 'C&IE' },
                                                    { value: 'C&BE', label: 'C&BE' },
                                                    { value: 'BS-MS', label: 'BS-MS' }
                                                ]}
                                                className="bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-2 text-sm"
                                            />
                                        </div>
                                        <div className="col-span-2 flex justify-end gap-1">
                                            <button
                                                onClick={() => toggleCaptain(selectedTeamIndex, memberIndex)}
                                                className={`p-2 rounded-lg transition-colors ${member.isCaptain ? 'text-yellow-400 bg-yellow-400/10 border border-yellow-400/20' : 'text-slate-600 hover:text-yellow-400 hover:bg-yellow-400/10 border border-transparent'}`}
                                                title={member.isCaptain ? "Team Captain" : "Mark as Captain"}
                                            >
                                                <Crown className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => removeMember(selectedTeamIndex, memberIndex)}
                                                className="text-red-500 hover:text-red-400 p-2 rounded-lg hover:bg-red-500/10 transition-colors border border-transparent hover:border-red-500/20"
                                            >
                                                <Trash className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-12 text-slate-500 bg-white/5 rounded-2xl border border-white/10">
                        {teams.length === 0 ? "No teams found. Click 'Add Team' to start." : "Select a team from the dropdown to edit."}
                    </div>
                )}
            </main>
        </div>
    );
}
