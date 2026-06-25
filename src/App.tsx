import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Sparkles, 
  Atom, 
  Palette, 
  Globe, 
  BookOpen, 
  Scroll, 
  Send, 
  Paperclip, 
  X, 
  FileText, 
  Loader2, 
  HelpCircle, 
  ArrowLeft,
  AlertTriangle,
  RotateCcw,
  Check
} from "lucide-react";

// --- Types ---
interface FileAttachment {
  name: string;
  mimeType: string;
  data: string; // Base64 representation
  previewUrl?: string; // Blob URL for image preview
}

interface Message {
  role: "user" | "model";
  parts: Array<{
    text?: string;
    inlineData?: {
      mimeType: string;
      data: string;
    };
  }>;
  timestamp: Date;
  localFiles?: Array<{ name: string; mimeType: string; previewUrl?: string }>;
}

export default function App() {
  // --- State Variables ---
  const [materia, setMateria] = useState<string>("");
  const [anno, setAnno] = useState<string>("");
  const [isChatStarted, setIsChatStarted] = useState<boolean>(false);
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState<string>("");
  const [attachedFiles, setAttachedFiles] = useState<FileAttachment[]>([]);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // UI states
  const [showConfirmReset, setShowConfirmReset] = useState<boolean>(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Auto Scroll ---
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending]);

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      attachedFiles.forEach(file => {
        if (file.previewUrl) URL.revokeObjectURL(file.previewUrl);
      });
    };
  }, []);

  // --- Static Option Definitions ---
  const materieOptions = [
    {
      id: "Scientifico",
      name: "Scientifico",
      description: "matematica, fisica, chimica, biologia, informatica",
      icon: Atom,
      color: "from-amber-500/20 to-yellow-600/10 border-amber-500/30 text-amber-400"
    },
    {
      id: "Umanistico",
      name: "Umanistico",
      description: "storia, filosofia",
      icon: Scroll,
      color: "from-orange-500/20 to-amber-600/10 border-orange-500/30 text-orange-400"
    },
    {
      id: "Italiano",
      name: "Italiano",
      description: "lingua e letteratura",
      icon: BookOpen,
      color: "from-yellow-500/20 to-amber-600/10 border-yellow-500/30 text-yellow-300"
    },
    {
      id: "Lingue straniere",
      name: "Lingue straniere",
      description: "inglese, francese, tedesco, spagnolo...",
      icon: Globe,
      color: "from-emerald-500/20 to-teal-600/10 border-emerald-500/30 text-emerald-400"
    },
    {
      id: "Artistico",
      name: "Artistico",
      description: "storia dell'arte e tecniche grafiche",
      icon: Palette,
      color: "from-rose-500/20 to-pink-600/10 border-rose-500/30 text-rose-400"
    }
  ];

  const anniOptions = [
    { value: "1°", label: "1° Anno", group: "biennio" },
    { value: "2°", label: "2° Anno", group: "biennio" },
    { value: "3°", label: "3° Anno", group: "triennio" },
    { value: "4°", label: "4° Anno", group: "triennio" },
    { value: "5°", label: "5° Anno", group: "triennio" }
  ];

  // --- Initial Welcome Prompt tailored by selection ---
  const getInitialGreetings = (subject: string, year: string) => {
    const term = ["1°", "2°"].includes(year) ? "biennio" : "triennio";
    const commonIntro = `Ciao! Sono Socrate, il tuo tutor. Oggi esploreremo insieme ${subject}. Ricorda: non sono qui per darti risposte o risolvere i compiti al tuo posto, ma per farti riflettere e aiutarti a trovare la strada da solo.`;
    
    switch (subject) {
      case "Scientifico":
        return `${commonIntro}\n\nHai un problema di matematica, fisica o scienze che ti blocca? Descrivimelo, oppure allega una foto del tuo quaderno o libro. Da quale domanda vorresti cominciare per sbrogliare la situazione?`;
      case "Umanistico":
        return `${commonIntro}\n\nDi quale periodo storico o interrogativo filosofico stiamo parlando oggi? Quali sono i primi dati o concetti chiave che ti vengono in mente? Parliamone.`;
      case "Italiano":
        return `${commonIntro}\n\nQuale brano o testo letterario stiamo analizzando oggi? Se hai un brano o una poesia, puoi allegare il testo in formato PDF o come immagine. Qual è il tema centrale o la prima sensazione che ti trasmette?`;
      case "Lingue straniere":
        return `${commonIntro}\n\nQuale esercizio, regola di grammatica o testo in lingua straniera vorresti affrontare insieme? Puoi scrivermi o caricare una foto dell'esercizio. Di cosa si tratta?`;
      case "Artistico":
        return `${commonIntro}\n\nQuale opera, autore o tecnica artistica vorresti analizzare? Se hai l'immagine dell'opera da studiare, allegala pure. Che cosa noti per primo osservando la sua struttura o i suoi colori?`;
      default:
        return `${commonIntro}\n\nCosa stai studiando di bello oggi? Descrivimelo o carica un file, e facciamoci le domande giuste per sbloccarti!`;
    }
  };

  // --- Actions ---
  const handleStartChat = () => {
    if (!materia || !anno) return;
    
    const welcomeText = getInitialGreetings(materia, anno);
    setMessages([
      {
        role: "model",
        parts: [{ text: welcomeText }],
        timestamp: new Date()
      }
    ]);
    setIsChatStarted(true);
    setErrorMsg(null);
  };

  const handleResetChat = () => {
    // Reset everything
    setMateria("");
    setAnno("");
    setIsChatStarted(false);
    setMessages([]);
    setInputText("");
    // Clean up urls
    attachedFiles.forEach(file => {
      if (file.previewUrl) URL.revokeObjectURL(file.previewUrl);
    });
    setAttachedFiles([]);
    setErrorMsg(null);
    setShowConfirmReset(false);
  };

  // --- File Upload Handlers ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setErrorMsg(null);
    const currentCount = attachedFiles.length;
    if (currentCount + files.length > 3) {
      setErrorMsg("Puoi allegare al massimo 3 file per singolo messaggio.");
      return;
    }

    Array.from(files).forEach((item) => {
      const file = item as File;
      // Limit to 10 MB (10 * 1024 * 1024 bytes)
      if (file.size > 10 * 1024 * 1024) {
        setErrorMsg("Il file è troppo grande (max 10 MB). Prova a comprimerlo o a fotografare solo la parte che ti interessa.");
        return;
      }

      // Accepted types: PDF, JPG, JPEG, PNG, WEBP, HEIC
      const validTypes = [
        "application/pdf",
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
        "image/heic"
      ];
      
      const fileType = file.type || "";
      const isExtensionValid = file.name.endsWith(".pdf") || 
                              file.name.endsWith(".jpg") || 
                              file.name.endsWith(".jpeg") || 
                              file.name.endsWith(".png") || 
                              file.name.endsWith(".webp") || 
                              file.name.endsWith(".heic");

      if (!validTypes.includes(fileType) && !isExtensionValid) {
        setErrorMsg("Posso leggere solo PDF e immagini. Riprova con un altro file.");
        return;
      }

      // Determine mime type if empty (especially for heic, which might lack default mime on some OS)
      let resolvedMime = fileType || "application/octet-stream";
      if (file.name.endsWith(".pdf")) resolvedMime = "application/pdf";
      else if (file.name.endsWith(".jpg") || file.name.endsWith(".jpeg")) resolvedMime = "image/jpeg";
      else if (file.name.endsWith(".png")) resolvedMime = "image/png";
      else if (file.name.endsWith(".webp")) resolvedMime = "image/webp";
      else if (file.name.endsWith(".heic")) resolvedMime = "image/heic";

      const reader = new FileReader();
      reader.onload = () => {
        const resultString = reader.result as string;
        const base64Data = resultString.split(",")[1];
        
        const newAttachment: FileAttachment = {
          name: file.name,
          mimeType: resolvedMime,
          data: base64Data,
          previewUrl: resolvedMime.startsWith("image/") ? URL.createObjectURL(file) : undefined
        };

        setAttachedFiles(prev => [...prev, newAttachment].slice(0, 3));
      };
      reader.onerror = () => {
        setErrorMsg("Errore nel caricamento del file. Prova con un'altra immagine o documento.");
      };
      reader.readAsDataURL(file);
    });

    // Reset input
    e.target.value = "";
  };

  const removeAttachment = (index: number) => {
    setAttachedFiles(prev => {
      const target = prev[index];
      if (target.previewUrl) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  // --- Send Message ---
  const handleSendMessage = async () => {
    if (inputText.trim() === "" && attachedFiles.length === 0) return;
    if (isSending) return;

    setErrorMsg(null);
    setIsSending(true);

    const messageText = inputText;
    const currentAttachments = [...attachedFiles];

    // Build the user message object for local display
    const userParts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [];
    if (messageText.trim()) {
      userParts.push({ text: messageText });
    }
    currentAttachments.forEach(att => {
      userParts.push({
        inlineData: {
          mimeType: att.mimeType,
          data: att.data
        }
      });
    });

    const newUserMessage: Message = {
      role: "user",
      parts: userParts,
      timestamp: new Date(),
      localFiles: currentAttachments.map(a => ({ 
        name: a.name, 
        mimeType: a.mimeType, 
        previewUrl: a.previewUrl 
      }))
    };

    // Append to messages list locally
    const updatedMessages = [...messages, newUserMessage];
    setMessages(updatedMessages);

    // Clear input bar
    setInputText("");
    setAttachedFiles([]);

    try {
      // Reconstruct full historical context for Gemini payload
      // (Exclude the last message from the history block because it is explicitly passed as 'message' and 'files')
      const payloadHistory = messages.map(m => ({
        role: m.role,
        parts: m.parts.map(p => {
          if (p.text) return { text: p.text };
          if (p.inlineData) return { 
            inlineData: { 
              mimeType: p.inlineData.mimeType, 
              data: p.inlineData.data 
            } 
          };
          return p;
        })
      }));

      const payloadFiles = currentAttachments.map(a => ({
        mimeType: a.mimeType,
        data: a.data
      }));

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          materia,
          anno,
          history: payloadHistory,
          message: messageText,
          files: payloadFiles
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 429) {
          throw new Error("Sto avendo molte richieste in questo momento. Riprova tra qualche minuto.");
        } else if (response.status === 500 && errorData.error && errorData.error.includes("Configurazione")) {
          throw new Error("Configurazione mancante: l'app non è configurata correttamente. Contatta il tuo docente.");
        } else {
          throw new Error(errorData.error || "Qualcosa è andato storto. Se il problema persiste, ricarica la pagina.");
        }
      }

      const data = await response.json();
      const socrateReply = data.reply;

      const newSocrateMessage: Message = {
        role: "model",
        parts: [{ text: socrateReply }],
        timestamp: new Date()
      };

      setMessages(prev => [...prev, newSocrateMessage]);
    } catch (err: any) {
      console.error(err);
      
      let friendlyError = "Qualcosa è andato storto. Se il problema persiste, ricarica la pagina.";
      if (!navigator.onLine) {
        friendlyError = "Sembra che non ci sia connessione internet. Controlla e riprova.";
      } else if (err.message) {
        if (err.message.includes("richieste") || err.message.includes("429")) {
          friendlyError = "Sto avendo molte richieste in questo momento. Riprova tra qualche minuto.";
        } else if (err.message.includes("connessione")) {
          friendlyError = "Sembra che non ci sia connessione internet. Controlla e riprova.";
        } else if (err.message.includes("Configurazione")) {
          friendlyError = "Configurazione mancante: l'app non è configurata correttamente. Contatta il tuo docente.";
        } else {
          friendlyError = err.message;
        }
      }
      
      setErrorMsg(friendlyError);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // --- Helper to render formatted text with basic maieutic aesthetics ---
  const formatMessageText = (text: string) => {
    if (!text) return "";
    
    // Split by double newlines for paragraphs
    const paragraphs = text.split(/\n\s*\n/);
    
    return paragraphs.map((paragraph, pIdx) => {
      // Detect if it is a list
      const lines = paragraph.split('\n');
      const isList = lines.length > 1 && lines.every(line => {
        const trimmed = line.trim();
        return trimmed === "" || trimmed.startsWith('-') || trimmed.startsWith('*') || /^\d+\./.test(trimmed);
      });
      
      if (isList) {
        const items = lines.filter(l => l.trim() !== "").map((line, lIdx) => {
          const cleanLine = line.replace(/^[-*]\s*|^\d+\.\s*/, '');
          return (
            <li key={lIdx} className="mb-1.5 last:mb-0 ml-4 list-disc pl-1 text-stone-200 font-sans text-sm md:text-base leading-relaxed">
              {renderInlineFormatting(cleanLine)}
            </li>
          );
        });
        return <ul key={pIdx} className="mb-4 last:mb-0 list-outside">{items}</ul>;
      }

      return (
        <p key={pIdx} className="mb-3.5 last:mb-0 leading-relaxed text-stone-100 font-serif text-[16px] md:text-[17px] tracking-wide antialiased">
          {lines.map((line, lIdx) => (
            <React.Fragment key={lIdx}>
              {lIdx > 0 && <br />}
              {renderInlineFormatting(line)}
            </React.Fragment>
          ))}
        </p>
      );
    });
  };

  const renderInlineFormatting = (line: string) => {
    // Splits based on markdown **bold**
    const parts = line.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, idx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={idx} className="font-semibold text-amber-300 drop-shadow-[0_0_12px_rgba(245,158,11,0.25)]">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  };

  // --- Render ---
  return (
    <div className="min-h-screen bg-philosopher-gradient text-slate-200 font-sans flex flex-col antialiased">
      
      {/* Background Ambience Accent */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#D4AF37]/5 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-[500px] h-[500px] bg-[#D4AF37]/3 blur-[150px] rounded-full pointer-events-none" />

      {/* HEADER BAR */}
      <header className="h-16 flex items-center justify-between px-4 md:px-8 border-b border-white/5 bg-[#0A0A0B]/80 backdrop-blur-md sticky top-0 z-40">
        <div className="flex items-center gap-4 md:gap-6">
          <h1 className="text-xl md:text-2xl font-socrate font-bold text-[#D4AF37] tracking-tight cursor-pointer" onClick={() => isChatStarted && setShowConfirmReset(true)}>
            Socrate
          </h1>
          {isChatStarted && (
            <>
              <div className="h-4 w-[1px] bg-white/10 hidden sm:block"></div>
              <div className="hidden sm:flex flex-col">
                <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-semibold leading-tight">Sessione Attiva</span>
                <span className="text-xs font-medium text-slate-300 mt-0.5">Tutor di <span className="text-[#D4AF37] font-semibold">{materia}</span> — {anno} anno</span>
              </div>
            </>
          )}
        </div>

        {/* Reset Button stylized as the change button in design HTML */}
        {isChatStarted && (
          <button
            onClick={() => setShowConfirmReset(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-full glass hover:bg-white/5 transition-all group cursor-pointer"
          >
            <span className="text-xs font-semibold text-slate-400 group-hover:text-white">Cambia materia/anno</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#D4AF37] transition-transform group-hover:rotate-180 duration-500"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 16h5v5"/></svg>
          </button>
        )}
      </header>

      {/* MAIN CONTENT SPACE */}
      <main className={`flex-1 flex ${isChatStarted ? 'flex-row' : 'flex-col justify-center'} max-w-7xl w-full mx-auto p-4 md:p-6 z-10 overflow-hidden`}>
        
        <AnimatePresence mode="wait">
          {!isChatStarted ? (
            
            // --- SCHERMATA INIZIALE (CONFIGURATION) ---
            <motion.div
              key="setup-screen"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="flex-1 flex flex-col justify-center max-w-3xl mx-auto w-full py-4 md:py-8"
            >
              
              {/* Educational Philosophy Header */}
              <div className="text-center mb-8">
                <h2 className="font-socrate text-3xl md:text-5xl font-extrabold tracking-tight mb-4 text-slate-100 italic">
                  Imparare facendosi le <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] to-[#FFD700]">domande giuste</span>
                </h2>
                <p className="text-slate-400 text-sm md:text-base max-w-xl mx-auto leading-relaxed">
                  Socrate è un tutor maieutico basato sul dialogo. Non risolverà i tuoi compiti, ma ti guiderà con domande intelligenti per farti scoprire la risposta con le tue forze.
                </p>
              </div>

              {/* Main Selector Card */}
              <div className="glass rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden gold-glow">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37]/5 rounded-full blur-2xl pointer-events-none" />

                <div className="space-y-8">
                  
                  {/* Selector 1: Year */}
                  <div>
                    <label className="block font-mono text-[10px] uppercase tracking-[0.2em] text-[#D4AF37] mb-4 font-semibold">
                      1. Seleziona il tuo Anno Scolastico
                    </label>
                    <div className="grid grid-cols-5 gap-2 md:gap-3">
                      {anniOptions.map((opt) => {
                        const isSelected = anno === opt.value;
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => setAnno(opt.value)}
                            className={`py-3 md:py-4 px-1 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                              isSelected
                                ? "bg-[#D4AF37]/15 border-[#D4AF37] text-[#D4AF37] shadow-[0_0_15px_rgba(212,175,55,0.15)] scale-[1.03]"
                                : "bg-white/3 border-white/10 hover:border-white/20 text-slate-400 hover:text-slate-200"
                            }`}
                          >
                            <span className="font-socrate text-lg md:text-xl font-bold">{opt.value}</span>
                            <span className="text-[9px] uppercase font-mono text-slate-500 mt-1">
                              {opt.group}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Selector 2: Subject */}
                  <div>
                    <label className="block font-mono text-[10px] uppercase tracking-[0.2em] text-[#D4AF37] mb-4 font-semibold">
                      2. Scegli la macro-area disciplinare
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                      {materieOptions.map((opt) => {
                        const isSelected = materia === opt.id;
                        const IconComponent = opt.icon;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => setMateria(opt.id)}
                            className={`p-4 rounded-xl border text-left transition-all cursor-pointer md:col-span-1 flex flex-col justify-between h-36 relative overflow-hidden ${
                              isSelected
                                ? `bg-gradient-to-br ${opt.color} scale-[1.02] border-[#D4AF37] shadow-[0_0_20px_rgba(212,175,55,0.1)]`
                                : "bg-white/3 border-white/10 hover:border-white/20 text-slate-400"
                            }`}
                          >
                            <div className="flex justify-between items-start w-full">
                              <div className={`p-2 rounded-lg ${isSelected ? 'bg-[#D4AF37]/20' : 'bg-white/5'} border border-white/5`}>
                                <IconComponent className={`w-5 h-5 ${isSelected ? 'text-[#D4AF37]' : 'text-slate-400'}`} />
                              </div>
                              {isSelected && (
                                <span className="p-1 bg-[#D4AF37] rounded-full text-[#0A0A0B]">
                                  <Check className="w-3 h-3 stroke-[3]" />
                                </span>
                              )}
                            </div>
                            <div className="mt-auto">
                              <span className={`block font-socrate text-base font-bold leading-tight ${isSelected ? 'text-slate-100' : 'text-slate-200'}`}>
                                {opt.name}
                              </span>
                              <span className="block text-[10px] text-slate-500 leading-tight mt-1 line-clamp-2">
                                {opt.description}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-4 border-t border-white/5">
                    <button
                      type="button"
                      disabled={!materia || !anno}
                      onClick={handleStartChat}
                      className={`w-full py-4 px-6 rounded-xl font-bold tracking-wider uppercase text-sm transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                        materia && anno
                          ? "gold-gradient text-[#0A0A0B] hover:opacity-95 shadow-[0_4px_20px_rgba(212,175,55,0.3)] hover:scale-[1.01]"
                          : "bg-white/3 text-slate-500 cursor-not-allowed border border-white/5"
                      }`}
                    >
                      <span>Inizia il Dialogo con Socrate</span>
                    </button>
                  </div>

                </div>
              </div>
              
              <div className="text-center mt-6 text-slate-600 text-xs font-mono uppercase tracking-widest">
                Piattaforma scolastica • Metodologia Maieutica Classica
              </div>

            </motion.div>

          ) : (
            
            // --- SCHERMATA CHAT ---
            <div className="flex-1 flex gap-6 w-full h-full overflow-hidden">
              <motion.div
                key="chat-screen"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex flex-col h-full bg-[#0D0D0F]/40 border border-white/5 rounded-3xl overflow-hidden shadow-2xl relative"
              >
                
                {/* Top Context Indicator Line */}
                <div className="px-6 py-3 bg-[#0A0A0B]/80 border-b border-white/5 flex justify-between items-center text-xs text-slate-400 font-mono">
                  <span>Contesto: {materia} ({anno} anno)</span>
                  <span className="flex items-center space-x-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Tutor Attivo</span>
                  </span>
                </div>

                {/* CHAT MESSAGES CONTAINER */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8 min-h-[350px] max-h-[60vh] md:max-h-[65vh]">
                  <AnimatePresence initial={false}>
                    {messages.map((msg, index) => {
                      const isSocrate = msg.role === "model";
                      return (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                          className={`flex gap-4 ${isSocrate ? "justify-start" : "justify-end flex-row-reverse"} items-start`}
                        >
                          {/* Avatar */}
                          {isSocrate ? (
                            <div className="w-10 h-10 rounded-full gold-gradient flex items-center justify-center shrink-0 shadow-lg gold-glow">
                              <span className="font-socrate font-bold text-[#0A0A0B] text-lg">S</span>
                            </div>
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center shrink-0 border border-white/10">
                              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                            </div>
                          )}

                          <div className={`flex flex-col ${isSocrate ? "items-start" : "items-end"} max-w-[80%] gap-2`}>
                            
                            {/* Message Bubble */}
                            <div className={
                              isSocrate
                                ? "socrate-bubble p-5 rounded-2xl rounded-tl-none text-slate-200"
                                : "bg-slate-800 p-5 rounded-2xl rounded-tr-none text-slate-200"
                            }>
                              
                              {/* Attached Files inside user's bubble */}
                              {!isSocrate && msg.localFiles && msg.localFiles.length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-3">
                                  {msg.localFiles.map((file, fIdx) => (
                                    <div key={fIdx} className="relative group">
                                      <div className="w-24 h-24 rounded-lg overflow-hidden border border-white/10 shadow-inner bg-slate-900 flex flex-col items-center justify-center text-center p-2">
                                        {file.mimeType.startsWith("image/") && file.previewUrl ? (
                                          <img src={file.previewUrl} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" alt="Preview" />
                                        ) : (
                                          <>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
                                            <span className="text-[10px] mt-2 text-slate-400 font-mono truncate w-full">{file.name}</span>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Main message text */}
                              {isSocrate ? (
                                <div className="space-y-2">
                                  {formatMessageText(msg.parts[0]?.text || "")}
                                </div>
                              ) : (
                                <p className="text-sm md:text-[15px] leading-relaxed whitespace-pre-wrap">
                                  {msg.parts.find(p => p.text)?.text || ""}
                                </p>
                              )}

                            </div>
                            
                            {/* Timestamp */}
                            <span className="text-[10px] text-slate-500 font-mono">
                              {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </motion.div>
                      );
                    })}

                    {/* Thinking Loader */}
                    {isSending && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex gap-4 items-start"
                      >
                        <div className="w-10 h-10 rounded-full border border-[#D4AF37]/30 flex items-center justify-center shrink-0">
                          <span className="font-socrate font-bold text-[#D4AF37] text-lg opacity-50">S</span>
                        </div>
                        <div className="flex gap-1.5 p-4 items-center">
                          <div className="w-2 h-2 rounded-full bg-[#D4AF37] animate-pulse"></div>
                          <div className="w-2 h-2 rounded-full bg-[#D4AF37] animate-pulse" style={{ animationDelay: "0.2s" }}></div>
                          <div className="w-2 h-2 rounded-full bg-[#D4AF37] animate-pulse" style={{ animationDelay: "0.4s" }}></div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Anchor for scroll */}
                  <div ref={chatEndRef} />
                </div>

                {/* ERROR POPUP BANNER */}
                {errorMsg && (
                  <div className="mx-6 my-2 p-3 bg-red-950/40 border border-red-800/40 rounded-xl flex items-start space-x-3 text-red-200 text-xs md:text-sm shadow-lg animate-fade-in">
                    <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium">Attenzione</p>
                      <p className="text-red-300/90 mt-0.5 leading-relaxed">{errorMsg}</p>
                    </div>
                    <button 
                      onClick={() => setErrorMsg(null)}
                      className="text-red-400 hover:text-red-200 p-1 rounded-lg hover:bg-red-900/20 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* BOTTOM PANEL & INPUT FIELD */}
                <div className="p-6 border-t border-white/5 bg-[#0A0A0B]/60">
                  
                  <div className="glass rounded-3xl p-4 flex flex-col gap-4 gold-glow">
                    
                    {/* File Previews Above Input Box */}
                    {attachedFiles.length > 0 && (
                      <div className="flex gap-3 px-2">
                        {attachedFiles.map((file, idx) => (
                          <div 
                            key={idx} 
                            className="relative flex items-center gap-2 bg-white/5 pr-8 pl-2 py-2 rounded-xl border border-white/10"
                          >
                            <div className="w-8 h-8 rounded bg-[#D4AF37]/20 flex items-center justify-center">
                              {file.mimeType.startsWith("image/") ? (
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                              ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
                              )}
                            </div>
                            <span className="text-xs font-medium text-slate-300 max-w-[120px] truncate">{file.name}</span>
                            <button 
                              type="button"
                              onClick={() => removeAttachment(idx)}
                              className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-[10px] font-bold shadow-lg text-white hover:bg-red-600 transition-colors cursor-pointer"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-4">
                      {/* File Attachment Button */}
                      <button
                        type="button"
                        disabled={isSending || attachedFiles.length >= 3}
                        onClick={() => fileInputRef.current?.click()}
                        className={`p-3 rounded-2xl hover:bg-white/5 transition-colors text-slate-400 group cursor-pointer ${
                          attachedFiles.length >= 3 || isSending ? "opacity-40 cursor-not-allowed" : ""
                        }`}
                        title="Allega file (PDF o Immagini)"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:text-[#D4AF37] transition-colors"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.51a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
                      </button>

                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                        multiple
                        accept=".pdf,.jpg,.jpeg,.png,.webp,.heic"
                      />

                      <input 
                        type="text" 
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                        disabled={isSending}
                        placeholder={attachedFiles.length > 0 ? "Invia i file allegati o scrivi il tuo ragionamento..." : "Scrivi il tuo ragionamento qui..."} 
                        className="flex-1 bg-transparent border-none outline-none text-slate-100 placeholder:text-slate-500 py-2 text-sm md:text-base focus:ring-0"
                      />

                      {/* Send Button */}
                      <button 
                        type="button"
                        onClick={handleSendMessage}
                        disabled={isSending || (inputText.trim() === "" && attachedFiles.length === 0)}
                        className={`gold-gradient p-3 rounded-2xl shadow-lg transition-all ${
                          isSending || (inputText.trim() === "" && attachedFiles.length === 0)
                            ? "opacity-40 cursor-not-allowed"
                            : "hover:scale-105 hover:opacity-95 cursor-pointer"
                        }`}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0A0A0B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 7-7 7 7"/><path d="M12 19V5"/></svg>
                      </button>
                    </div>

                  </div>
                  <p className="text-center text-[10px] text-slate-600 mt-4 uppercase tracking-[0.1em] font-mono">
                    Socrate non dà risposte, ti aiuta a trovarle. Sii onesto nel tuo percorso.
                  </p>
                </div>

              </motion.div>

              {/* Right Side Sidebar (Quick Stats/Help) */}
              <aside className="w-72 border border-white/5 bg-[#0D0D0F]/80 p-6 hidden lg:flex flex-col justify-between rounded-3xl backdrop-blur-md">
                <div className="mb-8">
                  <h3 className="text-[11px] uppercase tracking-[0.15em] text-slate-500 font-bold mb-4">Filosofia di Apprendimento</h3>
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center mb-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2"><path d="M12 2v8"/><path d="m4.93 10.93 1.41 1.41"/><path d="M2 18h2"/><path d="M20 18h2"/><path d="m19.07 10.93-1.41 1.41"/><path d="M22 22H2"/><path d="m16 6-4 4-4-4"/><path d="M16 18a4 4 0 0 0-8 0"/></svg>
                      </div>
                      <p className="text-xs leading-relaxed text-slate-400 italic font-socrate">
                        "Conosci te stesso attraverso le domande che poni."
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-white/5 border border-white/5 text-xs">
                    <span className="text-[10px] uppercase font-mono text-slate-500 tracking-wider font-semibold">Tutor Maieutico</span>
                    <p className="text-slate-400 mt-1 leading-relaxed">
                      Socrate ti supporterà con domande guidate per farti giungere in autonomia alla soluzione del problema.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl border border-amber-500/20 bg-amber-500/5">
                    <h4 className="text-xs font-bold text-amber-200 mb-1">Stato Studio</h4>
                    <p className="text-xs text-amber-100/60">Simulazione / Esercitazione attiva</p>
                    <div className="w-full h-1 bg-white/10 rounded-full mt-3">
                      <div className="h-full w-2/3 bg-amber-500 rounded-full shadow-[0_0_8px_#D4AF37]"></div>
                    </div>
                    <p className="text-[10px] text-amber-500/80 mt-2 font-mono">65% Percorso Completato</p>
                  </div>
                </div>
              </aside>
            </div>
          )}
        </AnimatePresence>

      </main>

      {/* CONFIRMATION RESET MODAL */}
      <AnimatePresence>
        {showConfirmReset && (
          <div className="fixed inset-0 bg-stone-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-stone-900 border border-stone-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl relative"
            >
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-amber-500/10 rounded-lg text-amber-400">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-socrate font-bold text-stone-100">Ricominciare da capo?</h3>
              </div>
              <p className="text-stone-400 text-sm leading-relaxed mb-6">
                Vuoi davvero ricominciare? La conversazione attuale con Socrate verrà persa e dovrai selezionare nuovamente l'anno e la materia.
              </p>
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowConfirmReset(false)}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-stone-800 hover:border-stone-700 bg-stone-950/40 text-stone-300 text-sm font-semibold transition-all cursor-pointer"
                >
                  Annulla
                </button>
                <button
                  type="button"
                  onClick={handleResetChat}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-amber-400 text-stone-950 text-sm font-bold transition-all hover:opacity-90 shadow-[0_0_15px_rgba(245,158,11,0.15)] cursor-pointer"
                >
                  Ricomincia
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* FOOTER SYSTEM CREDITS */}
      <footer className="py-4 border-t border-white/5 bg-[#0A0A0B]/60 text-center text-[10px] font-mono text-stone-600 mt-auto uppercase tracking-widest">
        <div className="max-w-5xl mx-auto px-4">
          Socrate Tutor Maieutico • Progettato per le Scuole Superiori Italiane
        </div>
      </footer>

    </div>
  );
}
