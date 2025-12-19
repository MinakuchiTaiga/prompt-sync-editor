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
      <header className="bg-white/95 backdrop-blur-sm border-b border-blue-100 px-6 py-3.5 flex items-center justify-between z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 flex items-center justify-center shrink-0">
            <img src={logoImage} alt="JpEn Logo" className="w-9 h-9 object-contain" />
          </div>
          <div>
            <h1 className="text-lg leading-tight text-gray-900 tracking-wide flex items-baseline gap-2">
              <span style={{fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontStyle: 'italic'}}>JpEn</span>
              <span className="text-sm font-normal text-gray-500">- Prompt Sync Editor</span>
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">日本語と英語を双方向で同期しながらプロンプトを作成できます。</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
           {isTranslating && (
            <div className="flex items-center gap-2 text-blue-600 text-xs bg-blue-50 px-2.5 py-1.5 rounded-md">
              <Loader2 size={12} className="animate-spin" />
              <span className="font-medium">翻訳中...</span>
            </div>
          )}
          <button 
            onClick={handleClear}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
            title="クリア"
          >
            <Eraser size={18} />
          </button>
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className={`p-2 rounded-md transition-colors ${!apiKey ? 'text-red-500 bg-red-50 animate-pulse' : 'text-gray-500 hover:bg-gray-100'}`}
            title="API設定"
          >
            <Settings size={18} />
          </button>
        </div>
      </header>

      {/* Main Content - Split View */}
      <main className="flex-1 overflow-hidden relative bg-gradient-to-br from-blue-50/30 to-slate-50">
        <div className="h-full grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-blue-100">
          
          {/* Left Pane (Japanese) */}
          <EditorPane 
            title="Japanese (日本語)" 
            value={leftText} 
            onChange={handleLeftChange} 
            placeholder="ここに日本語のプロンプトを入力..."
            isTranslating={isTranslating && lastEdited === 'right'}
            tokenCount={leftTokenCount}
            langIcon={<span className="text-xs font-bold bg-blue-100 px-1.5 py-0.5 rounded text-blue-700">JP</span>}
          />

          {/* Right Pane (English) */}
          <EditorPane 
            title="English" 
            value={rightText} 
            onChange={handleRightChange} 
            placeholder="English prompt will appear here, or type to translate back..."
            isTranslating={isTranslating && lastEdited === 'left'}
            tokenCount={rightTokenCount}
            langIcon={<span className="text-xs font-bold bg-indigo-100 px-1.5 py-0.5 rounded text-indigo-700">EN</span>}
          />

        </div>
      </main>

      {/* Error Toast */}
      {error && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg shadow-md flex items-center gap-3 max-w-md z-50">
          <AlertCircle size={18} />
          <div className="text-sm font-medium">{error}</div>
          <button onClick={() => setError(null)} className="text-red-600 hover:text-red-800 font-bold text-lg leading-none">&times;</button>
        </div>
      )}

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-lg font-bold mb-3 flex items-center gap-2 text-gray-900">
              <Settings size={20} className="text-gray-700" />
              API設定
            </h2>
            <p className="text-sm text-gray-600 mb-5 leading-relaxed">
              リアルタイム翻訳とトークン数カウント機能を有効にするには、Google Gemini API キーを入力してください。キーはブラウザのローカルストレージに保存されます。
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2">Gemini API Key</label>
                <input 
                  type="password" 
                  placeholder="AIzaSy..." 
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-mono text-sm transition-all"
                  defaultValue={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                />
              </div>
              
              <div className="flex justify-end gap-2 pt-3">
                {apiKey && (
                  <button 
                    onClick={() => setIsSettingsOpen(false)}
                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg text-sm font-medium transition-colors"
                  >
                    キャンセル
                  </button>
                )}
                <button 
                  onClick={() => handleSaveApiKey(apiKey)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium shadow-sm transition-colors"
                >
                  保存して開始
                </button>
              </div>
              
              <p className="text-xs text-gray-500 mt-4 text-center">
                キーをお持ちでない場合は <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Google AI Studio</a> から取得できます。
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
      <div className="flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-blue-50/50 to-white border-b border-blue-100">
        <div className="flex items-center gap-2">
          {langIcon}
          <span className="font-medium text-gray-800 text-sm">{title}</span>
        </div>
        
        <div className="flex items-center gap-2.5">
          {/* Stats Badge: Tokens & Chars */}
          <div className="flex items-center px-2.5 py-1 bg-blue-50/80 border border-blue-200/60 rounded-md text-xs text-gray-700 font-mono">
             <div className="flex items-center gap-1.5" title="文字数">
                <Type size={11} className="text-blue-500"/>
                <span className="font-medium">{value.length.toLocaleString()}</span>
             </div>
             <div className="w-px h-3 bg-blue-300 mx-2"></div>
             <div className="flex items-center gap-1.5" title="推定トークン数 (Gemini)">
                <Calculator size={11} className="text-blue-500"/>
                <span className="font-medium">{tokenCount > 0 ? tokenCount.toLocaleString() : 0}</span>
             </div>
          </div>

          <button 
            onClick={handleCopy}
            disabled={!value}
            className={`px-2.5 py-1.5 rounded-md transition-all duration-200 flex items-center gap-1.5 text-xs font-medium
              ${copied ? 'bg-green-50 text-green-700 border border-green-200' : 'hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 text-gray-600 border border-transparent disabled:opacity-40 disabled:cursor-not-allowed'}`}
          >
            {copied ? <Check size={13} /> : <Copy size={13} />}
            {copied ? 'コピー完了' : 'コピー'}
          </button>
        </div>
      </div>

      {/* Text Area Wrapper */}
      <div className="flex-1 relative bg-white">
        <textarea
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full h-full p-5 resize-none outline-none text-gray-800 text-[15px] leading-relaxed font-mono placeholder:text-gray-400"
          spellCheck="false"
        />
        
        {/* Loading Overlay for this specific pane */}
        {isTranslating && (
          <div className="absolute top-4 right-4">
             <Loader2 size={18} className="animate-spin text-blue-500/60" />
          </div>
        )}
      </div>
    </div>
  );
};

export default App;