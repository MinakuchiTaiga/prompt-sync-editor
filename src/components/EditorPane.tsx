import { useState } from 'react';
import { Copy, Check, Type, Calculator, Loader2 } from 'lucide-react';
import type { Highlight } from '../types';

interface EditorPaneProps {
  title: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder: string;
  isTranslating: boolean;
  langIcon: React.ReactNode;
  tokenCount: number;
  showManualTranslate?: boolean;
  onManualTranslate?: () => void;
  highlights?: Highlight[];
}

export const EditorPane = ({ 
  title, 
  value, 
  onChange, 
  placeholder, 
  isTranslating, 
  langIcon, 
  tokenCount, 
  showManualTranslate, 
  onManualTranslate, 
  highlights = [] 
}: EditorPaneProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Render text with highlights
  const renderHighlightedText = () => {
    if (!highlights.length || !value) return null;

    const parts: React.ReactElement[] = [];
    let lastIndex = 0;

    highlights.forEach((highlight, idx) => {
      if (highlight.start > lastIndex) {
        parts.push(
          <span key={`text-${idx}`}>{value.substring(lastIndex, highlight.start)}</span>
        );
      }

      const highlightedText = value.substring(highlight.start, highlight.end);
      parts.push(
        <span
          key={`highlight-${idx}`}
          className={
            highlight.type === 'added'
              ? 'bg-green-200/70 animate-fade-out'
              : 'bg-red-200/70 line-through animate-fade-out'
          }
        >
          {highlightedText}
        </span>
      );

      lastIndex = highlight.end;
    });

    if (lastIndex < value.length) {
      parts.push(
        <span key="text-end">{value.substring(lastIndex)}</span>
      );
    }

    return (
      <div className="absolute inset-0 p-5 text-[15px] leading-relaxed font-mono whitespace-pre-wrap pointer-events-none break-words">
        {parts}
      </div>
    );
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
              <span>{value.length.toLocaleString()}</span>
            </div>
            <div className="w-px h-3 bg-blue-300 mx-2"></div>
            <div className="flex items-center gap-1.5" title="推定トークン数 (Gemini)">
              <Calculator size={11} className="text-blue-500"/>
              <span>{tokenCount.toLocaleString()}</span>
            </div>
          </div>

          {showManualTranslate && onManualTranslate && (
            <button 
              onClick={onManualTranslate}
              disabled={!value || isTranslating}
              className="px-2.5 py-1.5 rounded-md transition-all duration-200 flex items-center gap-1.5 text-xs font-medium hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 text-gray-600 border border-transparent disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Type size={13} />
              翻訳
            </button>
          )}
          <button 
            onClick={handleCopy}
            disabled={!value}
            className={`px-2.5 py-1.5 rounded-md transition-all duration-200 flex items-center gap-1.5 text-xs font-medium cursor-pointer
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
          className={`w-full h-full p-5 resize-none outline-none text-[15px] leading-relaxed font-mono placeholder:text-gray-400 ${
            highlights.length > 0 ? 'text-transparent caret-gray-800' : 'text-gray-800'
          }`}
          spellCheck="false"
        />
        
        {/* Highlighted Text Overlay */}
        {renderHighlightedText()}
        
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
