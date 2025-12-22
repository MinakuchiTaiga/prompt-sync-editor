import { Settings } from 'lucide-react';
import type { LLMProvider, ApiKeys } from '../../types';
import { LLM_LABELS } from '../../constants';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  llmProvider: LLMProvider;
  setLlmProvider: (provider: LLMProvider) => void;
  apiKeys: ApiKeys;
  setApiKeys: (keys: ApiKeys) => void;
  saveToLocalStorage: boolean;
  setSaveToLocalStorage: (save: boolean) => void;
  onSave: () => void;
}

export const SettingsModal = ({
  isOpen,
  onClose,
  llmProvider,
  setLlmProvider,
  apiKeys,
  setApiKeys,
  saveToLocalStorage,
  setSaveToLocalStorage,
  onSave
}: SettingsModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
        <h2 className="text-lg font-bold mb-3 flex items-center gap-2 text-gray-900">
          <Settings size={20} className="text-gray-700" />
          API設定
        </h2>
        <p className="text-sm text-gray-600 mb-5 leading-relaxed">
          使用するLLMプロバイダーを選択し、APIキーを入力してください。
        </p>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              翻訳LLM
            </label>
            <select
              value={llmProvider}
              onChange={(e) => setLlmProvider(e.target.value as LLMProvider)}
              className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm transition-all"
            >
              {Object.entries(LLM_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
          
          {llmProvider === 'gemini' && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Google Gemini APIキー
              </label>
              <input 
                type="password" 
                placeholder="AIzaSy..." 
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-mono text-sm transition-all"
                value={apiKeys.gemini}
                onChange={(e) => setApiKeys({ ...apiKeys, gemini: e.target.value })}
              />
              <p className="text-xs text-gray-500 mt-1.5">
                <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Google AI Studio</a>で無料で取得できます
              </p>
            </div>
          )}
          
          {llmProvider === 'openai' && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                OpenAI APIキー
              </label>
              <input 
                type="password" 
                placeholder="sk-proj-..." 
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-mono text-sm transition-all"
                value={apiKeys.openai}
                onChange={(e) => setApiKeys({ ...apiKeys, openai: e.target.value })}
              />
              <p className="text-xs text-gray-500 mt-1.5">
                <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">OpenAI Platform</a>で取得できます
              </p>
            </div>
          )}
          
          {llmProvider === 'claude' && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Anthropic Claude APIキー
              </label>
              <input 
                type="password" 
                placeholder="sk-ant-..." 
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-mono text-sm transition-all"
                value={apiKeys.claude}
                onChange={(e) => setApiKeys({ ...apiKeys, claude: e.target.value })}
              />
              <p className="text-xs text-gray-500 mt-1.5">
                <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Anthropic Console</a>で取得できます
              </p>
            </div>
          )}
          
          <div className="border-t border-gray-200 pt-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="checkbox" 
                checked={saveToLocalStorage}
                onChange={(e) => setSaveToLocalStorage(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
              />
              <span className="text-sm text-gray-700">
                APIキーを永続保存する（ブラウザに保存）
              </span>
            </label>
            <p className="text-xs text-gray-500 mt-2 ml-6">
              チェックを外すと、タブを閉じるとAPIキーが削除されます（セッションストレージに保存）。
              セキュリティを重視する場合は、チェックを外してください。
            </p>
          </div>
          
          <div className="flex justify-end gap-2 pt-3">
            <button 
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg text-sm font-medium transition-colors"
            >
              キャンセル
            </button>
            <button 
              onClick={onSave}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium shadow-sm transition-colors"
            >
              保存
            </button>
          </div>
          
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-[10px] text-amber-900 leading-relaxed">
              <strong className="font-semibold">⚠️ 免責事項：</strong>
              APIキーはブラウザのローカルストレージに暗号化して保存されますが、XSS攻撃などのセキュリティリスクから完全に保護されるものではありません。APIキーの漏洩や不正使用による損害について、本アプリケーションの開発者は一切の責任を負いません。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
