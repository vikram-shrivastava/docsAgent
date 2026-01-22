"use client";
import { useState } from "react";
import api from "@/lib/api";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Register() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "" });

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post("/auth/register", form);
      localStorage.setItem("token", res.data.accessToken);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      router.push("/dashboard");
    } catch (err) {
      alert("Registration failed");
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-gray-50">
      <form onSubmit={handleRegister} className="p-8 bg-white shadow rounded w-96">
        <h1 className="text-2xl font-bold mb-4">Register</h1>
        <input 
          type="text" placeholder="Name" className="w-full border p-2 mb-2"
          onChange={(e) => setForm({...form, name: e.target.value})}
        />
        <input 
          type="email" placeholder="Email" className="w-full border p-2 mb-2"
          onChange={(e) => setForm({...form, email: e.target.value})}
        />
        <input 
          type="password" placeholder="Password" className="w-full border p-2 mb-4"
          onChange={(e) => setForm({...form, password: e.target.value})}
        />
        <button className="w-full bg-blue-600 text-white py-2 rounded">Register</button>
        <p className="mt-4 text-center">
          Already have an account? <Link href="/login" className="text-blue-500">Login</Link>
        </p>
      </form>
    </div>
  );
}