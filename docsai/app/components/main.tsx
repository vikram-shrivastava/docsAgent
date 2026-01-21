'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import AuthPage from './AuthPage';
import { Plus, Upload, Send, MessageSquare, Users, FileText, X, LogIn, ArrowRight, Trash2, Loader2 } from 'lucide-react';

// --- Types ---
type Message = { id: string; sender: 'user' | 'system'; text: string; };
type FileItem = { name: string; size: string; url?: string };
type Team = { 
  _id: string; 
  name: string; 
  password?: string; // Optional in frontend view usually
  files: FileItem[]; 
  messages: Message[]; 
  isOwner?: boolean; // To check if user can delete
  creator: {_id: string; name: string; email: string}
};
type UserProfile = {_id: string; name: string; email: string; };

export default function Home() {
  // --- Auth State ---
  const [user, setUser] = useState<UserProfile | null>(null);

  // --- App State ---
  const [view, setView] = useState<'MAIN' | 'TEAM_VIEW'>('MAIN');
  const [teams, setTeams] = useState<Team[]>([]);
  const [activeTeamId, setActiveTeamId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Modal & Form State
  const [modalType, setModalType] = useState<'CREATE' | 'JOIN' | null>(null);
  const [formData, setFormData] = useState({ name: '', password: '' });
  const [error, setError] = useState('');
  const [chatInput, setChatInput] = useState('');

  
  // --- 1. Fetch All Teams ---
  const fetchTeams = useCallback(async () => {
    const token=localStorage.getItem('accessToken');
    if (!user) return;
    try {
      const res = await fetch('/api/get-all-teams',{
        method:'GET',
        headers: {
          'Content-Type':'application/json',
            'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error('Failed to fetch teams');
      const data = await res.json();
      const allTeams=[]
      console.log(data);
      allTeams.push(...data.createdTeams);
      allTeams.push(...data.memberTeams);
      // Assuming API returns { teams: [] }
      setTeams(allTeams); 
      console.log("team:",allTeams.map(team => team.creator._id))
      console.log("user:",user._id)
    } catch (err) {
      console.error(err);
    }
  }, [user]);

  // Initial Fetch on Login
  useEffect(() => {
    if (user) {
      fetchTeams();
    }
  }, [user, fetchTeams]);

  // --- Auth Handler ---
  if (!user) {
    return <AuthPage onLogin={(userData) => setUser({ _id: userData._id, name: userData.name, email: userData.email })} />;
  }

  // --- 2. Create Team ---
  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.password) return;
    
    setIsLoading(true);
    setError('');

    try {
        const token=localStorage.getItem('accessToken');
        const res = await fetch('/api/create-team', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' ,
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ name: formData.name, teamPassword: formData.password })
        });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to create team');
      }

      const data = await res.json();
      // Assuming API returns the created team object
      const newTeam = data.team; 
      
      setTeams(prev => [...prev, newTeam]);
      resetForm();
      enterTeam(newTeam.id);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // --- 3. Join Team (Add Members) ---
  const handleJoinTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
        const token=localStorage.getItem('accessToken');
      const res = await fetch('/api/add-members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' ,
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          teamName: formData.name, 
          teamPassword: formData.password,
          email: user.email 
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Invalid credentials or team not found');
      }

      const data = await res.json();
      // Refresh teams list to show the newly joined team
      await fetchTeams(); 
      resetForm();
      
      // Optionally enter the team immediately if ID is returned
      if (data.teamId) enterTeam(data.teamId);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // --- 4. Delete Team ---
  const handleDeleteTeam = async (e: React.MouseEvent, teamId: string) => {
    e.stopPropagation(); // Prevent entering the team when clicking delete
    if (!confirm('Are you sure you want to delete this team?')) return;

    try {
        const token=localStorage.getItem('accessToken');
      const res = await fetch('/api/delete-team', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' ,
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ teamId })
      });

      if (!res.ok) throw new Error('Failed to delete team');
      
      // Update UI locally
      setTeams(prev => prev.filter(t => t._id !== teamId));
    } catch (err) {
      console.error(err);
      alert('Could not delete team');
    }
  };

  // --- 5. Chatbot Interaction ---
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !activeTeamId) return;

    const currentMsgId = Date.now().toString();
    const userMsgText = chatInput;
    
    // Optimistic Update: Show user message immediately
    setTeams(prev => prev.map(team => {
      if (team._id === activeTeamId) {
        return { 
          ...team, 
          messages: [...team.messages, { id: currentMsgId, sender: 'user', text: userMsgText }] 
        };
      }
      return team;
    }));
    
    setChatInput(''); // Clear input

    try {
        const token=localStorage.getItem('accessToken');
      const res = await fetch('/api/chatbot/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' ,
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          teamId: activeTeamId, 
          message: userMsgText,
          userId: user.email // sending context if needed
        })
      });

      if (!res.ok) throw new Error('Failed to send message');

      const data = await res.json();
      
      // Append Bot Response
      setTeams(prev => prev.map(team => {
        if (team._id === activeTeamId) {
          return { 
            ...team, 
            messages: [...team.messages, { id: (Date.now() + 1).toString(), sender: 'system', text: data.response }] 
          };
        }
        return team;
      }));

    } catch (err) {
      console.error(err);
      // Optional: Add an error message to the chat
    }
  };

  // --- 6. Upload Docs ---
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && activeTeamId) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('teamId', activeTeamId);

      // Optimistic update (optional, usually better to wait for server URL)
      // For now, let's show a loading state or just wait
      
      try {
            const token=localStorage.getItem('accessToken');
        const res = await fetch('/api/chatbot/upload-docs', {
          method: 'POST',
        headers: {
            'Content-Type':'application/json',
            'Authorization': `Bearer ${token}`
        },
          body: formData,
        });

        if (!res.ok) throw new Error('Upload failed');

        const data = await res.json();

        setTeams(prev => prev.map(team => {
          if (team._id === activeTeamId) {
            return { 
              ...team, 
              files: [...team.files, { name: data.fileName || file.name, size: data.fileSize || 'Unknown', url: data.url }] 
            };
          }
          return team;
        }));
      } catch (err) {
        console.error(err);
        alert('File upload failed');
      }
    }
  };

  const enterTeam = (id: string) => {
    setActiveTeamId(id);
    setView('TEAM_VIEW');
  };

  const resetForm = () => {
    setFormData({ name: '', password: '' });
    setModalType(null);
    setError('');
  };

  const activeTeam = teams.find(t => t._id === activeTeamId);

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-indigo-500/30">
      <Navbar />

      {/* --- DASHBOARD VIEW --- */}
      {view === 'MAIN' && (
        <main className="flex-1 max-w-6xl mx-auto w-full p-8">
          <header className="mb-10 flex justify-between items-end">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Welcome, {user.name}</h1>
              <p className="text-slate-400">Manage your active teams or join a new collaboration.</p>
            </div>
            <button 
              onClick={() => setUser(null)} 
              className="text-sm text-slate-500 hover:text-red-400 transition-colors"
            >
              Log Out
            </button>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Create Team Card */}
            <button
              onClick={() => setModalType('CREATE')}
              className="group flex flex-col items-center justify-center h-64 border-2 border-dashed border-slate-700 rounded-2xl hover:border-indigo-500 hover:bg-slate-900/50 transition-all duration-300"
            >
              <div className="w-14 h-14 bg-slate-800 rounded-full flex items-center justify-center mb-4 group-hover:bg-indigo-600 group-hover:text-white transition-colors text-slate-400">
                <Plus className="w-7 h-7" />
              </div>
              <span className="text-lg font-medium text-slate-300 group-hover:text-indigo-400">Create New Team</span>
            </button>

             {/* Join Team Card */}
             <button
              onClick={() => setModalType('JOIN')}
              className="group flex flex-col items-center justify-center h-64 border-2 border-dashed border-slate-700 rounded-2xl hover:border-emerald-500 hover:bg-slate-900/50 transition-all duration-300"
            >
              <div className="w-14 h-14 bg-slate-800 rounded-full flex items-center justify-center mb-4 group-hover:bg-emerald-600 group-hover:text-white transition-colors text-slate-400">
                <LogIn className="w-7 h-7" />
              </div>
              <span className="text-lg font-medium text-slate-300 group-hover:text-emerald-400">Join Existing Team</span>
            </button>

            {/* List Teams */}
            {teams.map((team) => (
              <div
                key={team._id}
                onClick={() => enterTeam(team._id)}
                className="h-64 bg-slate-900 rounded-2xl border border-slate-800 p-6 flex flex-col justify-between hover:border-indigo-500/50 hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-1 transition-all cursor-pointer group relative"
              >
                {team.creator._id == user?._id && (
                    <div className="absolute top-4 right-4 bg-indigo-600 text-white text-xs font-semibold px-2 py-1 rounded-full">Owner</div>    
                )}
                {/* Delete Button (Stop Propagation) */}
                <button 
                  onClick={(e) => handleDeleteTeam(e, team._id)}
                  className="absolute top-4 right-4 p-2 text-slate-600 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                  title="Delete Team"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center text-indigo-400 border border-slate-700">
                      <MessageSquare className="w-6 h-6" />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-white group-hover:text-indigo-400 transition-colors truncate">{team.name}</h3>
                  <p className="text-slate-500 text-sm mt-2">{team.messages?.length || 0} messages • {team.files?.length || 0} files</p>
                </div>
                <div className="flex items-center text-sm font-semibold text-indigo-400 group-hover:translate-x-1 transition-transform">
                  Open Workspace <ArrowRight className="w-4 h-4 ml-2" />
                </div>
              </div>
            ))}
          </div>
        </main>
      )}

      {/* --- TEAM CHAT VIEW --- */}
      {view === 'TEAM_VIEW' && activeTeam && (
        <div className="flex flex-1 overflow-hidden">
          <aside className="w-80 bg-slate-900 border-r border-slate-800 flex flex-col">
            <div className="p-6 border-b border-slate-800">
              <button onClick={() => setView('MAIN')} className="text-sm text-slate-400 hover:text-white mb-6 flex items-center gap-2 transition-colors">
                &larr; Back
              </button>
              <h2 className="text-xl font-bold text-white flex items-center gap-3 truncate">
                <div className="p-2 bg-indigo-600 rounded-lg"><Users className="w-5 h-5" /></div>
                <span className="truncate">{activeTeam.name}</span>
              </h2>
            </div>
            {
                activeTeam.creator._id == user?._id && (  
            
            <div className="flex-1 p-4 overflow-y-auto">
              <label className="flex flex-col items-center justify-center w-full p-6 border-2 border-dashed border-slate-700 rounded-xl hover:border-indigo-500 hover:bg-slate-800/50 transition-all cursor-pointer group mb-6">
                <Upload className="w-8 h-8 text-slate-500 group-hover:text-indigo-400 mb-2" />
                <span className="text-sm text-slate-400 group-hover:text-indigo-300">Upload File</span>
                <input type="file" className="hidden" onChange={handleFileUpload} />
              </label>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Repository</h3>
              <div className="space-y-2">
                {activeTeam.files?.map((file, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg border border-slate-800">
                    <FileText className="w-8 h-8 text-indigo-400 shrink-0" />
                    <div className="overflow-hidden">
                      <p className="text-sm font-medium text-slate-200 truncate">{file.name}</p>
                      <p className="text-xs text-slate-500">{file.size}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            )}
          </aside>
          <main className="flex-1 flex flex-col bg-slate-950 relative">
            <div className="flex-1 p-8 overflow-y-auto space-y-6">
              {activeTeam.messages?.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] px-6 py-4 rounded-2xl text-sm leading-relaxed ${msg.sender === 'user' ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none'}`}>{msg.text}</div>
                </div>
              ))}
            </div>
            <div className="p-6 bg-slate-950 border-t border-slate-800">
              <form onSubmit={handleSendMessage} className="flex items-center gap-4 max-w-4xl mx-auto">
                <input 
                  type="text" 
                  value={chatInput} 
                  onChange={(e) => setChatInput(e.target.value)} 
                  placeholder="Type your message..." 
                  className="flex-1 px-6 py-4 bg-slate-900 border border-slate-800 rounded-full text-white focus:border-indigo-500 outline-none transition-all" 
                />
                <button type="submit" className="p-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full transition-colors"><Send className="w-5 h-5" /></button>
              </form>
            </div>
          </main>
        </div>
      )}

      {/* --- MODAL --- */}
      {modalType && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">{modalType === 'CREATE' ? 'Create Workspace' : 'Join Workspace'}</h2>
              <button onClick={resetForm}><X className="w-5 h-5 text-slate-500 hover:text-white" /></button>
            </div>
            <form onSubmit={modalType === 'CREATE' ? handleCreateTeam : handleJoinTeam} className="p-6 space-y-5">
              {error && <div className="p-3 bg-red-500/10 text-red-400 text-sm rounded-lg border border-red-500/20">{error}</div>}
              <div><label className="block text-sm text-slate-400 mb-2">Team Name</label><input type="text" disabled={isLoading} value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-lg text-white outline-none focus:border-indigo-500 disabled:opacity-50" /></div>
              <div><label className="block text-sm text-slate-400 mb-2">Password</label><input type="password" disabled={isLoading} value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-lg text-white outline-none focus:border-indigo-500 disabled:opacity-50" /></div>
              <button type="submit" disabled={isLoading} className="w-full mt-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 text-white font-semibold py-3.5 rounded-lg flex justify-center items-center gap-2">
                {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                {modalType === 'CREATE' ? 'Launch Team' : 'Enter Team'}
              </button>
            </form>
          </div>
        </div>
      )}

      {!user && <Footer />}
    </div>
  );
}