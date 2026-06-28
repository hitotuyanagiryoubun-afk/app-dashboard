import { initializeApp } from 'firebase/app'
import { getDatabase, ref, push } from 'firebase/database'
import dotenv from 'dotenv'
dotenv.config()

const app = initializeApp({
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.FIREBASE_DATABASE_URL,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
})
const db = getDatabase(app)

const content = `# Androidアプリ新規作成プロンプト（ゼロから開発版）

このプロンプトは、新しいAndroidアプリを**ゼロから**作成するときに Claude に渡す指示書です。
以下の内容をそのまま Claude に貼り付けて使ってください。

---

## 使い方

\`\`\`
以下の「Androidアプリ新規作成プロンプト」に従って、
新しいAndroidアプリをゼロから作成してください。

【作りたいアプリ】
〇〇〇（ここにアプリのアイデアを書く）

【対象ユーザー】
〇〇〇（誰のためのアプリか）

【主な機能】
- 機能1
- 機能2
- 機能3

よろしくお願いします。
\`\`\`

---

# 🚀 Androidアプリ新規作成プロンプト

本プロンプトは、アイデアの段階から動作するAndroidアプリを完成させるための、統合的な開発指示書です。

「最初から正しく作る」を原則とし、後から直すコストを最小化します。

---

## Phase 1：企画・設計（実装前に必ず実施）

### ① アプリの核心を定義する

以下を明確にしてからコードを1行も書かないこと：

\`\`\`
【アプリ名】（仮でもOK）
【一言説明】このアプリは「誰」が「何」をするためのもの？
【解決する問題】なぜこのアプリが必要？現状の不便は何？
【コア機能 TOP3】絶対に必要な機能を3つだけ選ぶ
【あったらいい機能】後回しにできる機能
【使わない機能】最初から除外するもの
\`\`\`

### ② 画面構成を決める

実装前に全画面をリストアップ：

\`\`\`
必須画面：
- スプラッシュ / オンボーディング（初回起動）
- ホーム画面（メイン）
- 〇〇一覧画面
- 〇〇詳細画面
- 設定画面
- （その他アプリ固有の画面）

ナビゲーション：
- BottomNavigationBar（タブ3〜5個）推奨
- または DrawerNavigation（メニュー項目が多い場合）
\`\`\`

### ③ データ設計を先に決める

画面より先にデータ構造を決める（後から変えるとコストが大きい）：

\`\`\`
【メインエンティティ】
例：User / Item / Record など

【リレーション】
例：User は複数の Item を持つ

【保存場所】
- ローカルのみ → Room DB
- クラウド同期あり → Room + API
- 設定値 → DataStore
\`\`\`

---

## Phase 2：技術スタック（固定）

以下の技術スタックを**必ず**使用すること。変更は禁止。

\`\`\`
言語：         Kotlin 2.1.0
UI：           Jetpack Compose + Material3
アーキテクチャ：MVVM（ViewModel + UiState）
DI：           Hilt 2.53.1
DB：           Room 2.7.1
非同期：       Kotlin Coroutines + Flow
ナビゲーション：Navigation Compose
ビルド：       AGP 8.7.0 / KSP 2.1.0-1.0.28
最小SDK：      API 26（Android 8.0）
ターゲットSDK：API 35
\`\`\`

**AIを使う場合は追加：**
\`\`\`
AIプロバイダー：Gemini（デフォルト）/ Claude / OpenAI を切替可能
APIキー管理：  DataStore + Android Keystore 暗号化
\`\`\`

---

## Phase 3：プロジェクト初期セットアップ

### ① 必須ファイル構成

\`\`\`
app/
  src/main/java/com/{packagename}/
    data/
      database/          ← Room Entity / DAO / Database
      repository/        ← Repository（データアクセス統一）
      preferences/       ← DataStore
    di/                  ← Hilt Module
    presentation/
      screen/            ← 各画面（Screen.kt + ViewModel.kt）
        home/
        settings/
        （画面ごとにフォルダ）
    util/                ← 共通ユーティリティ
    MainActivity.kt
    App.kt               ← Application クラス（Hilt用）
\`\`\`

### ② 最初に必ず設定するもの（省略禁止）

\`\`\`kotlin
// 1. セキュリティ設定（AndroidManifest.xml）
android:allowBackup="false"
android:debuggable="false"  // release時

// 2. Room DB の暗号化（SQLCipher）
implementation "net.zetetic:sqlcipher-android:4.5.4"

// 3. DataStore の暗号化
implementation "androidx.security:security-crypto:1.1.0-alpha06"

// 4. ProGuard 設定（app/proguard-rules.pro）
// Room / Hilt / Gson のルール追加

// 5. .gitignore に追加
local.properties
*.jks
google-services.json
\`\`\`

### ③ Room DB バージョン管理ルール

\`\`\`
- DB バージョンは v1 から開始
- カラム追加・削除のたびにバージョンを +1
- Migration は必ず書く（fallbackToDestructiveMigration は禁止）
- exportSchema = true に設定
\`\`\`

---

## Phase 4：実装順序（この順番を守る）

### ステップ1：土台を作る（スキップ禁止）

\`\`\`
[ ] build.gradle.kts に全依存関係を追加
[ ] App.kt（@HiltAndroidApp）作成
[ ] MainActivity.kt セットアップ
[ ] Navigation グラフ定義
[ ] テーマ設定（Color.kt / Type.kt / Theme.kt）
[ ] Room DB・Entity・DAO 作成
[ ] Hilt Module 作成（DatabaseModule / PreferencesModule）
\`\`\`

### ステップ2：コア画面を実装

\`\`\`
[ ] ホーム画面（最重要画面から着手）
[ ] ViewModel + UiState 定義
[ ] Repository 実装
[ ] BottomNavigation セットアップ
\`\`\`

### ステップ3：残りの画面

\`\`\`
[ ] 一覧画面（LazyColumn）
[ ] 詳細画面
[ ] 入力・作成画面
[ ] 設定画面
\`\`\`

### ステップ4：品質向上

\`\`\`
[ ] エラーハンドリング（全 try-catch）
[ ] ローディング状態（UiState に isLoading 追加）
[ ] 空状態の表示（データが0件のとき）
[ ] バリデーション（入力フォームの検証）
[ ] アクセシビリティ（contentDescription 追加）
\`\`\`

### ステップ5：リリース準備

\`\`\`
[ ] ProGuard 設定完了
[ ] 署名設定（build.gradle.kts）
[ ] versionCode / versionName 設定
[ ] 不要な Log.d() 削除
[ ] TestDataSeeder などのデバッグコードを guard
\`\`\`

---

## Phase 5：UI / UX 設計ルール

### 絶対に守るルール

\`\`\`
✅ Material3 コンポーネントを使う（独自UIは最小限）
✅ ダークモード対応（MaterialTheme.colorScheme を使う）
✅ 日本語テキストは strings.xml に定義
✅ ボタンは最低 48dp のタッチターゲット
✅ エラーメッセージは日本語・平易な言葉で
✅ 処理中は必ず CircularProgressIndicator を表示
✅ スクロールリストは LazyColumn / LazyRow を使う

❌ ハードコードの色（Color(0xFF...）は MaterialTheme 経由で
❌ メインスレッドでの重い処理（DB・API は Coroutine で）
❌ インラインの文字列定数（strings.xml に入れる）
\`\`\`

### アイコンのルール

\`\`\`
使用可能：Icons.Default.*（常に利用可能）
使用可能：Icons.Filled.*
要注意：Icons.Outlined.* → extended が必要（依存関係に追加必須）
代替手段：Icons.Default.* で似たアイコンを探す
\`\`\`

---

## Phase 6：セキュリティ設定（省略禁止）

\`\`\`kotlin
// 1. DB暗号化（Room + SQLCipher）
@Database(entities = [...], version = 1, exportSchema = true)
abstract class AppDatabase : RoomDatabase() {
    companion object {
        fun create(context: Context, passphrase: ByteArray): AppDatabase {
            val factory = SupportFactory(passphrase)
            return Room.databaseBuilder(context, AppDatabase::class.java, "app.db")
                .openHelperFactory(factory)
                .build()
        }
    }
}

// 2. APIキー保存（DataStore + AES-256-GCM）
// 平文でSharedPreferencesに保存しない

// 3. ネットワーク通信
// HTTP禁止（HTTPSのみ）
// network_security_config.xml で設定

// 4. バックアップ除外
// backup_rules.xml で DB・DataStore を除外
\`\`\`

---

## Phase 7：ビルド確認チェックリスト

実装完了後、以下を必ず確認：

\`\`\`
ビルド：
[ ] ./gradlew assembleDebug でエラーなし
[ ] ./gradlew assembleRelease でエラーなし
[ ] Lint エラーがないこと

動作確認：
[ ] 全画面が正常に表示される
[ ] データの作成・読取・更新・削除が動作する
[ ] 画面回転後もデータが保持される
[ ] アプリを強制終了→再起動後もデータが残る
[ ] ネットワークなし状態での動作確認

パフォーマンス：
[ ] 起動時間 3秒以内
[ ] スクロールがスムーズ（カクつきなし）
[ ] メモリリークなし（Android Studio Profiler で確認）
\`\`\`

---

## Phase 8：完了条件

以下をすべて満たしたら「新規作成フェーズ完了」とする：

\`\`\`
[ ] 全コア機能が動作している
[ ] releaseビルドが成功する
[ ] DB の暗号化が有効
[ ] エラー状態・空状態・ローディング状態が全画面で対応済み
[ ] strings.xml に全テキストが定義済み
[ ] ダークモードで表示が崩れない
[ ] 縦・横画面どちらでもクラッシュしない
\`\`\`

完了後は「万能・アプリ機能磨き上げ実装プロンプト」→「超極限・Androidアプリ磨き上げ指示書」の順で品質向上フェーズへ移行する。

---

## 補記：よくある失敗と対策

| 失敗パターン | 対策 |
|------------|------|
| DBスキーマを後から大幅変更 | Phase 1 でデータ設計を先に決める |
| 画面が増えてナビゲーションが複雑化 | Phase 1 で全画面をリストアップしてから着手 |
| ビルドが通らない依存関係の競合 | 固定の技術スタック（Phase 2）から変更しない |
| アイコンが表示されない | Icons.Default.* のみ使用する |
| リリースビルドで動作しない | Phase 3 の ProGuard 設定を最初に入れる |
| APIキーが GitHub に漏れる | .gitignore に local.properties を追加、環境変数を使う |
`

const now = new Date().toISOString()
await push(ref(db, 'docs'), {
  title: 'Androidアプリ新規作成プロンプト（ゼロから開発版）',
  content,
  createdAt: now,
  updatedAt: now,
})
console.log('✅ 登録完了')
process.exit(0)
