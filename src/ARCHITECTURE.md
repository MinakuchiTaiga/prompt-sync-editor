# JpEn - Prompt Sync Editor - コード構造

## ディレクトリ構造

```
src/
├── types.ts                    # 型定義（共通インターフェース）
├── constants.ts                # 定数（LLMモデル設定、システムプロンプト）
├── App.tsx                     # メインアプリケーションコンポーネント
├── main.tsx                    # エントリーポイント
├── crypto.ts                   # 暗号化ユーティリティ
├── sanitizer.ts               # セキュリティサニタイゼーション
│
├── hooks/                      # カスタムReactフック
│   ├── useApiKeys.ts          # APIキー管理
│   ├── useUserSettings.ts     # ユーザー設定管理
│   └── useHistory.ts          # Undo/Redo履歴管理
│
├── services/                   # ビジネスロジック
│   ├── translationService.ts  # 翻訳API処理
│   └── tokenService.ts        # トークン数カウント
│
├── utils/                      # ユーティリティ関数
│   ├── diffUtils.ts           # テキスト差分検出
│   └── validationUtils.ts     # 入力検証・サニタイゼーション
│
└── components/                 # UIコンポーネント
    ├── Header.tsx             # ヘッダーコンポーネント
    ├── EditorPane.tsx         # エディターペインコンポーネント
    ├── ErrorToast.tsx         # エラー通知トースト
    └── modals/                # モーダルダイアログ
        ├── SettingsModal.tsx      # API設定モーダル
        ├── UserSettingsModal.tsx  # ユーザー設定モーダル
        └── HowToUseModal.tsx      # 使い方モーダル
```

## コンポーネント説明

### コアファイル

- **types.ts**: アプリケーション全体で使用する型定義を集約
- **constants.ts**: LLM プロバイダーの設定や固定値を管理
- **App.tsx**: メインロジックとコンポーネントの統合

### カスタムフック (hooks/)

- **useApiKeys**: API キーのロード・保存・暗号化を管理
- **useUserSettings**: ユーザー設定の永続化
- **useHistory**: Undo/Redo 機能の状態管理

### サービス (services/)

- **translationService**: LLM API を使用した翻訳処理
- **tokenService**: トークン数のカウント処理

### ユーティリティ (utils/)

- **diffUtils**: テキストの差分検出（行ベース）
- **validationUtils**: プロンプトインジェクション対策のサニタイゼーション

### コンポーネント (components/)

- **Header**: アプリケーションヘッダーとツールバー
- **EditorPane**: 左右のテキストエディタエリア
- **ErrorToast**: エラーメッセージ表示
- **modals/**: 各種設定・情報表示モーダル

## 設計思想

1. **関心の分離**: UI、ビジネスロジック、データ管理を明確に分離
2. **再利用性**: カスタムフックでロジックを共有可能に
3. **型安全性**: TypeScript の型システムを最大限活用
4. **保守性**: 各モジュールの責務を明確にし、変更の影響範囲を限定

## 主な変更点（リファクタリング前との比較）

- **1747 行 → 700 行**: App.tsx のコード量を大幅削減
- **再利用可能なフック**: 状態管理ロジックを独立させた
- **テスト容易性**: 各モジュールを個別にテスト可能に
- **読みやすさ**: ファイル名から責務が明確に理解できる
