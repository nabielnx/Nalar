"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        const { error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
            setMessage({ type: 'error', text: error.message });
            setLoading(false);
        } else {
            router.push("/");
        }
    };

    const handleSignUp = async () => {
        if (!email || !password) {
            setMessage({ type: 'error', text: "Isi email sama password dulu, Jenderal!" });
            return;
        }

        setLoading(true);
        setMessage(null);

        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: `${window.location.origin}/auth/callback`,
            },
        });

        if (error) {
            setMessage({ type: 'error', text: error.message });
        } else {
            if (data.session) {
                setMessage({ type: 'success', text: "Registrasi Berhasil! Lu langsung masuk." });
                router.push("/");
            } else {
                setMessage({ type: 'success', text: "Cek inbox/spam email buat verifikasi dulu!" });
            }
        }
        setLoading(false);
    };

    return (
        <main className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-white">
            <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800 w-full max-w-md shadow-2xl">
                {/* --- HEADER (Tanpa Hamburger) --- */}
                <header className="mb-8 text-center">
                    <h1 className="text-4xl font-black text-blue-500 tracking-tighter">NALAR.</h1>
                    <p className="text-slate-400 text-sm mt-2 font-medium">Masuk untuk simpan projek kodingmu.</p>
                </header>

                {/* --- NOTIFIKASI MESSAGE --- */}
                {message && (
                    <div className={`p-4 rounded-xl mb-6 text-sm font-bold border animate-in fade-in zoom-in duration-300 ${message.type === 'error' ? 'bg-red-500/10 border-red-500/50 text-red-400' : 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400'
                        }`}>
                        {message.type === 'error' ? '🚫 ' : '✅ '} {message.text}
                    </div>
                )}

                <form onSubmit={handleLogin} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] uppercase tracking-widest font-bold text-slate-500 ml-1">Email Address</label>
                        <input
                            type="email"
                            placeholder="nama@email.com"
                            className="p-4 bg-slate-800 rounded-xl border border-slate-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] uppercase tracking-widest font-bold text-slate-500 ml-1">Password</label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            className="p-4 bg-slate-800 rounded-xl border border-slate-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="py-4 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:cursor-not-allowed rounded-xl font-bold text-lg transition-all active:scale-[0.98] mt-2 shadow-lg shadow-blue-900/20"
                    >
                        {loading ? "Memproses..." : "Masuk Sekarang"}
                    </button>

                    <div className="relative my-4">
                        <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-800"></span></div>
                        <div className="relative flex justify-center text-xs uppercase"><span className="bg-slate-900 px-2 text-slate-500 font-bold">Atau</span></div>
                    </div>

                    <button
                        type="button"
                        onClick={handleSignUp}
                        disabled={loading}
                        className="py-3 bg-transparent hover:bg-slate-800 border border-slate-700 rounded-xl font-bold transition-all text-slate-300"
                    >
                        Daftar Akun Baru
                    </button>
                </form>
            </div>
        </main>
    );
}