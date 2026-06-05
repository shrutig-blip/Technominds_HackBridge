/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, 
  Zap, 
  MessageSquare, 
  CheckSquare, 
  Layers, 
  HelpCircle, 
  History,
  Terminal,
  Sparkles,
  ArrowRight,
  ClipboardList,
  Cpu,
  Menu,
  X,
  FileText,
  Users,
  LayoutDashboard,
  Settings,
  MoreHorizontal,
  UploadCloud,
  FileUp
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { processHackBridgeInput } from './lib/gemini';

const FEATURES = [
  {
    id: 'chaos',
    label: "Hackathon Chaos",
    icon: <MessageSquare className="w-4 h-4" />,
    prefix: "decision",
    placeholder: "Paste messy discussion or .txt logs here...",
    description: "Understand messy team conversations and structured logs. Automatically cleans timestamps.",
    defaultText: "Rahul: Backend ke liye Firebase use karein? \nSneha: No, Supabase is better for SQL. Par auth setup me time lagega. \nRahul: Deadline kal subah hai! We need a README and docs too. \nSneha: I'll handle the DB schema. Rahul, you do the frontend auth. \nRahul: Okay, but who is writing the project workflow? \nSneha: Let's ask the AI to split tasks. Also, we need to explain this to the junior dev who just joined. \nAmit: Wait, I thought we were using MongoDB? \nRahul: Amit, we discussed this 2 hours ago, SQL is better for our relational data. \nAmit: I still think MongoDB is faster to set up. \nSneha: Amit, we don't have time for another debate. Supabase it is. \nRahul: Fine, but Amit, you need to catch up on the schema Sneha designed. \nAmit: Okay, but I'm not happy about it."
  },
  {
    id: 'adaptive',
    label: "Skill Adaptive View",
    icon: <Users className="w-4 h-4" />,
    prefix: "adaptive",
    placeholder: "Paste discussion or concept to adapt for different skill levels...",
    description: "See how the same content is rewritten for Beginner, Intermediate, and Expert levels.",
    defaultText: "Explain how React Server Components work and how we should use them in our project."
  },
  {
    id: 'compare',
    label: "Tech Comparison",
    icon: <Layers className="w-4 h-4" />,
    prefix: "compare",
    placeholder: "Enter technologies to compare... (e.g. 'Tailwind vs Styled Components')",
    description: "Compare tools and technologies with structured pros, cons, and recommendations.",
    defaultText: "Should we use Tailwind CSS or Styled Components for our hackathon project?"
  },
  {
    id: 'docs',
    label: "Generate Docs",
    icon: <FileText className="w-4 h-4" />,
    prefix: "docs",
    placeholder: "Paste raw notes or discussion to convert into documentation...",
    description: "Convert raw notes or discussions into structured documentation (README, Reports, etc).",
    defaultText: "Rahul: I've set up the repo. \nSneha: I'm working on the Figma designs. \nRahul: Okay, I'll start with the auth flow. \nSneha: Wait, we need to decide on the color palette first. \nRahul: Let's go with dark mode. \nSneha: Cool. I'll update the designs."
  },
  {
    id: 'tasks',
    label: "Split Tasks",
    icon: <CheckSquare className="w-4 h-4" />,
    prefix: "tasks",
    placeholder: "Paste discussion to extract tasks from...",
    description: "Extract actionable tasks and assign them to roles or team members.",
    defaultText: "We need to finish the landing page, set up the database, and write the documentation by tomorrow morning. I can do the landing page, and Sneha can handle the DB."
  },
  {
    id: 'smart_chat',
    label: "Smart Chat Mode",
    icon: <Cpu className="w-4 h-4" />,
    prefix: "smart_chat",
    placeholder: "Simulate a live chat here...",
    description: "AI teammate that proactively intervenes in chaotic team discussions.",
    defaultText: "👤 Rahul: Yaar, Firebase use karein ya Supabase? \n👤 Sneha: Supabase better hai SQL ke liye. \n👤 Rahul: Par auth setup me time lagega. Deadline kal subah hai! \n👤 Amit: I'm confused, who is doing what? \n👤 Rahul: I'll do frontend. \n👤 Sneha: I'll do DB. \n👤 Amit: What about the README? \n👤 Rahul: Let's decide later. \n👤 Sneha: No, we need it now."
  }
];

