import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, doc, addDoc, updateDoc } from 'firebase/firestore';
import {
  BookOpen, PenTool, User, Shield, CheckCircle, XCircle,
  ArrowLeft, Send, Clock, ChevronRight, Image as ImageIcon,
  FileText, Upload, Info, AlertCircle, Bookmark, Globe, Cpu, Leaf, Beaker, Sprout
} from 'lucide-react';

// --- Firebase Configuration ---
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'synthesis-journal-v1';

// Editorial Configuration
const EDITOR_IN_CHIEF = "Chaojie Wang";
const JOURNAL_NAME = "SYNTHESIS";

export default function SynthesisJournal() {
  const [user, setUser] = useState(null);
  const [articles, setArticles] = useState([]);
  const [currentView, setCurrentView] = useState('home');
  const [activeArticle, setActiveArticle] = useState(null);
  const [isEditorMode, setIsEditorMode] = useState(false);

  const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&q=80&w=1000";

  // 1. Authentication
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (error) {
        console.error("Auth Error:", error);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  // 2. Data Sync
  useEffect(() => {
    if (!user) return;
    const articlesRef = collection(db, 'artifacts', appId, 'public', 'data', 'synthesis_articles');
    const unsubscribe = onSnapshot(articlesRef, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      list.sort((a, b) => b.createdAt - a.createdAt);
      setArticles(list);
    }, (error) => console.error("Firestore Error:", error));
    return () => unsubscribe();
  }, [user]);

  // --- Components ---

  const SubmitView = () => {
    const [formData, setFormData] = useState({
      title: '',
      abstract: '',
      authorName: '',
      email: '',
      category: 'Machine Learning & LLMs',
      imageUrl: '',
      manuscriptFile: null,
      coverLetterFile: null,
      supplementaryFile: null,
      conflictOfInterest: false
    });
    const [submitStatus, setSubmitStatus] = useState('');

    const handleFileChange = (e, field) => {
      const file = e.target.files[0];
      if (file) {
        setFormData(prev => ({
          ...prev,
          [field]: { name: file.name, size: (file.size / 1024).toFixed(2) + ' KB' }
        }));
      }
    };

    const handleFormSubmit = async (e) => {
      e.preventDefault();
      if (!formData.manuscriptFile || !formData.coverLetterFile) {
        setSubmitStatus('missing_files');
        return;
      }

      setSubmitStatus('submitting');
      try {
        const articlesRef = collection(db, 'artifacts', appId, 'public', 'data', 'synthesis_articles');
        await addDoc(articlesRef, {
          ...formData,
          authorId: user.uid,
          authorName: formData.authorName || `Scholar_${user.uid.substring(0,4)}`,
          status: 'under_review',
          createdAt: Date.now()
        });
        setSubmitStatus('success');
        setTimeout(() => setCurrentView('author'), 2000);
      } catch (error) {
        setSubmitStatus('error');
      }
    };

    return (
      <div className="bg-stone-50 min-h-screen py-16">
        <div className="max-w-4xl mx-auto px-6">
          <div className="bg-white shadow-2xl p-10 md:p-16 border border-stone-100">
            <div className="mb-12">
              <h2 className="text-4xl font-serif font-bold text-stone-900 mb-4 tracking-tight">Manuscript Submission</h2>
              <p className="text-stone-500 font-serif italic text-lg leading-relaxed">
                SYNTHESIS welcomes original research at the intersection of AI, Environment, and Engineering.
              </p>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-12">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-stone-400">Primary Author</label>
                  <input required value={formData.authorName} onChange={e => setFormData({...formData, authorName: e.target.value})} className="w-full border-b border-stone-200 py-3 focus:border-emerald-600 outline-none transition-all font-serif text-lg bg-transparent" placeholder="e.g. Prof. Alan Turing" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-stone-400">Cross-Disciplinary Field</label>
                  <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full border-b border-stone-200 py-3 focus:border-emerald-600 outline-none transition-all bg-transparent font-serif">
                    <option>Machine Learning & LLMs</option>
                    <option>AI for Environmental Protection</option>
                    <option>Smart Agriculture & Food Systems</option>
                    <option>Computational Chemical Engineering</option>
                    <option>Sustainable AI Infrastructure</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-stone-400">Title of Manuscript</label>
                <input required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full border-b border-stone-200 py-3 focus:border-emerald-600 outline-none transition-all font-serif text-xl font-bold" placeholder="E.g. Large Language Models for Catalytic Discovery..." />
              </div>

              <div className="space-y-6">
                <h4 className="text-xs font-bold uppercase tracking-widest text-emerald-800 border-b border-emerald-50 pb-2">Required Documents (PDF/DOCX)</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className={`relative border-2 border-dashed p-8 transition-all text-center group ${formData.manuscriptFile ? 'border-emerald-200 bg-emerald-50/30' : 'border-stone-200 hover:border-emerald-600'}`}>
                    <input type="file" required onChange={e => handleFileChange(e, 'manuscriptFile')} className="absolute inset-0 opacity-0 cursor-pointer" />
                    <Upload className={`mx-auto mb-3 ${formData.manuscriptFile ? 'text-emerald-500' : 'text-stone-300'}`} size={32} />
                    <p className="text-xs font-bold text-stone-900 uppercase tracking-tighter">Main Manuscript *</p>
                    <p className="text-[10px] text-stone-500 mt-2 font-mono">{formData.manuscriptFile ? `✓ ${formData.manuscriptFile.name}` : 'Max size 25MB'}</p>
                  </div>
                  <div className={`relative border-2 border-dashed p-8 transition-all text-center group ${formData.coverLetterFile ? 'border-emerald-200 bg-emerald-50/30' : 'border-stone-200 hover:border-emerald-600'}`}>
                    <input type="file" required onChange={e => handleFileChange(e, 'coverLetterFile')} className="absolute inset-0 opacity-0 cursor-pointer" />
                    <FileText className={`mx-auto mb-3 ${formData.coverLetterFile ? 'text-emerald-500' : 'text-stone-300'}`} size={32} />
                    <p className="text-xs font-bold text-stone-900 uppercase tracking-tighter">Cover Letter *</p>
                    <p className="text-[10px] text-stone-500 mt-2 font-mono">{formData.coverLetterFile ? `✓ ${formData.coverLetterFile.name}` : 'Address to Chaojie Wang'}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-stone-400">Abstract</label>
                <textarea required value={formData.abstract} onChange={e => setFormData({...formData, abstract: e.target.value})} rows="5" className="w-full border border-stone-100 p-6 focus:border-emerald-600 outline-none transition-all font-serif italic text-stone-700 bg-stone-50/50 leading-relaxed" placeholder="Highlight the interdisciplinary impact of your AI/Engineering approach..." />
              </div>

              <div className="flex items-start gap-4 bg-emerald-50/30 p-6 border border-emerald-100">
                 <input type="checkbox" required className="mt-1.5 h-4 w-4 accent-emerald-600" checked={formData.conflictOfInterest} onChange={e => setFormData({...formData, conflictOfInterest: e.target.checked})} />
                 <p className="text-xs text-stone-600 leading-relaxed">
                   By submitting to <strong>{JOURNAL_NAME}</strong>, I confirm that this research explores cross-disciplinary boundaries and adheres to all ethical standards in both AI and Engineering.
                 </p>
              </div>

              <div className="pt-10 flex flex-col items-center">
                {submitStatus === 'missing_files' && <p className="text-red-500 text-xs mb-6 font-bold flex items-center gap-2 bg-red-50 p-3 w-full justify-center"><AlertCircle size={16}/> ERROR: All mandatory documents must be uploaded.</p>}
                <button disabled={submitStatus === 'submitting'} type="submit" className="w-full bg-emerald-950 text-white py-6 font-bold uppercase tracking-[0.4em] text-sm hover:bg-emerald-900 transition-all flex items-center justify-center gap-3 shadow-2xl">
                  {submitStatus === 'submitting' ? 'Transmitting Data...' : <><Send size={20}/> Submit to Editorial Board</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  };

  const DashboardView = () => {
    const published = articles.filter(a => a.status === 'published');
    return (
      <div className="bg-white min-h-screen">
        {/* Academic Hero */}
        <div className="bg-emerald-950 text-emerald-50">
          <div className="max-w-7xl mx-auto px-6 py-28 flex flex-col lg:flex-row items-center gap-20">
            <div className="flex-1 text-center lg:text-left">
              <div className="inline-flex items-center gap-3 font-mono text-xs uppercase tracking-[0.4em] text-emerald-400 mb-10 bg-emerald-900/50 px-6 py-2 rounded-full border border-emerald-800/50 backdrop-blur-sm">
                <Globe size={14}/> Leading Interdisciplinary Science
              </div>
              <h1 className="text-7xl lg:text-9xl font-serif font-black mb-8 tracking-tighter leading-none">{JOURNAL_NAME}.</h1>
              <p className="text-2xl text-emerald-100/80 font-serif leading-relaxed max-w-2xl mb-12 italic">
                Bridging <span className="text-white font-bold not-italic underline decoration-emerald-500 underline-offset-8">Machine Learning</span> with Environmental Protection, Agriculture, and Chemical Engineering.
                <br/><span className="text-sm mt-4 block opacity-60">Editor-in-Chief: {EDITOR_IN_CHIEF}</span>
              </p>
              <div className="flex flex-col sm:flex-row gap-6 justify-center lg:justify-start">
                <button onClick={() => setCurrentView('submit')} className="bg-white text-emerald-950 px-10 py-5 text-sm font-bold uppercase tracking-widest hover:bg-emerald-100 transition-all shadow-2xl">Submit Research</button>
                <div className="flex items-center gap-6 px-10 py-5 font-mono text-xs uppercase tracking-widest border border-emerald-800">
                  <div className="flex gap-2">
                    <Cpu size={14} className="text-emerald-400"/>
                    <Leaf size={14} className="text-emerald-400"/>
                    <Sprout size={14} className="text-emerald-400"/>
                    <Beaker size={14} className="text-emerald-400"/>
                  </div>
                  <span>Vol. 18 / 2026</span>
                </div>
              </div>
            </div>
            <div className="relative group hidden lg:block">
               <div className="absolute -inset-6 bg-emerald-400/10 rounded-full blur-3xl animate-pulse"></div>
               <div className="relative border-l-8 border-emerald-600 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] overflow-hidden">
                 <img src="https://images.unsplash.com/photo-1518152006812-edab29b069ac?auto=format&fit=crop&q=80&w=800" alt="Cover" className="w-80 h-[500px] object-cover opacity-90" />
                 <div className="absolute inset-0 bg-gradient-to-t from-emerald-950 via-transparent to-transparent"></div>
                 <div className="absolute bottom-10 left-10">
                    <p className="font-mono text-[10px] tracking-widest uppercase mb-2 text-emerald-400">Special Issue</p>
                    <h3 className="text-3xl font-serif font-bold italic leading-tight text-white">The AI <br/>Ecosystem.</h3>
                 </div>
               </div>
            </div>
          </div>
        </div>

        {/* Categories Section */}
        <div className="bg-stone-50 py-16 border-b border-stone-200">
           <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                { icon: <Cpu/>, label: "Machine Learning", desc: "LLM & Neural Architectures" },
                { icon: <Leaf/>, label: "Eco-Tech", desc: "Environment & Renewables" },
                { icon: <Sprout/>, label: "Smart Agri", desc: "Sustainable Food Systems" },
                { icon: <Beaker/>, label: "Chem-AI", desc: "Molecular Engineering" }
              ].map((cat, idx) => (
                <div key={idx} className="flex flex-col items-center text-center p-6 border border-stone-100 hover:bg-white transition-all shadow-sm">
                   <div className="mb-4 text-emerald-600">{cat.icon}</div>
                   <h4 className="font-bold text-xs uppercase tracking-widest mb-1">{cat.label}</h4>
                   <p className="text-[10px] text-stone-400 italic">{cat.desc}</p>
                </div>
              ))}
           </div>
        </div>

        {/* Featured Content */}
        <div className="max-w-7xl mx-auto px-6 py-24">
          <div className="flex items-center gap-6 mb-16">
            <h2 className="text-4xl font-serif font-black text-stone-900">Featured Articles</h2>
            <div className="h-px flex-1 bg-stone-200"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-16">
            {published.length > 0 ? published.map(a => (
              <div key={a.id} className="group cursor-pointer" onClick={() => { setActiveArticle(a); setCurrentView('read'); }}>
                <div className="aspect-[16/10] overflow-hidden bg-stone-100 mb-8 border border-stone-200 shadow-sm relative">
                  <img src={a.imageUrl || DEFAULT_IMAGE} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-1000 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-emerald-900/10 group-hover:bg-transparent transition-colors"></div>
                </div>
                <div className="space-y-4">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-700 bg-emerald-50 px-3 py-1 inline-block">{a.category}</span>
                  <h3 className="text-2xl font-serif font-bold leading-tight text-stone-900 group-hover:text-emerald-800 transition-colors">{a.title}</h3>
                  <p className="text-stone-500 text-sm line-clamp-2 font-serif italic leading-relaxed">"{a.abstract}"</p>
                  <div className="pt-6 border-t border-stone-100 flex items-center justify-between text-[10px] font-mono text-stone-400 uppercase tracking-tighter">
                    <span className="text-stone-700 font-bold">{a.authorName}</span>
                    <span>DOI: 10.SYN/{a.id.substring(0,8).toUpperCase()}</span>
                  </div>
                </div>
              </div>
            )) : (
              <div className="col-span-full py-20 text-center border-2 border-dashed border-stone-100 text-stone-300 font-serif italic text-xl">
                The inaugural interdisciplinary collection is currently being curated.
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const EditorView = () => (
    <div className="max-w-6xl mx-auto py-20 px-6 min-h-screen">
      <div className="flex justify-between items-center mb-16 border-b border-stone-200 pb-10">
        <div>
          <h2 className="text-5xl font-serif font-black text-stone-900 tracking-tighter italic italic">Editorial Desk.</h2>
          <p className="text-emerald-600 font-mono text-xs uppercase tracking-widest font-bold mt-4">Signed as Editor-in-Chief: {EDITOR_IN_CHIEF}</p>
        </div>
        <div className="bg-emerald-950 text-white px-8 py-4 rounded-sm">
           <p className="text-[10px] uppercase font-bold tracking-widest mb-1 opacity-60">Submissions Queue</p>
           <p className="text-3xl font-serif font-black">{articles.length}</p>
        </div>
      </div>

      <div className="grid gap-8">
        {articles.map(a => (
          <div key={a.id} className="bg-white border border-stone-200 p-10 flex flex-col lg:flex-row gap-10 hover:border-emerald-600 transition-all group shadow-sm">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-6">
                <span className="bg-emerald-900 text-white text-[10px] px-3 py-1 font-bold uppercase tracking-widest">{a.category}</span>
                <span className={`text-[10px] px-3 py-1 font-bold uppercase tracking-widest border ${a.status === 'published' ? 'border-emerald-200 text-emerald-700' : 'border-amber-200 text-amber-700'}`}>
                  {a.status.replace('_', ' ')}
                </span>
              </div>
              <h3 className="text-3xl font-serif font-bold text-stone-900 mb-6">{a.title}</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
                 <div className="bg-stone-50 p-3 border border-stone-100">
                    <p className="text-[9px] text-stone-400 font-bold uppercase mb-1">MS File</p>
                    <p className="text-[11px] font-mono truncate">{a.manuscriptFile?.name}</p>
                 </div>
                 <div className="bg-stone-50 p-3 border border-stone-100">
                    <p className="text-[9px] text-stone-400 font-bold uppercase mb-1">Letter</p>
                    <p className="text-[11px] font-mono truncate">{a.coverLetterFile?.name}</p>
                 </div>
              </div>
              <div className="flex items-center gap-8 text-[11px] font-bold uppercase tracking-widest">
                 <button onClick={() => { setActiveArticle(a); setCurrentView('read'); }} className="text-stone-400 hover:text-stone-900">Review Full Paper</button>
                 {a.status !== 'published' && (
                   <button onClick={() => updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'synthesis_articles', a.id), { status: 'published' })} className="text-emerald-600 hover:text-emerald-800 underline decoration-2">Publish</button>
                 )}
                 {a.status !== 'rejected' && (
                   <button onClick={() => updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'synthesis_articles', a.id), { status: 'rejected' })} className="text-red-500">Reject</button>
                 )}
              </div>
            </div>
            <div className="lg:w-64 border-l border-stone-100 pl-10 flex flex-col justify-center">
               <p className="text-[10px] font-bold text-stone-400 uppercase mb-4 tracking-widest">Lead Author</p>
               <p className="text-sm font-serif font-bold mb-4">{a.authorName}</p>
               <div className="h-px bg-stone-100 w-full mb-4"></div>
               <p className="text-[10px] font-bold text-stone-400 uppercase mb-2 tracking-widest">EIC Signature</p>
               <p className="font-serif italic text-stone-300">Pending verification</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white text-stone-900 font-sans antialiased">
      <nav className="border-b border-stone-100 px-8 py-8 flex justify-between items-center sticky top-0 bg-white/95 backdrop-blur-xl z-50">
        <div className="flex items-center gap-5 cursor-pointer group" onClick={() => setCurrentView('home')}>
          <div className="w-12 h-12 bg-emerald-950 flex items-center justify-center text-white font-serif font-black text-2xl shadow-xl">S</div>
          <div>
            <h1 className="font-serif font-black text-3xl tracking-tighter uppercase leading-none">{JOURNAL_NAME}.</h1>
            <p className="text-[8px] font-bold uppercase tracking-[0.4em] text-emerald-600 mt-1 italic">Cross-Disciplinary AI</p>
          </div>
        </div>
        <div className="flex gap-10 items-center">
          <button onClick={() => setCurrentView('home')} className={`text-[10px] font-bold uppercase tracking-[0.3em] ${currentView === 'home' ? 'text-emerald-800 border-b-2 border-emerald-800 pb-1' : 'text-stone-400'}`}>Current</button>
          <button onClick={() => setCurrentView('submit')} className={`text-[10px] font-bold uppercase tracking-[0.3em] ${currentView === 'submit' ? 'text-emerald-800 border-b-2 border-emerald-800 pb-1' : 'text-stone-400'}`}>Submit</button>
          <button
            onClick={() => { setIsEditorMode(!isEditorMode); setCurrentView(!isEditorMode ? 'editor' : 'home'); }}
            className={`px-6 py-3 text-[9px] font-bold uppercase tracking-[0.3em] border transition-all ${isEditorMode ? 'bg-emerald-950 text-white border-emerald-950 shadow-2xl' : 'border-stone-200 text-stone-400 hover:border-emerald-800 hover:text-emerald-800'}`}
          >
            {isEditorMode ? `EIC: ${EDITOR_IN_CHIEF}` : 'Editor Console'}
          </button>
        </div>
      </nav>

      <main>
        {currentView === 'home' && <DashboardView />}
        {currentView === 'submit' && <SubmitView />}
        {currentView === 'editor' && <EditorView />}
        {currentView === 'read' && (
          <article className="py-24 max-w-4xl mx-auto px-8">
            <button onClick={() => setCurrentView(isEditorMode ? 'editor' : 'home')} className="flex items-center gap-3 text-stone-400 hover:text-stone-900 mb-16 font-bold text-[10px] uppercase tracking-widest"><ArrowLeft size={16}/> Index</button>
            <div className="mb-16">
              <span className="text-emerald-600 font-bold text-xs uppercase tracking-widest mb-4 block">{activeArticle?.category}</span>
              <h1 className="text-6xl md:text-8xl font-serif font-black mb-10 leading-none tracking-tighter">{activeArticle?.title}</h1>
              <div className="flex flex-wrap gap-8 items-center border-y border-stone-100 py-8 font-serif italic text-stone-500">
                <span className="flex items-center gap-2 not-italic font-bold text-stone-900 text-sm">Corresponding Author: {activeArticle?.authorName}</span>
                <span>Sub: {new Date(activeArticle?.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
            <div className="bg-emerald-50/50 p-12 md:p-20 border-l-8 border-emerald-900 mb-20">
              <p className="font-serif italic text-2xl md:text-3xl text-emerald-900/80 leading-relaxed">"{activeArticle?.abstract}"</p>
            </div>
            <div className="prose prose-emerald max-w-none font-serif text-xl text-stone-800 leading-loose space-y-10">
               <p className="font-mono text-[10px] text-stone-400 uppercase mb-10 border-b border-stone-100 pb-4 italic">The following is a simulated representation of the submitted manuscript content for review purposes.</p>

               <p>As the integration of large language models (LLMs) and environmental engineering accelerates, new paradigms for sustainable industrial development are emerging. This research investigates the synthesis of algorithmic efficiency and chemical process optimization.</p>

               <h3 className="text-3xl font-black italic mt-16 text-emerald-950">1. Cross-Disciplinary Integration</h3>
               <p>The synergy between machine learning and agricultural systems has provided unprecedented insights into crop yield prediction and soil carbon sequestration. Similarly, in the realm of chemical engineering, AI-driven molecular discovery is shortening the R&D cycle from years to months.</p>

               <div className="my-16 p-12 bg-emerald-950 text-white text-center rounded-sm">
                  <p className="text-lg font-serif italic opacity-90">"The future of science lies not in specialized silos, but in the generative synthesis of human intelligence and computational power."</p>
                  <p className="text-[10px] uppercase tracking-widest mt-6 opacity-60">— Editorial Perspective, SYNTHESIS Vol. 18</p>
               </div>

               <p>Through this publication, we aim to provide a comprehensive framework for peer-reviewed research that prioritizes ecological integrity alongside technological advancement.</p>
            </div>
          </article>
        )}
      </main>

      <footer className="bg-emerald-950 text-emerald-700 py-24 px-8">
        <div className="max-w-7xl mx-auto flex flex-col items-center">
          <div className="w-20 h-0.5 bg-emerald-500 mb-10"></div>
          <p className="font-serif italic text-emerald-100 text-2xl max-w-2xl text-center mb-10 leading-relaxed">
            "Catalyzing the Generative Revolution in Sustainable Engineering."
          </p>
          <div className="flex flex-wrap justify-center gap-10 mb-12 text-[10px] font-bold uppercase tracking-[0.3em]">
            <span className="hover:text-white cursor-pointer transition-colors">ML & LLM Policy</span>
            <span className="hover:text-white cursor-pointer transition-colors">Eco-Integrity</span>
            <span className="hover:text-white cursor-pointer transition-colors">Agri-Tech Standards</span>
            <span className="hover:text-white cursor-pointer transition-colors">Ethics in Chem-AI</span>
          </div>
          <p className="text-[9px] font-mono uppercase tracking-[0.4em] opacity-40">
            © 2026 {JOURNAL_NAME} • Editorial Lead: {EDITOR_IN_CHIEF} • Global Scholarly Publishing Group
          </p>
        </div>
      </footer>
    </div>
  );
}