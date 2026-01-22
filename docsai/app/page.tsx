"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  // UX Improvement: Check if user is already logged in
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      router.push("/dashboard");
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Navbar (Simple) */}
      <nav className="p-6 flex justify-between items-center max-w-7xl mx-auto w-full">
        <div className="text-2xl font-bold tracking-tight">TeamChat.ai</div>
        <div className="space-x-4">
          <Link 
            href="/login" 
            className="text-gray-600 hover:text-black font-medium transition"
          >
            Login
          </Link>
          <Link 
            href="/register" 
            className="bg-black text-white px-5 py-2.5 rounded-full font-medium hover:bg-gray-800 transition"
          >
            Sign Up
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 sm:px-6">
        <div className="max-w-4xl space-y-6">
          <h1 className="text-5xl sm:text-7xl font-extrabold text-gray-900 tracking-tight">
            Chat with your <br />
            <span className="text-blue-600">Team Documents.</span>
          </h1>
          
          <p className="text-xl text-gray-500 max-w-2xl mx-auto">
            Create teams, upload knowledge bases, and let our AI answer your questions instantly. 
            The central hub for your team's intelligence.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
            <Link 
              href="/register" 
              className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-500/30"
            >
              Get Started for Free
            </Link>
            <Link 
              href="/login" 
              className="bg-white text-gray-900 border border-gray-200 px-8 py-4 rounded-lg text-lg font-bold hover:bg-gray-50 transition"
            >
              Existing Member
            </Link>
          </div>
        </div>

        {/* Feature Grid (Optional Visuals) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20 max-w-6xl mx-auto text-left">
          <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
            <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center mb-4 text-blue-600 font-bold">1</div>
            <h3 className="font-bold text-xl mb-2">Create Teams</h3>
            <p className="text-gray-500">Organize your workspace. Create dedicated teams and invite members to collaborate.</p>
          </div>
          <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
            <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center mb-4 text-green-600 font-bold">2</div>
            <h3 className="font-bold text-xl mb-2">Upload Docs</h3>
            <p className="text-gray-500">Securely upload PDFs and text files. We process them instantly for AI retrieval.</p>
          </div>
          <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
            <div className="h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center mb-4 text-purple-600 font-bold">3</div>
            <h3 className="font-bold text-xl mb-2">AI Chat</h3>
            <p className="text-gray-500">Ask questions and get answers based strictly on your uploaded documentation.</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 text-center text-gray-400 text-sm">
        &copy; {new Date().getFullYear()} TeamChat.ai. All rights reserved.
      </footer>
    </div>
  );
}