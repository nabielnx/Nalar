"use client";
import { createClient } from "@/utils/supabase/client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Editor from "@monaco-editor/react";
import ReactMarkdown from "react-markdown";
import axios from "axios";
import {
  Terminal, Plus, Play, Save, Cpu, LogOut, X, Menu, Code2,
  ChevronRight, FolderCode, Sparkles
} from "lucide-react";

export default function Home() {
  const supabase = createClient();
  const [code, setCode] = useState("# Ketik kodemu di sini\nprint('Halo Nalar!')");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [aiExplanation, setAiExplanation] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [savedProjects, setSavedProjects] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.push("/login");
    } catch (err) {
      console.error("Logout error:", err);
      // Fallback redirect if signout fails
      router.push("/login");
    }
  };

  const fetchProjects = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (!error && data) setSavedProjects(data);
  }, [supabase]);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
      } else {
        setUser(user);
        fetchProjects(user.id);
      }
    };
    checkUser();
  }, [router, fetchProjects, supabase]);

  const handleRun = async () => {
    setIsLoading(true);
    setError("");
    setOutput("");
    setAiExplanation("");
    try {
      const res = await axios.post("http://localhost:8000/run", { code });
      setOutput(res.data.stdout);
      setError(res.data.stderr);
    } catch (err) {
      setOutput("Backend tidak merespon. Pastikan server lokal sudah jalan.");
    }
    setIsLoading(false);
  };

  const handleAskAI = async () => {
    setIsLoading(true);
    try {
      const res = await axios.post("http://localhost:8000/explain", { code });
      setAiExplanation(res.data.explanation);
    } catch (err) {
      setAiExplanation("Gagal terhubung ke modul AI.");
    }
    setIsLoading(false);
  };

  const handleSave = async () => {
    if (!user) return alert("Login dulu, Jenderal!");
    setIsLoading(true);

    const projectTitle = prompt("Kasih nama projek lu:", "Latihan Nalar");

    // Menyimpan code sekaligus penjelasan AI ke database
    const { error } = await supabase
      .from('projects')
      .insert([{
        title: projectTitle || "Latihan Nalar",
        code_content: code,
        ai_explanation: aiExplanation, // Data AI disimpan di sini
        user_id: user.id
      }]);

    if (error) {
      alert("Gagal simpan, Bro!");
    } else {
      alert("Project & Penjelasan AI berhasil diamankan!");
      await fetchProjects(user.id);
    }
    setIsLoading(false);
  };

  const handleNewProject = () => {
    if (confirm("Buat lembar kerja baru?")) {
      setCode("# Start coding here...");
      setOutput("");
      setAiExplanation("");
      setIsSidebarOpen(false);
    }
  };

  // Fungsi loadProject untuk menarik data lengkap termasuk penjelasan AI
  const loadProject = (project: any) => {
    if (confirm(`Muat projek "${project.title}"? Kodemu yang sekarang bakal keganti.`)) {
      setCode(project.code_content);
      // Mengambil penjelasan AI dari kolom ai_explanation di database
      setAiExplanation(project.ai_explanation || "");
      setOutput("");
      setError("");
      setIsSidebarOpen(false);
    }
  };

  return (
    <main className="flex h-screen overflow-hidden text-neutral-200 font-sans selection:bg-white/10 selection:text-white bg-[#050505]">

      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-[60] md:hidden backdrop-blur-md transition-all duration-500" onClick={() => setIsSidebarOpen(false)} />
      )}

      <aside className={`
        fixed inset-y-4 left-4 z-[70] w-72 rounded-[2rem] flex flex-col liquid-glass
        transition-all duration-500 transform
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-[120%]"}
        md:relative md:translate-x-0 md:flex md:inset-auto md:h-[calc(100vh-2rem)] md:my-4 md:ml-4
      `}>
        <div className="p-8 flex justify-between items-center border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.15)]">
              <Terminal size={20} className="text-black" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tighter text-white">NALAR</h1>
              <p className="text-[9px] text-neutral-500 font-bold tracking-[0.2em]">Ayo Ngoding!</p>
            </div>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden p-2 hover:bg-white/5 rounded-lg text-neutral-400 hover:text-white">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-6 scrollbar-thin">
          <button
            onClick={handleNewProject}
            className="w-full mb-8 p-4 rounded-2xl glass-button text-white font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-3 border border-white/10"
          >
            <Plus size={16} /> New Workspace
          </button>

          <div className="flex items-center gap-2 mb-4 px-2 text-slate-500">
            <FolderCode size={14} className="text-white-500" />
            <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Kodemu</h2>
          </div>

          <div className="flex flex-col gap-1">
            {savedProjects.map((p) => (
              <button
                key={p.id}
                onClick={() => loadProject(p)}
                className="group flex items-center justify-between p-4 rounded-2xl hover:bg-white/[0.03] border border-transparent hover:border-white/5 transition-all duration-300"
              >
                <div className="flex flex-col text-left truncate w-full">
                  <span className="text-sm font-semibold text-neutral-400 group-hover:text-white transition-colors truncate">{p.title}</span>
                  <span className="text-[9px] text-neutral-600 mt-1 font-bold uppercase tracking-widest">
                    {new Date(p.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="p-6 border-t border-white/5 bg-white/[0.01]">
          <div className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.02] border border-white/5 transition-colors group">
            <div className="flex items-center gap-3 truncate">
              <div className="w-9 h-9 rounded-xl bg-white/[0.05] text-white flex items-center justify-center text-xs font-black ring-1 ring-white/10">
                {user?.email ? user.email.charAt(0).toUpperCase() : '?'}
              </div>
              <div className="flex flex-col truncate">
                <span className="text-xs font-bold truncate text-neutral-300 group-hover:text-white uppercase tracking-tight">
                  {user?.email ? user.email.split('@')[0] : 'Guest'}
                </span>
                <span className="text-[9px] text-neutral-600 font-bold uppercase tracking-widest">Authorized</span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-neutral-600 hover:text-white hover:bg-white/5 rounded-xl transition-all"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      <section className="flex-1 flex flex-col min-w-0 h-full relative">
        <nav className="h-20 flex items-center justify-between px-6 md:px-8 bg-transparent relative z-10 w-full max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2.5 bg-slate-800 rounded-xl text-slate-400 hover:text-white">
              <Menu size={20} />
            </button>
            <div className="hidden md:flex items-center gap-3 bg-slate-900/40 px-4 py-2 rounded-full border border-white/5">
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={handleSave}
              disabled={isLoading}
              className="px-5 py-2.5 bg-white/[0.03] border border-white/5 rounded-xl text-neutral-400 transition-all flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest hover:text-white hover:border-white/10"
            >
              <Save size={14} />
              <span className="hidden sm:inline">Simpan Kode</span>
            </button>
            <button
              onClick={handleRun}
              disabled={isLoading}
              className="px-8 py-2.5 bg-white text-black rounded-xl font-black transition-all flex items-center gap-3 text-xs uppercase tracking-widest shadow-[0_0_20px_rgba(255,255,255,0.15)] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
            >
              <Play size={14} fill="currentColor" />
              Jalankan Kode
            </button>
          </div>
        </nav>

        <div className="flex-1 p-4 md:p-6 md:pt-2 overflow-y-auto lg:overflow-hidden w-full max-w-[1600px] mx-auto custom-scrollbar">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:h-full pb-2">

            <div className="flex flex-col gap-4 min-h-[500px] lg:h-full">
              <div className="flex-1 liquid-glass rounded-3xl overflow-hidden relative flex flex-col border border-white/5">
                <div className="h-12 bg-white/[0.02] border-b border-white/5 flex items-center px-6 justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-white/20" />
                    <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Entry: main.py</span>
                  </div>
                </div>
                <div className="flex-1 relative">
                  <Editor
                    height="100%"
                    theme="vs-dark"
                    defaultLanguage="python"
                    value={code}
                    onChange={(v) => setCode(v || "")}
                    options={{ fontSize: 15, fontFamily: 'monospace', minimap: { enabled: false } }}
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-6 min-h-[800px] lg:h-full lg:overflow-hidden">
              <div className="liquid-glass-heavy rounded-3xl overflow-hidden flex flex-col h-[45%] border border-white/10">
                <div className="px-6 py-4 border-b border-white/5 flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.5)] animate-pulse" />
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] text-neutral-400">Terminal Output</span>
                </div>
                <div className="p-6 font-mono text-sm overflow-auto flex-1 bg-black/40">
                  <pre className={`leading-relaxed ${output ? 'text-white' : 'text-neutral-600 italic'}`}>{output || "/// Waiting for execution..."}</pre>
                  {error && (
                    <div className="mt-4 p-5 bg-white/[0.02] rounded-2xl border border-white/5">
                      <pre className="text-neutral-400 text-xs whitespace-pre-wrap">{error}</pre>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex-1 flex flex-col gap-4 min-h-0 overflow-hidden">
                {error && !aiExplanation && (
                  <button
                    onClick={handleAskAI}
                    disabled={isLoading}
                    className="w-full p-5 bg-white text-black rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:scale-[1.01]"
                  >
                    <Sparkles size={18} />
                    <span>Initiate AI Synthesis</span>
                  </button>
                )}

                <div className={`flex-1 liquid-glass rounded-[2rem] p-8 overflow-hidden border border-white/5 transition-all duration-700 ${aiExplanation ? 'opacity-100' : 'opacity-40'}`}>
                  {!aiExplanation ? (
                    <div className="h-full flex flex-col items-center justify-center text-neutral-600 text-center gap-4">
                      <Cpu size={32} strokeWidth={1} />
                      <p className="text-[9px] uppercase tracking-[0.3em] font-black">AI Processor Offline</p>
                    </div>
                  ) : (
                    <div className="h-full flex flex-col">
                      <div className="flex items-center gap-4 mb-8 shrink-0">
                        <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-black shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                          <Sparkles size={24} />
                        </div>
                        <div>
                          <h3 className="text-lg font-black text-white tracking-tighter italic">NALAR</h3>
                          <p className="text-[9px] text-neutral-500 font-bold uppercase tracking-widest">Penjelasan</p>
                        </div>
                      </div>
                      <div className="overflow-y-auto pr-2 custom-scrollbar flex-1">
                        <div className="prose prose-invert prose-sm max-w-none prose-p:text-neutral-400 prose-strong:text-white prose-code:text-white prose-code:bg-white/5 prose-code:px-1 prose-code:rounded">
                          <ReactMarkdown>{aiExplanation}</ReactMarkdown>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>
    </main>
  );
}