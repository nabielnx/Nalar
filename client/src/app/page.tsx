"use client";
import { createClient } from "@/utils/supabase/client";
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
  FolderCode,
  Sparkles,
  Zap
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
    await supabase.auth.signOut();
    router.push("/login");
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



  return (
    <main className="flex h-screen overflow-hidden text-slate-200 font-sans selection:bg-blue-500/30 selection:text-white">

      {/* --- MOBILE BACKDROP --- */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-[60] md:hidden backdrop-blur-md transition-all duration-500" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* --- SIDEBAR GLASS PANEL --- */}
      <aside className={`
        fixed inset-y-4 left-4 z-[70] w-72 rounded-2xl flex flex-col glass-panel shadow-2xl shadow-black/50
        transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) transform border border-white/5
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-[120%]"}
        md:relative md:translate-x-0 md:flex md:inset-auto md:h-[calc(100vh-2rem)] md:my-4 md:ml-4
      `}>
        {/* LOGO AREA */}
        <div className="p-6 flex justify-between items-center border-b border-white/5">
          <div className="flex items-center gap-3 group">
            <div className="p-2.5 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/40 transition-all duration-300">
              <Terminal size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-1">
                NALAR<span className="text-blue-500 text-2xl animate-pulse"></span>
              </h1>
              <p className="text-[10px] text-slate-500 font-medium tracking-wider">AI CODING MENTOR</p>
            </div>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden p-2 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* SIDEBAR CONTENT */}
        <div className="flex-1 overflow-y-auto px-4 py-6 scrollbar-thin">
          <button
            onClick={handleNewProject}
            className="w-full mb-8 p-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm shadow-lg shadow-blue-900/20 hover:shadow-blue-500/30 transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2 group border border-blue-400/20"
          >
            <Plus size={18} /> New Workspace
          </button>

          <div className="flex items-center gap-2 mb-4 px-2 text-slate-500">
            <FolderCode size={14} className="text-blue-500" />
            <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Your Projects</h2>
          </div>

          <div className="flex flex-col gap-1.5">
            {savedProjects.map((p) => (
              <button
                key={p.id}
                onClick={() => { setCode(p.code_content); setIsSidebarOpen(false); }}
                className="group flex items-center justify-between p-3 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/5 transition-all duration-200"
              >
                <div className="flex flex-col text-left truncate w-full">
                  <span className="text-sm font-medium text-slate-300 group-hover:text-blue-400 transition-colors truncate">{p.title}</span>
                  <span className="text-[10px] text-slate-500 mt-0.5 font-mono opacity-60">
                    {new Date(p.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* USER PROFILE */}
        <div className="p-4 border-t border-white/5 bg-black/20">
          <div className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors group">
            <div className="flex items-center gap-3 truncate">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-slate-800 to-slate-700 text-slate-200 flex items-center justify-center text-xs font-bold ring-1 ring-white/10 shadow-inner">
                {user?.email?.charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col truncate">
                <span className="text-xs font-medium truncate text-slate-200 group-hover:text-white transition-colors">{user?.email?.split('@')[0]}</span>
                <span className="text-[10px] text-slate-500 truncate">Pro Plan</span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* --- MAIN WORKSPACE --- */}
      <section className="flex-1 flex flex-col min-w-0 h-full relative">
        <div className="absolute inset-0 pointer-events-none bg-[url('/grid.svg')] opacity-[0.03]" />

        {/* TOP NAVBAR */}
        <nav className="h-20 flex items-center justify-between px-6 md:px-8 bg-transparent relative z-10 w-full max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2.5 glass-button rounded-xl text-slate-400 hover:text-white">
              <Menu size={20} />
            </button>
            <div className="hidden md:flex items-center gap-3 glass-panel px-4 py-2 rounded-full">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
              <span className="text-xs font-medium text-slate-300">Python Environment Ready</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={isLoading}
              className="px-4 py-2.5 glass-button rounded-xl text-slate-300 transition-all flex items-center gap-2 text-sm font-medium disabled:opacity-50 hover:text-white group"
            >
              <Save size={16} className="text-slate-400 group-hover:text-blue-400 transition-colors" />
              <span className="hidden sm:inline">Save</span>
            </button>
            <button
              onClick={handleRun}
              disabled={isLoading}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-bold transition-all flex items-center gap-2.5 text-sm shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 disabled:opacity-50 transform hover:-translate-y-0.5 active:translate-y-0"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Play size={16} fill="currentColor" />
              )}
              Run Code
            </button>
          </div>
        </nav>

        {/* EDITOR & OUTPUT GRID */}
        <div className="flex-1 p-4 md:p-6 md:pt-2 overflow-hidden w-full max-w-[1600px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full pb-2">

            {/* ---> LEFT: EDITOR PANEL */}
            <div className="flex flex-col gap-4 h-full relative group">
              {/* Decorative Glow */}
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

              <div className="flex-1 glass-panel rounded-2xl overflow-hidden shadow-2xl relative flex flex-col border-opacity-50">
                {/* Editor Header */}
                <div className="h-10 bg-[#0f172a]/80 border-b border-white/5 flex items-center px-4 justify-between backdrop-blur-md">
                  <div className="flex items-center gap-2">
                    <Code2 size={14} className="text-blue-400" />
                    <span className="text-xs font-medium text-slate-400 font-mono">main.py</span>
                  </div>
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-700 hover:bg-slate-600 transition-colors" />
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-700 hover:bg-slate-600 transition-colors" />
                  </div>
                </div>

                {/* Monaco Editor */}
                <div className="flex-1 relative bg-[#0f172a]/50">
                  <Editor
                    height="100%"
                    theme="vs-dark"
                    defaultLanguage="python"
                    value={code}
                    onChange={(v) => setCode(v || "")}
                    options={{
                      fontSize: 15,
                      fontFamily: 'JetBrains Mono, monospace',
                      fontLigatures: true,
                      minimap: { enabled: false },
                      padding: { top: 24, bottom: 24 },
                      lineNumbers: 'on',
                      lineHeight: 28,
                      scrollBeyondLastLine: false,
                      smoothScrolling: true,
                      cursorBlinking: "smooth",
                      cursorSmoothCaretAnimation: "on",
                      renderLineHighlight: "line",
                    }}
                  />
                </div>
              </div>
            </div>

            {/* ---> RIGHT: OUTPUT & AI PANEL */}
            <div className="flex flex-col gap-6 h-full overflow-hidden">

              {/* 1. TERMINAL OUTPUT */}
              <div className="glass-panel rounded-2xl overflow-hidden flex flex-col h-[45%] shadow-xl relative group border-opacity-50">


                <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between bg-black/20">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Console Output</span>
                  </div>
                  <span className="text-[10px] text-slate-600 font-mono">bash --v</span>
                </div>

                <div className="p-5 font-mono text-sm overflow-auto flex-1 custom-scrollbar bg-[#050912]/50">
                  <pre className={`leading-relaxed ${output ? 'text-emerald-400' : 'text-slate-600 italic'}`}>
                    {output || "> Ready to execute..."}
                  </pre>
                  {error && (
                    <div className="mt-4 p-4 bg-red-500/5 rounded-xl border border-red-500/20 animate-in fade-in slide-in-from-bottom-2">
                      <div className="flex items-center gap-2 mb-2 text-red-400 font-bold text-xs uppercase tracking-wider">
                        <X size={14} strokeWidth={3} /> Runtime Error
                      </div>
                      <pre className="text-red-300 whitespace-pre-wrap">{error}</pre>
                    </div>
                  )}
                </div>
              </div>

              {/* 2. AI ASSISTANT */}
              <div className="flex-1 flex flex-col gap-4 min-h-0">
                {error && !aiExplanation && (
                  <button
                    onClick={handleAskAI}
                    disabled={isLoading}
                    className="w-full p-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 rounded-2xl font-bold text-white flex items-center justify-center gap-3 transition-all shadow-xl shadow-fuchsia-900/20 group transform hover:scale-[1.02]"
                  >
                    <Sparkles size={20} className="group-hover:animate-spin-slow" />
                    <span>Analyze Error with Nalar AI</span>
                  </button>
                )}

                {/* AI RESULT CARD */}
                <div className={`
                  flex-1 glass-panel rounded-2xl p-6 overflow-hidden relative border-opacity-50 transition-all duration-500
                  ${aiExplanation ? 'opacity-100 translate-y-0' : 'opacity-50 translate-y-4 bg-black/20'}
                `}>
                  {!aiExplanation ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-600 text-center gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center border border-white/5">
                        <Cpu size={32} />
                      </div>
                      <div>
                        <p className="text-sm font-medium">AI Assistant is Idle</p>
                        <p className="text-xs opacity-60 mt-1">Run code or encounter errors to activate</p>
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex flex-col">
                      <div className="flex items-center gap-3 mb-6 shrink-0">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white shadow-lg shadow-violet-500/20">
                          <Sparkles size={20} />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-white uppercase tracking-tight flex items-center gap-2">
                            Nalar Intelligence <span className="px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-300 text-[9px]">BETA</span>
                          </h3>
                          <p className="text-[10px] text-slate-400 font-medium">Powered by Llama 3</p>
                        </div>
                      </div>

                      <div className="overflow-y-auto pr-2 custom-scrollbar flex-1">
                        <div className="prose prose-invert prose-sm max-w-none prose-p:text-slate-300 prose-headings:text-white prose-strong:text-violet-400 prose-code:text-pink-400 prose-code:bg-white/5 prose-code:px-1 prose-code:rounded prose-code:before:content-none prose-code:after:content-none">
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