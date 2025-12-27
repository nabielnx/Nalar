"use client";
import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

// Komponen SVG Logo Google yang asli
const GoogleLogo = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1 .67-2.26 1.07-3.71 1.07-2.87 0-5.3-1.94-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
        <path d="M5.84 14.11c-.22-.66-.35-1.36-.35-2.11s.13-1.45.35-2.11V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.83z" fill="#FBBC05" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.86-2.59 3.3-4.52 6.16-4.52z" fill="#EA4335" />
    </svg>
);

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

    const handleGoogleLogin = async () => {
        setLoading(true);
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                // redirectTo memastikan user balik ke web Lu setelah login sukses
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
                setMessage({ type: 'success', text: "Cek inbox/spam email buat verifikasi!" });
            }
        }
        setLoading(false);
    };

    return (
        <main className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-white selection:bg-blue-500/30 font-sans">
            <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 w-full max-w-md shadow-2xl overflow-hidden relative">
                <header className="mb-8 text-center">
                    <h1 className="text-4xl font-black text-blue-500 tracking-tighter italic">NALAR.</h1>
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
                    <GoogleLogo />
                    Masuk dengan Google
                </button>

                <div className="relative mb-6">
                    <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-800"></span></div>
                    <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest"><span className="bg-slate-900 px-3 text-slate-500 font-bold">Atau pakai Email</span></div>
                </div>

                <form onSubmit={handleLogin} className="flex flex-col gap-4">
                    <input
                        type="email"
                        placeholder="Email Address"
                        className="p-4 bg-slate-800/50 rounded-xl border border-slate-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        className="p-4 bg-slate-800/50 rounded-xl border border-slate-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm"
                        value={password}
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