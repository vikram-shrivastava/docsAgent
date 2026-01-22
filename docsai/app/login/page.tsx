"use client";
import { useState } from "react";
import api from "@/lib/api";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Login() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post("/auth/login", form);
      localStorage.setItem("token", res.data.accessToken);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      router.push("/dashboard");
    } catch (err) {
      alert("Login failed");
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-gray-50">
      <form onSubmit={handleLogin} className="p-8 bg-white shadow rounded w-96">
        <h1 className="text-2xl font-bold mb-4">Login</h1>
        <input 
          type="email" placeholder="Email" className="w-full border p-2 mb-2"
          onChange={(e) => setForm({...form, email: e.target.value})}
        />
        <input 
          type="password" placeholder="Password" className="w-full border p-2 mb-4"
          onChange={(e) => setForm({...form, password: e.target.value})}
        />
        <button className="w-full bg-blue-600 text-white py-2 rounded">Login</button>
        <p className="mt-4 text-center">
          Don't have an account? <Link href="/register" className="text-blue-500">Register</Link>
        </p>
      </form>
    </div>
  );
}