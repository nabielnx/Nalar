"use client";
import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { Chrome } from "lucide-react";

export default function Login() {
    const supabase = createClient();

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

    // --- FUNGSI LOGIN GOOGLE ---
    const handleGoogleLogin = async () => {
        setLoading(true);
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                // redirectTo memastikan user balik ke web Lu setelah login di Google
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        });

        if (error) {
            setMessage({ type: 'error', text: error.message });
            setLoading(false);
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
                setMessage({ type: 'success', text: "Registrasi Berhasil!" });
                router.push("/");
            } else {
                setMessage({ type: 'success', text: "Cek email buat verifikasi dulu!" });
            }
        }
        setLoading(false);
    };

    return (
        <main className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-white selection:bg-blue-500/30">
            <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 w-full max-w-md shadow-2xl overflow-hidden relative">
                <header className="mb-8 text-center">
                    <h1 className="text-4xl font-black text-blue-500 tracking-tighter">NALAR.</h1>
                    <p className="text-slate-400 text-sm mt-2 font-medium italic">"Bebaskan nalarmu, mulai dengan satu klik."</p>
                </header>

                {/* --- NOTIFIKASI MESSAGE --- */}
                {message && (
                    <div className={`p-4 rounded-xl mb-6 text-sm font-bold border animate-in fade-in zoom-in duration-300 ${message.type === 'error' ? 'bg-red-500/10 border-red-500/50 text-red-400' : 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400'
                        }`}>
                        {message.type === 'error' ? '🚫 ' : '✅ '} {message.text}
                    </div>
                )}

                {/* --- TOMBOL GOOGLE LOGIN --- */}
                <button
                    onClick={handleGoogleLogin}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-3 py-4 px-4 bg-white text-slate-900 rounded-2xl font-bold hover:bg-slate-100 transition-all active:scale-[0.98] mb-6 shadow-xl disabled:opacity-50"
                >
                    <Chrome size={22} className="text-blue-600" />
                    Masuk dengan Google
                </button>

                <div className="relative mb-6">
                    <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-800"></span></div>
                    <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest"><span className="bg-slate-900 px-3 text-slate-500">Atau pakai Email</span></div>
                </div>

                <form onSubmit={handleLogin} className="flex flex-col gap-4">
                    <input
                        type="email"
                        placeholder="Email Address"
                        className="p-4 bg-slate-800/50 rounded-xl border border-slate-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm"
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        className="p-4 bg-slate-800/50 rounded-xl border border-slate-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm"
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />

                    <button
                        type="submit"
                        disabled={loading}
                        className="py-4 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:cursor-not-allowed rounded-xl font-bold text-lg transition-all active:scale-[0.98] mt-2 shadow-lg shadow-blue-900/20"
                    >
                        {loading ? "Memproses..." : "Masuk Sekarang"}
                    </button>

                    <button
                        type="button"
                        onClick={handleSignUp}
                        disabled={loading}
                        className="text-slate-500 text-xs hover:text-slate-300 transition-all font-semibold py-2"
                    >
                        Belum punya akun? Daftar di sini
                    </button>
                </form>
            </div>
        </main>
    );
}