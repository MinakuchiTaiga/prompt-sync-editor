import { Settings, Eraser, Undo2, Redo2, User, BookOpen, Loader2 } from 'lucide-react';
import logoImage from '/logo.png';

interface HeaderProps {
  isTranslating: boolean;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  onOpenHowToUse: () => void;
  onOpenUserSettings: () => void;
  onOpenSettings: () => void;
  showApiKeyTooltip: boolean;
  hasApiKey: boolean;
}

export const Header = ({
  isTranslating,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onClear,
  onOpenHowToUse,
  onOpenUserSettings,
  onOpenSettings,
  showApiKeyTooltip,
  hasApiKey
}: HeaderProps) => {
  return (
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
        <div className="flex items-center gap-1 border-r border-gray-200 pr-2 mr-1">
          <div className="relative group">
            <button 
              onClick={onUndo}
              disabled={!canUndo}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent cursor-pointer"
            >
              <Undo2 size={18} />
            </button>
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2.5 py-1.5 bg-blue-50 text-gray-700 text-xs font-medium rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-md border border-blue-100 z-[60]">
              前に戻る
            </div>
          </div>
          <div className="relative group">
            <button 
              onClick={onRedo}
              disabled={!canRedo}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent cursor-pointer"
            >
              <Redo2 size={18} />
            </button>
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2.5 py-1.5 bg-blue-50 text-gray-700 text-xs font-medium rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-md border border-blue-100 z-[60]">
              次に進む
            </div>
          </div>
        </div>
        <div className="relative group">
          <button 
            onClick={onClear}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors cursor-pointer"
          >
            <Eraser size={18} />
          </button>
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2.5 py-1.5 bg-blue-50 text-gray-700 text-xs font-medium rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-md border border-blue-100 z-[60]">
            クリア
          </div>
        </div>
        <div className="relative group">
          <button 
            onClick={onOpenHowToUse}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors cursor-pointer"
          >
            <BookOpen size={18} />
          </button>
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2.5 py-1.5 bg-blue-50 text-gray-700 text-xs font-medium rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-md border border-blue-100 z-[60]">
            使い方
          </div>
        </div>
        <div className="relative group">
          <button 
            onClick={onOpenUserSettings}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors cursor-pointer"
          >
            <User size={18} />
          </button>
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2.5 py-1.5 bg-blue-50 text-gray-700 text-xs font-medium rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-md border border-blue-100 z-[60]">
            ユーザー設定
          </div>
        </div>
        <div className="relative">
          <div className="group">
            <button 
              onClick={onOpenSettings}
              className={`p-2 rounded-md transition-colors cursor-pointer ${!hasApiKey ? 'text-red-500 bg-red-50 animate-pulse' : 'text-gray-500 hover:bg-gray-100'}`}
            >
              <Settings size={18} />
            </button>
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2.5 py-1.5 bg-blue-50 text-gray-700 text-xs font-medium rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-md border border-blue-100 z-[60]">
              API設定
            </div>
          </div>
          
          {/* API Key Setup Tooltip */}
          {showApiKeyTooltip && !hasApiKey && (
            <div className="absolute top-full right-0 mt-2 w-64 bg-blue-500 text-white p-4 rounded-lg shadow-xl z-50 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-start gap-2">
                <Settings size={18} className="mt-0.5 shrink-0" />
                <div>
                  <h3 className="font-bold mb-1">APIキーを設定してください</h3>
                  <p className="text-xs leading-relaxed">
                    翻訳を利用するには、右上の設定アイコンからAPIキーを登録する必要があります。
                  </p>
                </div>
                <button 
                  onClick={onOpenSettings}
                  className="text-white hover:text-blue-100 font-bold text-lg leading-none ml-auto"
                >
                  &times;
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
