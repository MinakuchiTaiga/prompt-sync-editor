import { User } from 'lucide-react';
import type { UserSettings } from '../../types';

interface UserSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userSettings: UserSettings;
  setUserSettings: (settings: UserSettings) => void;
  onSave: () => void;
}

export const UserSettingsModal = ({
  isOpen,
  onClose,
  userSettings,
  setUserSettings,
  onSave
}: UserSettingsModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
        <h2 className="text-lg font-bold mb-3 flex items-center gap-2 text-gray-900">
          <User size={20} className="text-gray-700" />
          ユーザー設定
        </h2>
        <p className="text-sm text-gray-600 mb-5 leading-relaxed">
          翻訳の動作を調整できます。
        </p>
        
        <div className="space-y-5">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-semibold text-gray-700">
                自動翻訳
              </label>
              <button
                onClick={() => setUserSettings({ ...userSettings, autoTranslate: !userSettings.autoTranslate })}
                className={
                  userSettings.autoTranslate 
                    ? 'relative inline-flex h-6 w-11 items-center rounded-full transition-colors bg-blue-600' 
                    : 'relative inline-flex h-6 w-11 items-center rounded-full transition-colors bg-gray-300'
                }
              >
                <span
                  className={
                    userSettings.autoTranslate 
                      ? 'inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-6' 
                      : 'inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-1'
                  }
                />
              </button>
            </div>
            <p className="text-xs text-gray-500">
              ONの場合、入力に応じて自動的に翻訳が実行されます。
              OFFの場合、手動で翻訳ボタンを押す必要があります。
            </p>
          </div>
          
          <div>
            <label className={`block text-sm font-semibold mb-2 transition-colors ${!userSettings.autoTranslate ? 'text-gray-400' : 'text-gray-700'}`}>
              翻訳遅延時間: {(userSettings.translationDelay / 1000).toFixed(1)}秒
            </label>
            <input 
              type="range" 
              min="500" 
              max="5000" 
              step="100"
              value={userSettings.translationDelay}
              onChange={(e) => setUserSettings({ ...userSettings, translationDelay: Number(e.target.value) })}
              className={`w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600 transition-opacity ${!userSettings.autoTranslate ? 'opacity-40 cursor-not-allowed' : ''}`}
              disabled={!userSettings.autoTranslate}
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>0.5秒</span>
              <span>5秒</span>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              タイピングが止まってから翻訳が開始されるまでの待機時間です。
            </p>
          </div>
          
          <div className="flex justify-end gap-2 pt-3 border-t border-gray-200">
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
        </div>
      </div>
    </div>
  );
};
