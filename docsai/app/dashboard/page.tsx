"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"created" | "joined">("created");
  const [createdTeams, setCreatedTeams] = useState<any[]>([]);
  const [memberTeams, setMemberTeams] = useState<any[]>([]);
  
  // Modals state
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  
  // Form Data
  const [formData, setFormData] = useState({ teamName: "", teamPassword: "" });

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      const res = await api.get("/teams/get-all");
      setCreatedTeams(res.data.createdTeams);
      setMemberTeams(res.data.memberTeams);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/teams/create", formData);
      setShowCreate(false);
      fetchTeams();
    } catch (err) {
      alert("Error creating team");
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Logic per your request: Join returns teamId and docs
      const res = await api.post("/teams/join", formData);
      // Redirect to team page immediately
      router.push(`/team/${res.data.teamId}`);
    } catch (err) {
      alert("Invalid Name or Password");
    }
  };

  const TeamList = ({ teams }: { teams: any[] }) => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
      {teams.map((team) => (
        <div 
          key={team._id} 
          onClick={() => router.push(`/teams/${team._id}`)}
          className="border p-4 rounded shadow hover:bg-gray-50 cursor-pointer"
        >
          <h3 className="font-bold text-lg">{team.teamName}</h3>
          <p className="text-sm text-gray-500">{team.members.length} Members</p>
          {activeTab === "created" && <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Owner</span>}
        </div>
      ))}
    </div>
  );

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="space-x-4">
          <button onClick={() => setShowJoin(true)} className="px-4 py-2 border rounded">Join Team</button>
          <button onClick={() => setShowCreate(true)} className="px-4 py-2 bg-black text-white rounded">Create Team</button>
        </div>
      </div>

      <div className="flex space-x-4 border-b mb-4">
        <button onClick={() => setActiveTab("created")} className={`pb-2 ${activeTab === 'created' ? 'border-b-2 border-black' : ''}`}>My Teams</button>
        <button onClick={() => setActiveTab("joined")} className={`pb-2 ${activeTab === 'joined' ? 'border-b-2 border-black' : ''}`}>Joined Teams</button>
      </div>

      <TeamList teams={activeTab === "created" ? createdTeams : memberTeams} />

      {/* Simplified Modals */}
      {(showCreate || showJoin) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <form onSubmit={showCreate ? handleCreate : handleJoin} className="bg-white p-6 rounded w-96">
            <h2 className="text-xl mb-4">{showCreate ? "Create Team" : "Join Team"}</h2>
            <input 
              placeholder="Team Name" 
              className="w-full border p-2 mb-2"
              onChange={(e) => setFormData({...formData, teamName: e.target.value})}
            />
            <input 
              type="password" 
              placeholder="Password" 
              className="w-full border p-2 mb-4"
              onChange={(e) => setFormData({...formData, teamPassword: e.target.value})}
            />
            <button type="submit" className="w-full bg-black text-white py-2 rounded">Submit</button>
            <button type="button" onClick={() => {setShowCreate(false); setShowJoin(false)}} className="w-full mt-2 text-gray-500">Cancel</button>
          </form>
        </div>
      )}
    </div>
  );
}