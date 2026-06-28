import { initializeApp } from 'firebase/app'
import { getDatabase, ref, get, update } from 'firebase/database'
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

const content = `# Androidアプリ新規作成プロンプト（完全版）

このプロンプトは、新しいAndroidアプリを**ゼロから**作成するときに Claude に渡す指示書です。
以下の内容をそのまま Claude に貼り付けて使ってください。

---

## 使い方

\`\`\`
以下の「Androidアプリ新規作成プロンプト（完全版）」に従って、
新しいAndroidアプリをゼロから作成してください。

【作りたいアプリ】
〇〇〇（ここにアプリのアイデアを書く）

【対象ユーザー】
〇〇〇（誰のためのアプリか）

【主な機能】
- 機能1
- 機能2
- 機能3

【外部API使用】あり / なし
【バックグラウンド処理】あり / なし
【通知機能】あり / なし
【カメラ・位置情報など特殊権限】あり / なし

よろしくお願いします。
\`\`\`

---

# 🚀 Androidアプリ新規作成プロンプト（完全版）

本プロンプトは、アイデアの段階から動作するAndroidアプリを完成させるための、統合的な開発指示書です。
「最初から正しく作る」を原則とし、後から直すコストを最小化します。

---

## Phase 1：企画・設計（実装前に必ず実施）

### ① アプリの核心を定義する

\`\`\`
【アプリ名】（仮でもOK）
【一言説明】このアプリは「誰」が「何」をするためのもの？
【解決する問題】なぜこのアプリが必要？現状の不便は何？
【コア機能 TOP3】絶対に必要な機能を3つだけ選ぶ
【あったらいい機能】後回しにできる機能
【使わない機能】最初から除外するもの
\`\`\`

### ② 画面構成を決める

\`\`\`
必須画面：
- スプラッシュ / オンボーディング（初回起動）
- ホーム画面（メイン）
- 〇〇一覧画面
- 〇〇詳細画面
- 設定画面

ナビゲーション：
- BottomNavigationBar（タブ3〜5個）推奨
- または DrawerNavigation（メニュー項目が多い場合）
\`\`\`

### ③ データ設計を先に決める

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

### 基本スタック（全アプリ共通）

\`\`\`
言語：          Kotlin 2.1.0
UI：            Jetpack Compose + Material3
アーキテクチャ：MVVM（ViewModel + UiState）
DI：            Hilt 2.53.1
DB：            Room 2.7.1 + SQLCipher 4.5.4（暗号化）
非同期：        Kotlin Coroutines + Flow
ナビゲーション：Navigation Compose
DataStore：     androidx.datastore:datastore-preferences
ビルド：        AGP 8.7.0 / KSP 2.1.0-1.0.28
最小SDK：       API 26（Android 8.0）
ターゲットSDK： API 35
\`\`\`

### バックグラウンド処理（WorkManager）

\`\`\`
// 自動バックアップ・通知・定期処理が必要な場合は必須
implementation "androidx.work:work-runtime-ktx:2.9.0"
implementation "androidx.hilt:hilt-work:1.2.0"

// WorkerはHiltWorkerで作成
@HiltWorker
class MyWorker @AssistedInject constructor(
    @Assisted context: Context,
    @Assisted params: WorkerParameters,
) : CoroutineWorker(context, params)

// Manifestから自動初期化を除去（HiltWorkerFactoryを使うため）
<provider android:name="androidx.startup.InitializationProvider"
    tools:node="remove"/>
\`\`\`

### 通知（Notification）

\`\`\`
// 通知機能が必要な場合
- NotificationHelper クラスを util/ に作成
- NotificationChannel を App.kt の onCreate で登録
- Android 13以上は POST_NOTIFICATIONS パーミッション必須
- 通知タップでの画面遷移（PendingIntent）を実装
\`\`\`

### ネットワーク通信（外部APIを使う場合）

\`\`\`
implementation "com.squareup.retrofit2:retrofit:2.9.0"
implementation "com.squareup.okhttp3:okhttp:4.12.0"
implementation "com.squareup.okhttp3:logging-interceptor:4.12.0"

// タイムアウト設定（必須）
val client = OkHttpClient.Builder()
    .connectTimeout(30, TimeUnit.SECONDS)
    .readTimeout(60, TimeUnit.SECONDS)
    .build()

// HTTP通信はHTTPSのみ許可（network_security_config.xml）
// APIキーはDataStore（暗号化）に保存。コードに直書き禁止
\`\`\`

### 生体認証（Biometric）

\`\`\`
// ロック画面・プライバシー保護が必要な場合
implementation "androidx.biometric:biometric:1.2.0-alpha05"
\`\`\`

### エラーログ（Firebase Crashlytics）

\`\`\`
// リリース後のクラッシュ検知に必須
implementation platform("com.google.firebase:firebase-bom:33.0.0")
implementation "com.google.firebase:firebase-crashlytics-ktx"

// デバッグ中はCrashlyticsを無効化
// リリースビルドでのみ有効化（プライバシーポリシーに記載必須）
FirebaseCrashlytics.getInstance().setCrashlyticsCollectionEnabled(!BuildConfig.DEBUG)
\`\`\`

### AIを使う場合

\`\`\`
AIプロバイダー：Gemini（デフォルト）/ Claude / OpenAI を切替可能
APIキー管理：   DataStore + Android Keystore 暗号化
タイムアウト：  withTimeout(60_000L) を必ず設定
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
      preferences/       ← DataStore（暗号化）
      network/           ← Retrofit Service / API（使う場合）
    di/                  ← Hilt Module
      DatabaseModule.kt
      NetworkModule.kt   ← Retrofit設定（使う場合）
      PreferencesModule.kt
    presentation/
      screen/            ← 各画面（Screen.kt + ViewModel.kt）
        home/
        settings/
    util/
      NotificationHelper.kt  ← 通知（使う場合）
      PermissionHelper.kt    ← 権限（使う場合）
    worker/              ← WorkerクラスHilt（使う場合）
    MainActivity.kt
    App.kt
  src/main/res/
    drawable/
      ic_launcher_foreground.xml  ← アプリアイコン（Vector）
    mipmap-*/            ← アイコン各サイズ（自動生成）
    values/
      strings.xml        ← 全テキスト（ハードコード禁止）
      colors.xml
    xml/
      network_security_config.xml
      backup_rules.xml
      data_extraction_rules.xml
\`\`\`

### ② 最初に必ず設定するもの（省略禁止）

\`\`\`kotlin
// 1. AndroidManifest.xml
android:allowBackup="false"
android:fullBackupContent="@xml/backup_rules"
android:dataExtractionRules="@xml/data_extraction_rules"
android:networkSecurityConfig="@xml/network_security_config"

// 2. .gitignore に追加（必須）
local.properties
*.jks
*.keystore
google-services.json
/app/release/

// 3. Room DB バージョン
@Database(version = 1, exportSchema = true)

// 4. App.kt でNotificationChannel登録（通知を使う場合）
if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
    val channel = NotificationChannel(CHANNEL_ID, "通知", NotificationManager.IMPORTANCE_DEFAULT)
    getSystemService(NotificationManager::class.java).createNotificationChannel(channel)
}
\`\`\`

### ③ Room DB バージョン管理ルール

\`\`\`
- DB バージョンは v1 から開始
- カラム追加・削除のたびにバージョンを +1
- Migration は必ず書く（fallbackToDestructiveMigration は禁止）
- exportSchema = true に設定してスキーマをGitで管理
\`\`\`

---

## Phase 4：実装順序（この順番を守る）

### ステップ1：土台（スキップ禁止）

\`\`\`
[ ] build.gradle.kts に全依存関係を追加
[ ] App.kt（@HiltAndroidApp）作成
[ ] MainActivity.kt セットアップ
[ ] Navigation グラフ定義
[ ] テーマ設定（Color.kt / Type.kt / Theme.kt）
[ ] Room DB・Entity・DAO 作成
[ ] Hilt Module 作成
[ ] アプリアイコン設定（Image Asset で生成）
\`\`\`

### ステップ2：コア画面

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

### ステップ4：パーミッション実装（必要な場合）

\`\`\`kotlin
// PermissionHelper.kt に集約
// rememberPermissionState / rememberMultiplePermissionsState を使用
// 権限拒否時のGraceful Fallback（エラーではなく代替UI）を必ず実装

// よくある権限と理由説明文：
// カメラ：「写真を撮影するためにカメラへのアクセスが必要です」
// 通知：「お知らせを受け取るために通知の許可が必要です」
// 連絡先：「友達を招待するために連絡先へのアクセスが必要です」

[ ] パーミッション要求ダイアログの実装
[ ] 拒否された場合の代替処理
[ ] 「次回から表示しない」選択時の設定画面誘導
\`\`\`

### ステップ5：バックグラウンド処理（WorkManager）

\`\`\`kotlin
[ ] Worker クラス作成（@HiltWorker）
[ ] OneTimeWorkRequest または PeriodicWorkRequest 設定
[ ] WorkManagerInitializer を Manifest から除去
[ ] App.kt で HiltWorkerFactory を Configuration.Provider 経由で設定

// 定期実行の例（自動バックアップ：週1回）
PeriodicWorkRequestBuilder<AutoBackupWorker>(7, TimeUnit.DAYS)
    .setConstraints(
        Constraints.Builder()
            .setRequiredNetworkType(NetworkType.NOT_REQUIRED)
            .build()
    ).build()
\`\`\`

### ステップ6：テスト作成

\`\`\`kotlin
// ユニットテスト（app/src/test/）
// ViewModel・Repository・UseCase のテスト
class HomeViewModelTest {
    @get:Rule val coroutineRule = MainCoroutineRule()
    private val repository = FakeRepository()
    private val viewModel = HomeViewModel(repository)

    @Test fun \`初期状態は空リスト\`() = runTest {
        val state = viewModel.uiState.first()
        assertThat(state.items).isEmpty()
    }
}

// UIテスト（app/src/androidTest/）
// Compose UIのテスト
@Test fun \`ホーム画面が正常に表示される\`() {
    composeTestRule.setContent { HomeScreen(...) }
    composeTestRule.onNodeWithText("ホーム").assertIsDisplayed()
}

[ ] ViewModelのユニットテスト（最低3件）
[ ] Repositoryのユニットテスト（最低2件）
[ ] 主要画面のUIテスト（最低1件）
\`\`\`

### ステップ7：品質向上

\`\`\`
[ ] エラーハンドリング（全 try-catch）
[ ] ローディング状態（UiState に isLoading 追加）
[ ] 空状態の表示（データが0件のとき）
[ ] バリデーション（入力フォームの検証）
[ ] アクセシビリティ（contentDescription 追加）
\`\`\`

### ステップ8：アイコン・スプラッシュ設定

\`\`\`
アプリアイコン：
[ ] Android Studio → res/drawable に ic_launcher_foreground.xml 作成
[ ] res を右クリック → New → Image Asset でアイコン生成
[ ] Adaptive Icon（foreground + background）形式で作成
[ ] 512×512px の PNG も用意（PlayStore用）

スプラッシュ画面：
[ ] SplashScreen API（Android 12以上）を使用
[ ] res/values/themes.xml に windowSplashScreenBackground 設定
\`\`\`

### ステップ9：リリース準備

\`\`\`
[ ] ProGuard 設定完了（Room / Hilt / Gson のルール追加）
[ ] 署名設定（build.gradle.kts に signingConfigs 追加）
[ ] versionCode / versionName 設定
[ ] 不要な Log.d() を削除
[ ] TestDataSeeder などのデバッグコードをガード
[ ] Crashlytics を release のみ有効化
\`\`\`

---

## Phase 5：UI / UX 設計ルール

\`\`\`
✅ Material3 コンポーネントを使う
✅ ダークモード対応（MaterialTheme.colorScheme を使う）
✅ 日本語テキストは strings.xml に定義
✅ ボタンは最低 48dp のタッチターゲット
✅ エラーメッセージは日本語・平易な言葉で
✅ 処理中は必ず CircularProgressIndicator を表示
✅ スクロールリストは LazyColumn / LazyRow を使う

❌ ハードコードの色（MaterialTheme 経由で指定）
❌ メインスレッドでの重い処理
❌ インラインの文字列定数
\`\`\`

### アイコンのルール

\`\`\`
使用可能：Icons.Default.*（常に利用可能）
使用可能：Icons.Filled.*
要注意：Icons.Outlined.* → extended が必要
代替手段：Icons.Default.* で似たアイコンを探す
代替手段：graphicsLayer { rotationZ = 90f } で回転して代用
\`\`\`

---

## Phase 6：セキュリティ設定（省略禁止）

\`\`\`kotlin
// 1. DB暗号化（Room + SQLCipher）
val factory = SupportFactory(passphrase)
Room.databaseBuilder(...).openHelperFactory(factory).build()

// 2. DataStore暗号化（AES-256-GCM + Android Keystore）
// APIキー・設定値は平文保存禁止

// 3. ネットワーク（HTTPS強制）
// network_security_config.xml で cleartextTrafficPermitted="false"
// ただしローカルLAN（192.168.*）は例外とする

// 4. バックアップ除外
// backup_rules.xml で DB・DataStore を除外設定

// 5. ログ管理
// リリースビルドでは Log.d() を完全除去（Timber 推奨）
// BuildConfig.DEBUG で分岐
\`\`\`

---

## Phase 7：ビルド確認チェックリスト

\`\`\`
ビルド：
[ ] ./gradlew assembleDebug でエラーなし
[ ] ./gradlew assembleRelease でエラーなし
[ ] Lint エラーがないこと（./gradlew lintDebug）

動作確認：
[ ] 全画面が正常に表示される
[ ] データの作成・読取・更新・削除が動作する
[ ] 画面回転後もデータが保持される（ViewModel）
[ ] アプリ強制終了→再起動後もデータが残る（Room）
[ ] ネットワークなし状態での動作確認
[ ] 通知が正しく表示される（使う場合）
[ ] パーミッション拒否時に代替処理が動く（使う場合）
[ ] バックグラウンド処理が正常動作する（使う場合）

パフォーマンス：
[ ] 起動時間 3秒以内
[ ] スクロールがスムーズ（カクつきなし）
[ ] メモリリークなし（Android Studio Profiler で確認）

テスト：
[ ] ユニットテストが全てパス（./gradlew test）
[ ] UIテストが全てパス（./gradlew connectedAndroidTest）
\`\`\`

---

## Phase 8：完了条件

\`\`\`
[ ] 全コア機能が動作している
[ ] releaseビルドが成功する
[ ] DB暗号化が有効
[ ] エラー状態・空状態・ローディング状態が全画面で対応済み
[ ] strings.xml に全テキストが定義済み
[ ] ダークモードで表示が崩れない
[ ] 縦・横画面どちらでもクラッシュしない
[ ] 全テストがパスしている
[ ] アプリアイコンが設定されている
[ ] Crashlytics が release のみ有効
\`\`\`

完了後は以下の順で品質向上フェーズへ移行：
1. **万能・アプリ機能磨き上げ実装プロンプト** → 多角的改善
2. **超極限・Androidアプリ磨き上げ指示書** → 限界まで磨く

---

## 補記：よくある失敗と対策

| 失敗パターン | 対策 |
|------------|------|
| DBスキーマを後から大幅変更 | Phase 1 でデータ設計を先に決める |
| 画面が増えてナビゲーションが複雑化 | Phase 1 で全画面をリストアップしてから着手 |
| ビルドが通らない依存関係の競合 | 固定の技術スタック（Phase 2）から変更しない |
| アイコンが表示されない | Icons.Default.* のみ使用 |
| リリースビルドで動作しない | Phase 3 の ProGuard 設定を最初に入れる |
| APIキーが GitHub に漏れる | .gitignore に *.jks / local.properties を追加 |
| WorkManager が動かない | HiltWorkerFactory を Configuration.Provider 経由で設定、Manifestから自動初期化を除去 |
| 通知が届かない | NotificationChannel を App.kt で登録、Android 13以上はパーミッション要求 |
| パーミッション拒否でクラッシュ | 拒否時の Graceful Fallback を必ず実装 |
| テストが書けない | ViewModel は FakeRepository を使ってテスト。UI は composeTestRule で検証 |
`

// 既存のドキュメントを探して更新
const snap = await get(ref(db, 'docs'))
const docs = snap.val() || {}
let targetKey = null
for (const [key, doc] of Object.entries(docs)) {
  if (doc.title && doc.title.includes('新規作成')) {
    targetKey = key
    break
  }
}

if (targetKey) {
  await update(ref(db, `docs/${targetKey}`), {
    title: 'Androidアプリ新規作成プロンプト（完全版）',
    content,
    updatedAt: new Date().toISOString(),
  })
  console.log(`✅ 既存ドキュメントを更新しました (key: ${targetKey})`)
} else {
  console.log('❌ 対象ドキュメントが見つかりません')
}
process.exit(0)