export default function App() {
  const [selectedFeatureId, setSelectedFeatureId] = useState('chaos');
  const [input, setInput] = useState(FEATURES[0].defaultText);
  const [output, setOutput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [history, setHistory] = useState<{input: string, output: string, feature: string, timestamp: string}[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isIntegrationAccepted, setIsIntegrationAccepted] = useState<boolean | null>(null);
  const [chatMessages, setChatMessages] = useState<{user: string, text: string}[]>([]);
  const [adaptiveStep, setAdaptiveStep] = useState<'input' | 'select' | 'result'>('input');
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const resultsEndRef = useRef<HTMLDivElement>(null);

  const selectedFeature = FEATURES.find(f => f.id === selectedFeatureId) || FEATURES[0];

  const handleProcess = async (textToProcess?: string, levelOverride?: string) => {
    const baseInput = textToProcess || input;
    if (!baseInput.trim()) return;

    // Special handling for adaptive interactive mode
    if (selectedFeature.id === 'adaptive' && adaptiveStep === 'input' && !levelOverride) {
      setAdaptiveStep('select');
      return;
    }

    setIsProcessing(true);
    const level = levelOverride || selectedLevel;
    const prefix = selectedFeature.id === 'adaptive' && level ? `adaptive ${level}` : selectedFeature.prefix;
    
    const result = await processHackBridgeInput(`${prefix}: ${baseInput}`);
    setOutput(result);
    
    if (selectedFeature.id === 'adaptive') {
      setAdaptiveStep('result');
    }
    
    const featureMatch = result.match(/🔷 Feature Used: (.*)/);
    const featureName = featureMatch ? featureMatch[1] : selectedFeature.label;
    
    setHistory(prev => [{ input: baseInput, output: result, feature: featureName, timestamp: new Date().toLocaleTimeString() }, ...prev].slice(0, 10));
    setIsProcessing(false);
  };

  const handleFeatureSelect = (feature: typeof FEATURES[0]) => {
    setSelectedFeatureId(feature.id);
    setInput(feature.defaultText);
    setOutput('');
    setAdaptiveStep('input');
    setSelectedLevel(null);
    setIsSidebarOpen(false);
  };

  useEffect(() => {
    if (resultsEndRef.current) {
      resultsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [output]);

  return (
    <div className="min-h-screen flex flex-col lg:flex-row overflow-hidden bg-brand-dark text-white font-sans antialiased">
      {/* Mobile Header */}
      <header className="lg:hidden flex items-center justify-between p-4 bg-brand-gray border-b border-white/10 sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-brand-primary rounded-lg flex items-center justify-center">
            <Zap className="text-black fill-black w-5 h-5" />
          </div>
          <h1 className="text-xl font-display font-bold tracking-tight">HackBridge</h1>
        </div>
        <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-white/60">
          <Menu className="w-6 h-6" />
        </button>
      </header>

      {/* Sidebar / Mobile Drawer */}
      <aside className={`
        fixed inset-0 z-[60] lg:relative lg:z-0 lg:flex
        w-full lg:w-80 bg-brand-gray border-r border-white/10 p-6 flex flex-col gap-8 overflow-y-auto
        transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex items-center justify-between lg:block">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-primary rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(0,255,0,0.4)]">
              <Zap className="text-black fill-black w-6 h-6" />
            </div>
            <h1 className="text-2xl font-display font-bold tracking-tight">HackBridge</h1>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-2 text-white/60">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex flex-col gap-4">
          <p className="text-xs font-bold text-white/40 uppercase tracking-widest">Quick Demos</p>
          <div className="grid grid-cols-1 gap-2">
            {FEATURES.map((feature) => (
              <button
                key={feature.id}
                onClick={() => handleFeatureSelect(feature)}
                className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left group ${
                  selectedFeatureId === feature.id 
                    ? 'bg-brand-primary/10 border-brand-primary/30 text-brand-primary' 
                    : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/20 text-white/80'
                }`}
              >
                <div className={`p-2 rounded-lg transition-colors ${
                  selectedFeatureId === feature.id 
                    ? 'bg-brand-primary/20 text-brand-primary' 
                    : 'bg-white/5 group-hover:bg-brand-primary/20 group-hover:text-brand-primary'
                }`}>
                  {feature.icon}
                </div>
                <span className="text-sm font-medium">{feature.label}</span>
              </button>
            ))}
          </div>
        </div>

        {history.length > 0 && (
          <div className="flex flex-col gap-4">
            <p className="text-xs font-bold text-white/40 uppercase tracking-widest">Recent Activity</p>
            <div className="flex flex-col gap-2">
              {history.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setInput(item.input);
                    setOutput(item.output);
                    setIsSidebarOpen(false);
                  }}
                  className="flex flex-col gap-1 p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all text-left"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-brand-primary uppercase tracking-tighter">{item.feature}</span>
                    <span className="text-[10px] text-white/20">{item.timestamp}</span>
                  </div>
                  <span className="text-xs text-white/60 truncate">{item.input}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-auto pt-6 border-t border-white/10">
          <div className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-primary to-emerald-400" />
            <div className="flex flex-col">
              <span className="text-xs font-bold">Hackathon Mode</span>
              <span className="text-[10px] text-white/40">v1.1.0 • Active</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative overflow-y-auto pb-24 lg:pb-0">
        {/* Background Glows */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-primary/5 blur-[120px] rounded-full -mr-64 -mt-64 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-brand-primary/5 blur-[100px] rounded-full -ml-48 -mb-48 pointer-events-none" />

        <div className="flex-1 max-w-4xl mx-auto w-full p-4 lg:p-12 flex flex-col gap-6 lg:gap-8 z-10">
          <header className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand-primary" />
              <span className="text-xs font-bold text-brand-primary uppercase tracking-widest">AI Engine Active</span>
            </div>
            <h2 className="text-3xl lg:text-5xl font-display font-bold leading-tight">
              {selectedFeature.id === 'chaos' ? (
                <>What's the team <span className="text-brand-primary">discussing?</span></>
              ) : (
                <>{selectedFeature.label}</>
              )}
            </h2>
            <p className="text-white/60 max-w-xl text-sm lg:text-base">{selectedFeature.description}</p>
          </header>

          {/* Input Area */}
          {selectedFeature.id === 'adaptive' && adaptiveStep === 'select' ? (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-panel p-8 flex flex-col items-center gap-6 border-brand-primary/20 bg-brand-primary/5"
            >
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 bg-brand-primary/20 rounded-full flex items-center justify-center">
                  <Users className="w-6 h-6 text-brand-primary" />
                </div>
                <h3 className="text-xl font-display font-bold">🎓 Choose Explanation Level</h3>
                <p className="text-white/60 text-sm">Select how you want the concept to be explained.</p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl">
                {[
                  { id: 'beginner', label: 'Beginner', desc: 'Analogies & No Jargon' },
                  { id: 'intermediate', label: 'Intermediate', desc: 'Balanced & Technical' },
                  { id: 'expert', label: 'Expert', desc: 'Precise & Deep Dive' }
                ].map((level) => (
                  <button
                    key={level.id}
                    onClick={() => {
                      setSelectedLevel(level.id);
                      handleProcess(input, level.id);
                    }}
                    className="flex flex-col gap-2 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-brand-primary/10 hover:border-brand-primary/30 transition-all text-left group"
                  >
                    <span className="font-bold text-brand-primary">{level.label}</span>
                    <span className="text-[10px] text-white/40 group-hover:text-white/60">{level.desc}</span>
                  </button>
                ))}
              </div>

              <button 
                onClick={() => setAdaptiveStep('input')}
                className="text-xs text-white/40 hover:text-white/60 underline"
              >
                Go back to edit input
              </button>
            </motion.div>
          ) : selectedFeature.id === 'smart_chat' ? (
            <div className="flex flex-col gap-6">
              {isIntegrationAccepted === null ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="glass-panel p-8 flex flex-col items-center text-center gap-6 border-brand-primary/20 bg-brand-primary/5"
                >
                  <div className="w-16 h-16 bg-brand-primary/20 rounded-full flex items-center justify-center">
                    <Settings className="w-8 h-8 text-brand-primary animate-spin-slow" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <h3 className="text-xl font-display font-bold">🔐 HackBridge Request</h3>
                    <p className="text-white/60 max-w-md">
                      Do you want to integrate HackBridge into this team chat for real-time assistance? 
                      We'll passively observe and intervene only when we detect confusion or inefficiency.
                    </p>
                  </div>
                  <div className="flex items-center gap-4 w-full max-w-xs">
                    <button 
                      onClick={() => setIsIntegrationAccepted(true)}
                      className="flex-1 py-3 bg-brand-primary text-black font-bold rounded-xl hover:scale-105 transition-transform"
                    >
                      Yes, Integrate
                    </button>
                    <button 
                      onClick={() => setIsIntegrationAccepted(false)}
                      className="flex-1 py-3 bg-white/5 text-white/60 font-bold rounded-xl hover:bg-white/10 transition-colors"
                    >
                      No
                    </button>
                  </div>
                </motion.div>
              ) : isIntegrationAccepted === false ? (
                <div className="glass-panel p-12 flex flex-col items-center text-center gap-4 opacity-50">
                  <X className="w-12 h-12 text-red-500" />
                  <p className="text-xl font-display font-bold">Integration not enabled.</p>
                  <button 
                    onClick={() => setIsIntegrationAccepted(null)}
                    className="text-xs text-brand-primary hover:underline"
                  >
                    Reset Privacy Settings
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-6">
                  <div className="glass-panel p-4 flex flex-col gap-4 max-h-[500px] overflow-y-auto bg-black/40">
                    <div className="flex items-center justify-between border-b border-white/5 pb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-brand-primary rounded-full animate-pulse" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Live Team Chat</span>
                      </div>
                      <button 
                        onClick={() => setIsIntegrationAccepted(null)}
                        className="text-[10px] text-white/20 hover:text-white/40"
                      >
                        Privacy Settings
                      </button>
                    </div>
                    
                    <div className="flex flex-col gap-4">
                      {selectedFeature.defaultText.split('\n').map((line, idx) => (
                        <motion.div 
                          key={idx}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.1 }}
                          className="flex flex-col gap-1"
                        >
                          <span className="text-xs font-bold text-white/80">{line.split(':')[0]}</span>
                          <div className="bg-white/5 p-3 rounded-2xl rounded-tl-none border border-white/5 max-w-[80%]">
                            <p className="text-sm text-white/70">{line.split(':').slice(1).join(':').trim()}</p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => handleProcess(selectedFeature.defaultText)}
                    disabled={isProcessing}
                    className="neo-button flex items-center justify-center gap-2 disabled:opacity-50 disabled:scale-100 disabled:shadow-none"
                  >
                    {isProcessing ? (
                      <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    ) : (
                      <>
                        <Zap className="w-4 h-4" />
                        <span>Simulate Proactive Intervention</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="glass-panel p-2 flex flex-col gap-2 shadow-2xl">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={selectedFeature.placeholder}
                className="w-full h-32 lg:h-40 bg-transparent p-4 text-base lg:text-lg resize-none focus:outline-none placeholder:text-white/20 font-mono"
              />
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between p-2 border-t border-white/5 gap-3">
                <div className="flex items-center gap-2 px-2">
                  {selectedFeature.id === 'chaos' && (
                    <button
                      onClick={() => {
                        const logText = "[2024-04-12 10:15:02] Rahul: We need to finalize the tech stack. \n[2024-04-12 10:16:45] Sneha: I vote for Next.js. \n[2024-04-12 10:17:10] Rahul: Agreed. What about the database? \n[2024-04-12 10:18:30] Sneha: PostgreSQL with Prisma.";
                        setInput(`Attached file: chat.txt\n\n${logText}`);
                        handleProcess(`Attached file: chat.txt\n\n${logText}`);
                      }}
                      className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all"
                    >
                      <UploadCloud className="w-3 h-3 text-brand-primary" />
                      IMPORT CHAT LOG (.TXT)
                    </button>
                  )}
                  <div className="hidden lg:flex items-center gap-1 text-[10px] font-bold text-white/30 uppercase tracking-tighter">
                    <Terminal className="w-3 h-3" />
                    <span>CMD + Enter to process</span>
                  </div>
                </div>
                
                <button
                  onClick={() => handleProcess()}
                  disabled={isProcessing || !input.trim()}
                  className="neo-button flex items-center justify-center gap-2 disabled:opacity-50 disabled:scale-100 disabled:shadow-none py-2 lg:py-3"
                >
                  {isProcessing ? (
                    <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>{selectedFeature.id === 'chaos' ? 'Process Discussion' : `Run ${selectedFeature.label}`}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Results Area */}
          <AnimatePresence mode="wait">
            {output && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex flex-col gap-6 pb-24"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-brand-primary rounded-full animate-pulse" />
                    <span className="text-xs font-bold uppercase tracking-widest text-white/40">Analysis Result</span>
                  </div>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(output);
                    }}
                    className="text-[10px] font-bold uppercase tracking-widest text-white/40 hover:text-brand-primary transition-colors flex items-center gap-1"
                  >
                    <ClipboardList className="w-3 h-3" />
                    Copy to Notion
                  </button>
                </div>

                <div className="glass-panel p-6 lg:p-10 prose prose-invert prose-brand max-w-none overflow-x-auto">
                  <div className="markdown-body">
                    <ReactMarkdown
                      components={{
                        h1: ({children}) => <h1 className="text-xl lg:text-2xl font-display font-bold text-brand-primary mb-4 border-b border-white/10 pb-2">{children}</h1>,
                        h2: ({children}) => {
                          const text = String(children);
                          const isConflict = text.includes('Conflict') || text.includes('Disagreement');
                          const isRisk = text.includes('Risk') || text.includes('Wrong');
                          const isTimeline = text.includes('Timeline') || text.includes('Evolution');
                          
                          return (
                            <h2 className={`text-lg lg:text-xl font-display font-bold mt-8 mb-4 flex items-center gap-2 ${
                              isConflict ? 'text-red-400' : 
                              isRisk ? 'text-orange-400' : 
                              isTimeline ? 'text-blue-400' : 
                              'text-white'
                            }`}>
                              {isConflict && <X size={18} className="text-red-400" />}
                              {isRisk && <HelpCircle size={18} className="text-orange-400" />}
                              {isTimeline && <History size={18} className="text-blue-400" />}
                              {children}
                            </h2>
                          );
                        },
                        h3: ({children}) => <h3 className="text-base lg:text-lg font-bold text-white/90 mt-6 mb-2">{children}</h3>,
                        p: ({children}) => <p className="text-sm lg:text-base text-white/80 leading-relaxed mb-4">{children}</p>,
                        ul: ({children}) => <ul className="space-y-2 mb-6 list-none">{children}</ul>,
                        li: ({children}) => (
                          <li className="flex gap-3 text-sm lg:text-base text-white/80">
                            <span className="text-brand-primary mt-1.5 shrink-0">
                              <Zap size={12} fill="currentColor" />
                            </span>
                            <span>{children}</span>
                          </li>
                        ),
                        code: ({children}) => <code className="bg-white/10 px-1.5 py-0.5 rounded font-mono text-xs lg:text-sm text-brand-primary">{children}</code>,
                        blockquote: ({children}) => (
                          <blockquote className="border-l-4 border-brand-primary bg-brand-primary/5 p-4 rounded-r-xl italic text-sm lg:text-base text-white/70 my-6">
                            {children}
                          </blockquote>
                        ),
                        table: ({children}) => (
                          <div className="overflow-x-auto my-6 rounded-xl border border-white/10">
                            <table className="w-full text-left border-collapse min-w-[600px]">
                              {children}
                            </table>
                          </div>
                        ),
                        thead: ({children}) => <thead className="bg-white/5 text-xs uppercase tracking-widest font-bold text-white/40">{children}</thead>,
                        th: ({children}) => <th className="p-4 border-b border-white/10">{children}</th>,
                        td: ({children}) => <td className="p-4 border-b border-white/5 text-sm">{children}</td>
                      }}
                    >
                      {output}
                    </ReactMarkdown>
                  </div>
                  
                  {selectedFeature.id === 'adaptive' && adaptiveStep === 'result' && (
                    <div className="mt-8 pt-8 border-t border-white/10 flex flex-col gap-4">
                      <p className="text-sm font-bold text-white/60">Would you like to view this in another level?</p>
                      <div className="flex flex-wrap gap-2">
                        {['beginner', 'intermediate', 'expert'].filter(l => l !== selectedLevel).map((level) => (
                          <button
                            key={level}
                            onClick={() => {
                              setSelectedLevel(level);
                              handleProcess(input, level);
                            }}
                            className="px-4 py-2 bg-white/5 hover:bg-brand-primary/20 border border-white/10 hover:border-brand-primary/30 rounded-lg text-xs font-bold capitalize transition-all"
                          >
                            {level}
                          </button>
                        ))}
                        <button
                          onClick={() => setAdaptiveStep('input')}
                          className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-bold transition-all"
                        >
                          New Concept
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                <div ref={resultsEndRef} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Empty State */}
          {!output && !isProcessing && (
            <div className="flex flex-col items-center justify-center py-20 text-center gap-4 opacity-20">
              <Cpu className="w-12 lg:w-16 h-12 lg:h-16" />
              <div className="flex flex-col gap-1">
                <p className="text-lg lg:text-xl font-display font-bold">Waiting for input</p>
                <p className="text-xs lg:text-sm">HackBridge is ready to analyze your team's context.</p>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-brand-gray border-t border-white/10 flex items-center justify-around p-3 z-50">
        <button onClick={() => setActiveTab('dashboard')} className={`flex flex-col items-center gap-1 ${activeTab === 'dashboard' ? 'text-brand-primary' : 'text-white/40'}`}>
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px] font-bold uppercase tracking-tighter">Home</span>
        </button>
        <button onClick={() => setActiveTab('docs')} className={`flex flex-col items-center gap-1 ${activeTab === 'docs' ? 'text-brand-primary' : 'text-white/40'}`}>
          <FileText className="w-5 h-5" />
          <span className="text-[10px] font-bold uppercase tracking-tighter">Docs</span>
        </button>
        <button onClick={() => setActiveTab('team')} className={`flex flex-col items-center gap-1 ${activeTab === 'team' ? 'text-brand-primary' : 'text-white/40'}`}>
          <Users className="w-5 h-5" />
          <span className="text-[10px] font-bold uppercase tracking-tighter">Team</span>
        </button>
        <button onClick={() => setActiveTab('settings')} className={`flex flex-col items-center gap-1 ${activeTab === 'settings' ? 'text-brand-primary' : 'text-white/40'}`}>
          <Settings className="w-5 h-5" />
          <span className="text-[10px] font-bold uppercase tracking-tighter">Settings</span>
        </button>
      </nav>
    </div>
  );
}