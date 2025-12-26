"use client";
import { supabase } from "@/lib/supabase";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Editor from "@monaco-editor/react";
import ReactMarkdown from "react-markdown";
import axios from "axios";
import {
  Terminal,
  Plus,
  Play,
  Save,
  Cpu,
  LogOut,
  X,
  Menu,
  Code2,
  ChevronRight,
  FolderCode
} from "lucide-react";

export default function Home() {
  const [code, setCode] = useState("# Ketik kodemu di sini\nprint('Halo Nalar!')");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [aiExplanation, setAiExplanation] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [savedProjects, setSavedProjects] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  // 1. FUNGSI LOGOUT (Ini yang tadi hilang/bikin merah)
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login"); // Balik ke halaman login setelah logout
  };

  const fetchProjects = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (!error && data) setSavedProjects(data);
  }, []);

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
  }, [router, fetchProjects]);

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
    if (!user) return;
    setIsLoading(true);
    const projectTitle = prompt("Nama Project:", "Latihan Baru");
    const { error } = await supabase.from('projects').insert([{
      code_content: code,
      title: projectTitle || "Untitled Project",
      user_id: user.id
    }]);
    if (!error) await fetchProjects(user.id);
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

  if (!user) return <div className="bg-slate-950 min-h-screen" />;

  return (
    <main className="flex min-h-screen bg-[#020617] text-slate-200 font-sans selection:bg-blue-500/30">

      {/* --- MOBILE BACKDROP --- */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/80 z-[60] md:hidden backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* --- SIDEBAR --- */}
      <aside className={`
        fixed inset-y-0 left-0 z-[70] w-72 bg-[#0b0f1a] border-r border-slate-800/60 flex flex-col 
        transition-all duration-300 ease-in-out transform
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
        md:relative md:translate-x-0 md:flex
      `}>
        <div className="p-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Terminal size={20} className="text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white">NALAR<span className="text-blue-500">.</span></h1>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden p-1 hover:bg-slate-800 rounded">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-2">
          <button
            onClick={handleNewProject}
            className="w-full mb-8 p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 text-slate-300 font-semibold text-sm hover:bg-blue-600 hover:text-white hover:border-blue-500 transition-all flex items-center justify-center gap-2 group"
          >
            <Plus size={16} /> New Project
          </button>

          <div className="flex items-center gap-2 mb-4 px-2 text-slate-500">
            <FolderCode size={14} />
            <h2 className="text-[11px] font-bold uppercase tracking-[0.2em]">Recent Work</h2>
          </div>

          <div className="flex flex-col gap-1">
            {savedProjects.map((p) => (
              <button
                key={p.id}
                onClick={() => { setCode(p.code_content); setIsSidebarOpen(false); }}
                className="group flex items-center justify-between p-3 rounded-xl hover:bg-slate-800/50 border border-transparent hover:border-slate-700/50 transition-all"
              >
                <div className="flex flex-col text-left truncate">
                  <span className="text-sm font-medium text-slate-300 group-hover:text-white truncate">{p.title}</span>
                  <span className="text-[10px] text-slate-500">Updated {new Date(p.created_at).toLocaleDateString()}</span>
                </div>
                <ChevronRight size={14} className="text-slate-600 opacity-0 group-hover:opacity-100 transition-all" />
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 bg-[#0b0f1a] border-t border-slate-800/60">
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-800/20 border border-slate-800/50">
            <div className="flex items-center gap-3 truncate">
              <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-500 flex items-center justify-center text-xs font-bold border border-blue-500/20">
                {user.email?.charAt(0).toUpperCase()}
              </div>
              <span className="text-xs font-medium truncate text-slate-400">{user.email}</span>
            </div>
            {/* TOMBOL LOGOUT (Sekarang sudah punya fungsi handleLogout) */}
            <button onClick={handleLogout} className="p-2 text-slate-500 hover:text-red-400 transition-colors">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <section className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* TOP NAV */}
        <nav className="h-16 border-b border-slate-800/60 flex items-center justify-between px-6 bg-[#020617]/80 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2 text-slate-400 hover:text-white">
              <Menu size={24} />
            </button>
            <div className="flex items-center gap-2">
              <Code2 size={18} className="text-blue-500" />
              <span className="text-sm font-semibold text-slate-300">Editor Workspace</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={isLoading}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-all flex items-center gap-2 text-sm font-medium disabled:opacity-50"
            >
              <Save size={16} /> <span className="hidden sm:inline">Save</span>
            </button>
            <button
              onClick={handleRun}
              disabled={isLoading}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold transition-all flex items-center gap-2 text-sm shadow-lg shadow-blue-900/20 disabled:opacity-50"
            >
              <Play size={16} fill="currentColor" /> {isLoading ? "Running..." : "Run Code"}
            </button>
          </div>
        </nav>

        <div className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-6xl mx-auto grid grid-cols-1 xl:grid-cols-2 gap-6 h-full">

            {/* EDITOR SECTION */}
            <div className="flex flex-col gap-4">
              <div className="flex-1 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-[#1e1e1e]">
                <Editor
                  height="100%"
                  theme="vs-dark"
                  defaultLanguage="python"
                  value={code}
                  onChange={(v) => setCode(v || "")}
                  options={{
                    fontSize: 14,
                    fontFamily: 'JetBrains Mono, Menlo, monospace',
                    minimap: { enabled: false },
                    padding: { top: 20 },
                    lineNumbersMinChars: 3,
                  }}
                />
              </div>
            </div>

            {/* OUTPUT & AI SECTION */}
            <div className="flex flex-col gap-6">
              <div className="bg-[#0b0f1a] rounded-2xl border border-slate-800 overflow-hidden flex flex-col h-[350px] shadow-xl">
                <div className="px-4 py-3 border-b border-slate-800 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Terminal Output</span>
                </div>
                <div className="p-5 font-mono text-sm overflow-auto flex-1">
                  <pre className="text-slate-300 leading-relaxed">{output || "> Engine ready..."}</pre>
                  {error && <pre className="text-red-400 mt-4 p-3 bg-red-500/5 rounded-lg border border-red-500/20">{error}</pre>}
                </div>
              </div>

              {error && (
                <button
                  onClick={handleAskAI}
                  className="w-full p-4 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all shadow-lg shadow-indigo-900/20"
                >
                  <Cpu size={20} /> Debug with Nalar AI
                </button>
              )}

              {aiExplanation && (
                <div className="bg-slate-900/40 rounded-2xl border border-blue-500/20 p-6 animate-in slide-in-from-bottom-2 duration-300">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-900/40">
                      <Cpu size={20} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white uppercase tracking-tight">AI Insights</h3>
                      <p className="text-[10px] text-slate-500 font-medium">Mentor Nalar Engine</p>
                    </div>
                  </div>

                  {/* BAGIAN YANG DIPERBAIKI: Gunakan ReactMarkdown */}
                  <div className="prose prose-invert prose-sm max-w-none text-slate-300 border-t border-slate-800/60 pt-4">
                    <ReactMarkdown
                      components={{
                        // Custom styling biar enak dibaca anak sekolah
                        p: ({ children }) => <p className="mb-3 leading-relaxed">{children}</p>,
                        strong: ({ children }) => <strong className="text-blue-400 font-bold">{children}</strong>,
                        code: ({ children }) => <code className="bg-slate-800 px-1.5 py-0.5 rounded text-pink-400 font-mono text-xs">{children}</code>,
                        ul: ({ children }) => <ul className="list-disc ml-5 mb-3 space-y-1 text-slate-400">{children}</ul>,
                      }}
                    >
                      {aiExplanation}
                    </ReactMarkdown>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}