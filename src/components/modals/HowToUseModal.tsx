import { BookOpen, Settings, Zap, Shield } from 'lucide-react';

interface HowToUseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HowToUseModal = ({ isOpen, onClose }: HowToUseModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-6 max-h-[85vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-900">
          <BookOpen size={24} className="text-blue-600" />
          JpEn - 使い方
        </h2>
        
        <div className="space-y-5 text-sm text-gray-700 leading-relaxed">
          <section>
            <h3 className="font-bold text-base text-gray-900 mb-2 flex items-center gap-2">
              <Zap size={16} className="text-blue-600" /> 概要
            </h3>
            <p>
              JpEnは、日本語と英語を双方向でリアルタイム翻訳するエディタです。
              日本語でプロンプトを考えながら、自動的に英語版を生成できるため、
              AIチャットでのトークン節約に最適です。
            </p>
          </section>

          <section className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm font-semibold text-amber-900">
              ⚙️ 最初に、画面右上の <Settings size={14} className="inline" /> からAPIキーを設定してください。
            </p>
          </section>

          <section>
            <h3 className="font-bold text-base text-gray-900 mb-2 flex items-center gap-2">
              <Zap size={16} className="text-blue-600" /> 基本的な使い方
            </h3>
            <ul className="space-y-2 list-disc list-inside ml-2">
              <li>
                <strong>日本語入力:</strong> 左側のエリアに日本語でプロンプトを入力すると、
                自動的に右側に英語訳が表示されます。
              </li>
              <li>
                <strong>英語入力:</strong> 右側に英語を入力すると、左側に日本語訳が表示されます。
              </li>
              <li>
                <strong>リアルタイム同期:</strong> 入力を止めてから1秒後（設定変更可）に自動翻訳が実行されます。
              </li>
              <li>
                <strong>差分翻訳:</strong> 変更した部分だけを翻訳するため、効率的で高速です。
              </li>
              <li>
                <strong>コピー機能:</strong> 各エリアの右上にある「コピー」ボタンで簡単にコピーできます。
              </li>
            </ul>
          </section>

          <section>
            <h3 className="font-bold text-base text-gray-900 mb-2 flex items-center gap-2">
              <Zap size={16} className="text-blue-600" /> 機能説明
            </h3>
            <ul className="space-y-2 list-disc list-inside ml-2">
              <li>
                <strong>トークン数表示:</strong> 各エリアの右上に文字数とトークン数が表示されます。
                トークン数はAPIの使用量の目安になります。
              </li>
              <li>
                <strong>差分ハイライト:</strong> 翻訳された部分は緑色でハイライトされ、
                削除される部分は赤色の取り消し線で表示されます。
              </li>
              <li>
                <strong>元に戻す/やり直し:</strong> 画面右上のアイコンで操作履歴を管理できます（最大50件）。
              </li>
              <li>
                <strong>クリア:</strong> 両方のエリアを一度にクリアできます。
              </li>
              <li>
                <strong>自動/手動翻訳:</strong> ユーザー設定で自動翻訳をOFFにすると、
                手動で翻訳ボタンを押すモードに切り替わります。
              </li>
              <li>
                <strong>LLM選択:</strong> Google Gemini、OpenAI、Anthropic Claudeから選択できます。
              </li>
              <li>
                <strong>APIキー保存:</strong> LocalStorageまたはSessionStorageに暗号化して保存できます。
              </li>
            </ul>
          </section>

          <section>
            <h3 className="font-bold text-base text-gray-900 mb-2 flex items-center gap-2">
              <Zap size={16} className="text-blue-600" /> トークン節約のメリット
            </h3>
            <p>
              日本語は英語に比べて約2倍のトークン数を消費します。
              このツールを使うことで、日本語で考えながら効率的な英語プロンプトを作成でき、
              <strong className="text-blue-600">API使用料を大幅に削減</strong>できます。
            </p>
          </section>

          <section>
            <h3 className="font-bold text-base text-gray-900 mb-2 flex items-center gap-2">
              <Shield size={16} className="text-blue-600" /> セキュリティとプライバシー
            </h3>
            <ul className="space-y-2 list-disc list-inside ml-2">
              <li>
                <strong>APIキー暗号化:</strong> SubtleCrypto APIを使用して暗号化されます。
              </li>
              <li>
                <strong>プロンプトインジェクション対策:</strong> 入力と出力を検証・サニタイズします。
              </li>
              <li>
                <strong>ローカル実行:</strong> すべての処理はブラウザ内で完結し、
                サーバーにデータは送信されません（選択したLLM APIへの送信を除く）。
              </li>
              <li>
                <strong>SessionStorage:</strong> タブを閉じるとAPIキーが削除されるモードも選択可能です。
              </li>
            </ul>
          </section>

          <section className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-bold text-base text-gray-900 mb-2">💡 ヒント</h3>
            <ul className="space-y-1 list-disc list-inside ml-2 text-xs">
              <li>プロンプトの構造（XMLタグや変数記法）は自動的に保持されます</li>
              <li>複数行の編集も正確に反映されます</li>
              <li>削除操作は1秒間のハイライト後に反映されます</li>
              <li>頻繁に使う場合は、APIキーを永続保存すると便利です</li>
            </ul>
          </section>
        </div>
        
        <div className="flex justify-end mt-6">
          <button 
            onClick={onClose}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium shadow-sm transition-colors"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};
