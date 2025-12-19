import { useState, useEffect } from 'react';
import { Settings, Copy, Check, AlertCircle, Eraser, Loader2, Calculator, Type } from 'lucide-react';
import logoImage from '/logo.png';

// --- Gemini API Configuration ---
// In a real environment, this might be injected. 
// Here we allow the user to input it via the UI.
const DEFAULT_API_KEY = ""; 

const GEMINI_MODEL = "gemini-2.5-flash-preview-09-2025";

const App = () => {
  // State
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('gemini_api_key') || DEFAULT_API_KEY);
  const [isSettingsOpen, setIsSettingsOpen] = useState(!apiKey);
  
  const [leftText, setLeftText] = useState(""); // Japanese (usually)
  const [rightText, setRightText] = useState(""); // English (usually)
  
  // Token Counts
  const [leftTokenCount, setLeftTokenCount] = useState(0);
  const [rightTokenCount, setRightTokenCount] = useState(0);
  
  const [isTranslating, setIsTranslating] = useState(false);
  const [lastEdited, setLastEdited] = useState<'left' | 'right' | null>(null); // 'left' or 'right'
  const [error, setError] = useState<string | null>(null);

  // Debounce logic to prevent API spam
  const [debouncedLeft, setDebouncedLeft] = useState(leftText);
  const [debouncedRight, setDebouncedRight] = useState(rightText);

  // Setup debounce timers
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedLeft(leftText), 1000);
    return () => clearTimeout(timer);
  }, [leftText]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedRight(rightText), 1000);
    return () => clearTimeout(timer);
  }, [rightText]);

  // Save API Key
  const handleSaveApiKey = (key: string) => {
    setApiKey(key);
    localStorage.setItem('gemini_api_key', key);
    setIsSettingsOpen(false);
  };

  // Helper: Fetch Token Count
  const fetchTokenCount = async (text: string) => {
    if (!text.trim() || !apiKey) return 0;
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:countTokens?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: text }] }]
          })
        }
      );
      const data = await response.json();
      return data.totalTokens || 0;
    } catch (error) {
      console.warn("Token count failed", error);
      return 0;
    }
  };

  // Translation Function
  const translateText = async (text: string, sourceLang: string, targetLang: string) => {
    if (!text.trim() || !apiKey) return;

    setIsTranslating(true);
    setError(null);

    try {
      const systemPrompt = `
        You are a professional translator for Prompt Engineering. 
        Your task is to translate the user's prompt from ${sourceLang} to ${targetLang}.
        
        CRITICAL RULES:
        1. Preserve all prompt syntax exactly (e.g., {{variable}}, {param}, [placeholder], XML tags like <rule>).
        2. Do not add conversational filler like "Here is the translation". Just output the translated text.
        3. Maintain the tone and nuance suited for LLM prompting (precise, imperative, clear).
        4. If the input is empty, return empty.
      `;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: text }] }],
            systemInstruction: { parts: [{ text: systemPrompt }] }
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || "Translation failed");
      }

      const translatedContent = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      return translatedContent.trim();

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Translation failed');
      return null;
    } finally {
      setIsTranslating(false);
    }
  };

  // Effect: Trigger translation when LEFT (Japanese) changes consistently
  useEffect(() => {
    // Update token count independently of translation trigger
    fetchTokenCount(debouncedLeft).then(setLeftTokenCount);

    if (lastEdited === 'left' && debouncedLeft) {
      const performTranslation = async () => {
        const translated = await translateText(debouncedLeft, "Japanese", "English");
        if (translated !== null) {
          setRightText(translated);
        }
      };
      performTranslation();
    } else if (!debouncedLeft) {
        setLeftTokenCount(0);
    }
  }, [debouncedLeft, apiKey]);

  // Effect: Trigger translation when RIGHT (English) changes consistently
  useEffect(() => {
    // Update token count independently of translation trigger
    fetchTokenCount(debouncedRight).then(setRightTokenCount);

    if (lastEdited === 'right' && debouncedRight) {
      const performTranslation = async () => {
        const translated = await translateText(debouncedRight, "English", "Japanese");
        if (translated !== null) {
          setLeftText(translated);
        }
      };
      performTranslation();
    } else if (!debouncedRight) {
        setRightTokenCount(0);
    }
  }, [debouncedRight, apiKey]);

  // Handlers
  const handleLeftChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLeftText(e.target.value);
    setLastEdited('left');
  };

  const handleRightChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setRightText(e.target.value);
    setLastEdited('right');
  };

  const handleClear = () => {
    setLeftText("");
    setRightText("");
    setLeftTokenCount(0);
    setRightTokenCount(0);
    setLastEdited(null);
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 flex items-center justify-center shrink-0">
            <img src={logoImage} alt="JpEn Logo" className="w-10 h-10 object-contain" />
          </div>
          <div>
            <h1 className="text-xl leading-tight text-black tracking-wide flex items-baseline gap-2">
              <span style={{fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontStyle: 'italic'}}>JpEn</span>
              <span className="text-base font-normal text-slate-600">- Prompt Sync Editor</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">日本語と英語を双方向で同期しながらプロンプトを作成できます。</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
           {isTranslating && (
            <div className="flex items-center gap-2 text-blue-600 text-sm bg-blue-50 px-3 py-1 rounded-full animate-pulse">
              <Loader2 size={14} className="animate-spin" />
              Translating...
            </div>
          )}
          <button 
            onClick={handleClear}
            className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
            title="Clear All"
          >
            <Eraser size={20} />
          </button>
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className={`p-2 rounded-md transition-colors ${!apiKey ? 'text-red-500 bg-red-50 animate-pulse' : 'text-slate-500 hover:bg-slate-100'}`}
            title="API Settings"
          >
            <Settings size={20} />
          </button>
        </div>
      </header>

      {/* Main Content - Split View */}
      <main className="flex-1 overflow-hidden relative">
        <div className="h-full grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200">
          
          {/* Left Pane (Japanese) */}
          <EditorPane 
            title="Japanese (日本語)" 
            value={leftText} 
            onChange={handleLeftChange} 
            placeholder="ここに日本語のプロンプトを入力..."
            isTranslating={isTranslating && lastEdited === 'right'}
            tokenCount={leftTokenCount}
            langIcon={<span className="text-xs font-bold bg-slate-200 px-1.5 py-0.5 rounded text-slate-600">JP</span>}
          />

          {/* Right Pane (English) */}
          <EditorPane 
            title="English" 
            value={rightText} 
            onChange={handleRightChange} 
            placeholder="English prompt will appear here, or type to translate back..."
            isTranslating={isTranslating && lastEdited === 'left'}
            tokenCount={rightTokenCount}
            langIcon={<span className="text-xs font-bold bg-slate-200 px-1.5 py-0.5 rounded text-slate-600">EN</span>}
          />

        </div>
      </main>

      {/* Error Toast */}
      {error && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-red-100 border border-red-300 text-red-800 px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 max-w-md z-50">
          <AlertCircle size={20} />
          <div className="text-sm">{error}</div>
          <button onClick={() => setError(null)} className="text-red-800 hover:text-red-950 font-bold">&times;</button>
        </div>
      )}

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Settings size={24} className="text-slate-700" />
              設定
            </h2>
            <p className="text-sm text-slate-600 mb-4">
              リアルタイム翻訳とトークン数カウント機能を有効にするには、Google Gemini API キーを入力してください。
              キーはブラウザのローカルストレージに保存されます。
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Gemini API Key</label>
                <input 
                  type="password" 
                  placeholder="AIzaSy..." 
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-mono text-sm"
                  defaultValue={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                />
              </div>
              
              <div className="flex justify-end gap-2 pt-2">
                {apiKey && (
                  <button 
                    onClick={() => setIsSettingsOpen(false)}
                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium"
                  >
                    キャンセル
                  </button>
                )}
                <button 
                  onClick={() => handleSaveApiKey(apiKey)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium shadow-sm"
                >
                  保存して開始
                </button>
              </div>
              
              <p className="text-xs text-slate-400 mt-4 text-center">
                キーをお持ちでない場合は、Google AI Studio から取得できます。
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Sub-component for Editor Pane
interface EditorPaneProps {
  title: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder: string;
  isTranslating: boolean;
  langIcon: React.ReactNode;
  tokenCount: number;
}

const EditorPane = ({ title, value, onChange, placeholder, isTranslating, langIcon, tokenCount }: EditorPaneProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full relative group">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-50/80 border-b border-slate-100">
        <div className="flex items-center gap-2">
          {langIcon}
          <span className="font-medium text-slate-700">{title}</span>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Stats Badge: Tokens & Chars */}
          <div className="flex items-center px-2 py-1 bg-white border border-slate-200 rounded text-xs text-slate-500 font-mono shadow-sm">
             <div className="flex items-center gap-1.5" title="Character Count">
                <Type size={12} className="text-slate-400"/>
                <span>{value.length.toLocaleString()}</span>
             </div>
             <div className="w-px h-3 bg-slate-200 mx-2"></div>
             <div className="flex items-center gap-1.5" title="Estimated Token Count (Gemini Model)">
                <Calculator size={12} className="text-slate-400"/>
                <span>{tokenCount > 0 ? tokenCount.toLocaleString() : 0}</span>
             </div>
          </div>

          <button 
            onClick={handleCopy}
            disabled={!value}
            className={`p-1.5 rounded-md transition-all duration-200 flex items-center gap-1.5 text-xs font-medium
              ${copied ? 'bg-green-100 text-green-700' : 'hover:bg-slate-200 text-slate-500'}`}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>

      {/* Text Area Wrapper */}
      <div className="flex-1 relative bg-white">
        <textarea
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full h-full p-6 resize-none outline-none text-slate-800 text-base leading-relaxed font-mono placeholder:text-slate-300"
          spellCheck="false"
        />
        
        {/* Loading Overlay for this specific pane */}
        {isTranslating && (
          <div className="absolute top-4 right-4">
             <Loader2 size={20} className="animate-spin text-blue-500/50" />
          </div>
        )}
      </div>
    </div>
  );
};

export default App;