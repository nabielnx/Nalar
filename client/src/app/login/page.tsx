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
    const [mode, setMode] = useState<'login' | 'register'>('login');
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        if (mode === 'register') {
            if (password !== confirmPassword) {
                setMessage({ type: 'error', text: "Passwords do not match!" });
                setLoading(false);
                return;
            }

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
                    setMessage({ type: 'success', text: "Registration successful!" });
                    router.push("/");
                } else {
                    setMessage({ type: 'success', text: "Please check your email for verification link." });
                }
            }
        } else {
            const { error } = await supabase.auth.signInWithPassword({ email, password });

            if (error) {
                setMessage({ type: 'error', text: error.message });
            } else {
                router.push("/");
            }
        }
        setLoading(false);
    };

    const handleGoogleLogin = async () => {
        setLoading(true);
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        });

        if (error) {
            setMessage({ type: 'error', text: error.message });
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-[#050505] flex items-center justify-center p-6 text-white selection:bg-white/10 font-sans relative overflow-hidden">
            {/* Background elements for depth */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-white/5 rounded-full blur-[120px]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-white/5 rounded-full blur-[120px]" />

            <div className="liquid-glass p-10 rounded-[2rem] w-full max-w-md shadow-2xl overflow-hidden relative border border-white/5">
                <header className="mb-10 text-center">
                    <h1 className="text-5xl font-black text-white tracking-tighter italic drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">NALAR.</h1>
                    <p className="text-neutral-500 text-xs mt-3 font-medium uppercase tracking-[0.3em]">Bebaskan Nalarmu</p>
                </header>

                <div className="flex p-1 bg-white/[0.03] rounded-2xl mb-8 border border-white/5">
                    <button
                        onClick={() => { setMode('login'); setMessage(null); }}
                        className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest rounded-xl transition-all ${mode === 'login' ? 'bg-white/10 text-white shadow-lg' : 'text-neutral-500 hover:text-neutral-300'}`}
                    >
                        Login
                    </button>
                    <button
                        onClick={() => { setMode('register'); setMessage(null); }}
                        className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest rounded-xl transition-all ${mode === 'register' ? 'bg-white/10 text-white shadow-lg' : 'text-neutral-500 hover:text-neutral-300'}`}
                    >
                        Register
                    </button>
                </div>

                {/* --- NOTIFIKASI MESSAGE --- */}
                {message && (
                    <div className={`p-4 rounded-2xl mb-8 text-xs font-bold border backdrop-blur-md animate-in fade-in slide-in-from-top-4 duration-500 ${message.type === 'error' ? 'bg-white/[0.02] border-white/10 text-neutral-400' : 'bg-white/[0.05] border-white/20 text-white'
                        }`}>
                        <div className="flex items-center gap-3">
                            <div className={`w-1.5 h-1.5 rounded-full ${message.type === 'error' ? 'bg-neutral-500' : 'bg-white animate-pulse'}`} />
                            {message.text}
                        </div>
                    </div>
                )}

                {/* --- TOMBOL GOOGLE LOGIN --- */}
                <button
                    onClick={handleGoogleLogin}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-3 py-4 px-4 bg-white text-black rounded-2xl font-bold hover:bg-neutral-200 transition-all active:scale-[0.98] mb-8 shadow-xl disabled:opacity-50"
                >
                    <GoogleLogo />
                    <span className="tracking-tight">Authorize with Google</span>
                </button>

                <div className="relative mb-8">
                    <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-white/5"></span></div>
                    <div className="relative flex justify-center text-[9px] uppercase font-bold tracking-[0.2em]"><span className="bg-[#050505] px-4 text-neutral-600">Secure Protocol</span></div>
                </div>

                <form onSubmit={handleLogin} className="flex flex-col gap-4">
                    <div className="space-y-4">
                        <input
                            type="email"
                            placeholder="Email Address"
                            className="w-full p-4 bg-white/[0.03] rounded-2xl border border-white/5 outline-none focus:border-white/20 focus:bg-white/[0.05] transition-all text-sm placeholder:text-neutral-600"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                        <input
                            type="password"
                            placeholder="Entry Key"
                            className="w-full p-4 bg-white/[0.03] rounded-2xl border border-white/5 outline-none focus:border-white/20 focus:bg-white/[0.05] transition-all text-sm placeholder:text-neutral-600"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="glass-button py-4 mt-4 rounded-2xl font-bold text-base text-white disabled:opacity-50 border border-white/10"
                    >
                        {loading ? "Authenticating..." : "Establish Connection"}
                    </button>

                    <button
                        type="button"
                        onClick={handleSignUp}
                        disabled={loading}
                        className="text-neutral-600 text-[10px] uppercase tracking-widest hover:text-white transition-all font-bold py-4"
                    >
                        Request New Instance
                    </button>
                </form>

                <div className="relative my-8">
                    <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-white/5"></span></div>
                    <div className="relative flex justify-center text-[9px] uppercase font-bold tracking-[0.2em]"><span className="bg-[#050505] px-4 text-neutral-600">Secure Protocol</span></div>
                </div>

                <button
                    onClick={handleGoogleLogin}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-3 py-4 px-4 bg-white text-black rounded-2xl font-bold hover:bg-neutral-200 transition-all active:scale-[0.98] shadow-xl disabled:opacity-50"
                >
                    <GoogleLogo />
                    <span className="tracking-tight">Authorize with Google</span>
                </button>
            </div>
        </main>
    );
}
