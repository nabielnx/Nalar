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
    <main className="flex h-screen overflow-hidden text-slate-200 font-sans selection:bg-blue-500/30 selection:text-white bg-[#020617]">

      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-[60] md:hidden backdrop-blur-md transition-all duration-500" onClick={() => setIsSidebarOpen(false)} />
      )}

      <aside className={`
        fixed inset-y-4 left-4 z-[70] w-72 rounded-2xl flex flex-col bg-[#0b0f1a]/80 backdrop-blur-xl shadow-2xl
        transition-all duration-500 transform border border-white/5
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-[120%]"}
        md:relative md:translate-x-0 md:flex md:inset-auto md:h-[calc(100vh-2rem)] md:my-4 md:ml-4
      `}>
        <div className="p-6 flex justify-between items-center border-b border-white/5">
          <div className="flex items-center gap-3 group">
            <div className="p-2.5 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-lg shadow-blue-500/20">
              <Terminal size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white italic">NALAR.</h1>
              <p className="text-[10px] text-slate-500 font-medium tracking-wider">AI MENTOR</p>
            </div>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden p-2 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-6 scrollbar-thin">
          <button
            onClick={handleNewProject}
            className="w-full mb-8 p-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm shadow-lg shadow-blue-900/20 transition-all flex items-center justify-center gap-2 group border border-blue-400/20"
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
                onClick={() => loadProject(p)} // Memanggil loadProject agar penjelasan AI ikut ditarik
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

        <div className="p-4 border-t border-white/5 bg-black/20">
          <div className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/5 transition-colors group">
            <div className="flex items-center gap-3 truncate">
              <div className="w-9 h-9 rounded-lg bg-slate-800 text-slate-200 flex items-center justify-center text-xs font-bold ring-1 ring-white/10 shadow-inner">
                {user?.email?.charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col truncate">
                <span className="text-xs font-medium truncate text-slate-200 group-hover:text-white">{user?.email?.split('@')[0]}</span>
                <span className="text-[10px] text-slate-500 truncate">Pro Plan</span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
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
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
              <span className="text-xs font-medium text-slate-300">Environment Ready</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={isLoading}
              className="px-4 py-2.5 bg-slate-800 rounded-xl text-slate-300 transition-all flex items-center gap-2 text-sm font-medium hover:text-white"
            >
              <Save size={16} />
              <span className="hidden sm:inline">Save</span>
            </button>
            <button
              onClick={handleRun}
              disabled={isLoading}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all flex items-center gap-2.5 text-sm shadow-lg shadow-blue-500/20 disabled:opacity-50"
            >
              <Play size={16} fill="currentColor" />
              Run Code
            </button>
          </div>
        </nav>

        <div className="flex-1 p-4 md:p-6 md:pt-2 overflow-hidden w-full max-w-[1600px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full pb-2">

            <div className="flex flex-col gap-4 h-full">
              <div className="flex-1 bg-[#0f172a] rounded-2xl overflow-hidden shadow-2xl relative flex flex-col border border-white/5">
                <div className="h-10 bg-[#0f172a] border-b border-white/5 flex items-center px-4 justify-between backdrop-blur-md">
                  <div className="flex items-center gap-2">
                    <Code2 size={14} className="text-blue-400" />
                    <span className="text-xs font-medium text-slate-400 font-mono">main.py</span>
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

            <div className="flex flex-col gap-6 h-full overflow-hidden">
              <div className="bg-[#050912] rounded-2xl overflow-hidden flex flex-col h-[45%] shadow-xl border border-white/5">
                <div className="px-4 py-3 border-b border-white/5 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Terminal</span>
                </div>
                <div className="p-5 font-mono text-sm overflow-auto flex-1 bg-[#050912]">
                  <pre className={`leading-relaxed ${output ? 'text-emerald-400' : 'text-slate-600 italic'}`}>{output || "> Engine ready..."}</pre>
                  {error && (
                    <div className="mt-4 p-4 bg-red-500/5 rounded-xl border border-red-500/20">
                      <pre className="text-red-300 whitespace-pre-wrap">{error}</pre>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex-1 flex flex-col gap-4 min-h-0 overflow-hidden">
                {error && !aiExplanation && (
                  <button
                    onClick={handleAskAI}
                    disabled={isLoading}
                    className="w-full p-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-2xl font-bold text-white flex items-center justify-center gap-3 transition-all shadow-xl"
                  >
                    <Sparkles size={20} />
                    <span>Analyze with Nalar AI</span>
                  </button>
                )}

                <div className={`flex-1 bg-slate-900/50 rounded-2xl p-6 overflow-hidden border border-white/5 transition-all duration-500 ${aiExplanation ? 'opacity-100' : 'opacity-50'}`}>
                  {!aiExplanation ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-600 text-center gap-3">
                      <Cpu size={32} />
                      <p className="text-xs uppercase tracking-widest font-bold">AI Assistant Idle</p>
                    </div>
                  ) : (
                    <div className="h-full flex flex-col">
                      <div className="flex items-center gap-3 mb-6 shrink-0">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white"><Sparkles size={20} /></div>
                        <div>
                          <h3 className="text-sm font-bold text-white tracking-tight italic">NALAR INTELLIGENCE</h3>
                          <p className="text-[10px] text-slate-400 font-medium">Mentoring with Llama 3</p>
                        </div>
                      </div>
                      <div className="overflow-y-auto pr-2 custom-scrollbar flex-1">
                        {/* Render Markdown dari database agar rapi */}
                        <div className="prose prose-invert prose-sm max-w-none prose-p:text-slate-300 prose-strong:text-violet-400">
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