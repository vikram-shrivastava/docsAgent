"use client";
import { useEffect, useState, useRef } from "react";
import api from "@/lib/api";
import { useParams } from "next/navigation";

// Cloudinary Config (Put these in .env.local usually)
const CLOUDINARY_UPLOAD_PRESET = "Projects"; 
const CLOUDINARY_CLOUD_NAME = "dcc5th5so";

export default function TeamPage() {
  const { id } = useParams();
  const [team, setTeam] = useState<any>(null);
  const [docs, setDocs] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  // Chat State
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [chatId, setChatId] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) setCurrentUser(JSON.parse(userStr));
    fetchTeamData();
  }, []);

  const fetchTeamData = async () => {
    try {
    console.log("Fetching data for Team ID:", id);
      const res = await api.get(`/teams/${id}`);
      setTeam(res.data.team);
      setDocs(res.data.docs);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchChatHistory = async (docId: string) => {
    setIsLoading(true);
    setMessages([]); // Clear previous chat instantly
    setChatId("");   // Clear previous ID
    
    try {
      const res = await api.get(`/chat/get/${docId}`);
      console.log("Chat history response:", res.data);
      if (res.data) {
        setMessages(res.data.messages || []);
        setChatId(res.data.chatId || "");
      }
    } catch (err) {
      console.error("Failed to load history", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 1. Upload to Cloudinary
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

    try {
      const cloudRes = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`, {
        method: "POST",
        body: formData
      });
      const cloudData = await cloudRes.json();
      const url = cloudData.secure_url;

      // 2. Send URL to Backend
      const backendRes = await api.post("/docs/upload", {
        teamId: id,
        title: file.name,
        uploaded_url: url
      });

      // 3. Update UI
      setDocs([backendRes.data.doc, ...docs]);
      alert("File uploaded and processed!");
    } catch (err) {
      console.error("Upload failed", err);
      alert("Upload failed");
    }
  };

  const sendMessage = async () => {
    if (!input || !selectedDoc) return;
    
    const userMsg = { role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);
    const query = input;
    setInput("");

    try {
      const res = await api.post("/chat/message", {
        query: query,
        docId: selectedDoc._id,
        chatId: chatId || undefined // Send chatId if it exists, else undefined
      });

      const aiMsg = { role: "assistant", content: res.data.answer };
      setMessages((prev) => [...prev, aiMsg]);
      // Save the chatId returned from backend for next turn
      if (res.data.chatId) setChatId(res.data.chatId);

    } catch (err) {
      console.error(err);
      setMessages((prev) => [...prev, { role: "assistant", content: "Error connecting to AI." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const isCreator = team && currentUser && team.creator._id === currentUser.id;

  return (
    <div className="flex h-screen">
      {/* SIDEBAR */}
      <div className="w-1/4 bg-gray-100 p-4 border-r overflow-y-auto">
        <h2 className="font-bold text-xl mb-4">{team?.teamName || "Loading..."}</h2>
        
        {/* Upload - Only for Creator */}
        {isCreator && (
          <div className="mb-6">
            <label className="block w-full text-center bg-black text-white py-2 rounded cursor-pointer">
              + Upload Document
              <input type="file" className="hidden" onChange={handleFileUpload} />
            </label>
          </div>
        )}

        <h3 className="font-semibold text-gray-500 mb-2">Documents</h3>
        <div className="space-y-2">
          {docs.map((doc) => (
            <div 
              key={doc._id} 
              onClick={() => {
                setSelectedDoc(doc);
                fetchChatHistory(doc._id);
              }}
              className={`p-2 rounded cursor-pointer truncate ${selectedDoc?._id === doc._id ? "bg-blue-100 border-blue-500 border" : "bg-white"}`}
            >
              {doc.title}
            </div>
          ))}
        </div>
      </div>

      {/* CHAT AREA */}
      <div className="w-3/4 flex flex-col">
        {selectedDoc ? (
          <>
            <div className="p-4 border-b bg-white shadow-sm">
              <span className="font-bold">Chatting with: {selectedDoc.title}</span>
            </div>

            <div className="flex-1 p-4 overflow-y-auto bg-gray-50 space-y-4">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[70%] p-3 rounded-lg ${m.role === "user" ? "bg-blue-600 text-white" : "bg-white border"}`}>
                    {m.content}
                  </div>
                </div>
              ))}
              {isLoading && <div className="text-gray-400 text-sm">AI is thinking...</div>}
            </div>

            <div className="p-4 bg-white border-t flex gap-2">
              <input 
                className="flex-1 border p-2 rounded"
                placeholder="Ask something..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              />
              <button onClick={sendMessage} disabled={isLoading} className="bg-black text-white px-6 rounded">Send</button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            Select a document to start chatting
          </div>
        )}
      </div>
    </div>
  );
}