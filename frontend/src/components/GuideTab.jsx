import { useState } from 'react'

const STAGES = [
  {
    num: 1, color: '#8b5cf6', label: '企画・設計',
    icon: '💡',
    summary: 'どんなアプリにするか決める段階です。「こういうアプリを作りたい」というアイデアを整理します。',
    steps: [
      { title: 'アプリのアイデアを決める', body: '「誰のために」「何ができる」アプリかを一言で言えるようにします。\n例：「人物の関係をグラフで管理するアプリ」' },
      { title: '必要な機能をリストアップ', body: '画面・機能を箇条書きにします。\n例：ホーム画面 / メモ入力 / グラフ表示 / 設定\nClaude に「こんなアプリに必要な機能は？」と聞くと整理しやすいです。' },
      { title: '技術スタックを決める（Claude に任せてOK）', body: 'Androidアプリなら Kotlin + Jetpack Compose が標準です。\nDI・DBなどの技術選択は Claude に「ベストプラクティスで」と依頼すれば自動的に決めてくれます。' },
    ],
    faq: [
      { q: 'アイデアがあいまいでも大丈夫？', a: 'OK です。Claude に「〇〇なアプリを作りたいが何から始めればいい？」と聞くと設計を一緒に考えてくれます。' },
    ],
  },
  {
    num: 2, color: '#3b82f6', label: '実装',
    icon: '⌨️',
    summary: 'Claude にコードを書いてもらう段階です。コード自体を書く必要はありません。',
    steps: [
      { title: 'Claude に「実装して」と依頼する', body: '「このアプリのホーム画面を実装してください」のように具体的に指示します。\nClaude がコードを自動生成・ファイルに書き込みします。' },
      { title: 'コミット（= 作業記録をつける）', body: 'Claude が実装した後「コミットして」と言えばOKです。\n\nコミットとは？→ その時点の作業を記録すること。セーブポイントのようなイメージです。\nファイルが壊れても直前のコミットまで戻れます。' },
      { title: '動作確認（Android Studio または実機）', body: 'Android Studio の「▶ Run」ボタンでエミュレーター上で動かして確認します。\n実機（スマートフォン）でも USB ケーブルで接続して確認できます。' },
      { title: '万能・磨き上げプロンプトを使う', body: '実装が一通り終わったら、万能磨き上げプロンプトを使って多角的に改善します。\nこれを繰り返すことでアプリの品質が上がっていきます。' },
    ],
    faq: [
      { q: 'コードが長すぎてよくわからない', a: 'わからなくて大丈夫です。Claude が管理しています。「このコードは何をしているの？」と聞けば説明してくれます。' },
      { q: 'エラーが出た', a: 'エラーメッセージをそのまま Claude に貼り付けて「これを直して」と言えばOKです。' },
    ],
  },
  {
    num: 3, color: '#10b981', label: 'テスト・修正',
    icon: '🔍',
    summary: '万能磨き上げプロンプト・超極限指示書を繰り返し使ってアプリを磨き上げる段階です。',
    steps: [
      { title: '超極限・Androidアプリ磨き上げ指示書を使う', body: 'セキュリティ (CIA 三原則)・パフォーマンス・UX を極限まで磨き上げます。\n何度でも実行できます。実行するたびにアプリが改善されます。' },
      { title: 'コードレビュー（/code-review ultra）', body: 'Claude Code の機能でコードを自動レビューさせます。\n発見された問題点を Claude が修正します。' },
      { title: 'バグ修正', body: '実際に使ってみてバグを発見したら Claude に伝えます。\n「〇〇の画面で△△すると落ちる」のように具体的に伝えるとすぐ直してくれます。' },
      { title: 'ビルドが通ることを確認', body: 'Claude が「assembleDebug」コマンドを実行してビルドエラーがないか確認します。\nエラーがあれば Claude が自動修正します。' },
    ],
    faq: [
      { q: 'どのくらい磨けばいい？', a: 'PlayStore準備度（このダッシュボードの%）が80%以上になったら次のステージに進む目安です。' },
      { q: '磨き上げはあと何回くらい？', a: '目安として万能プロンプト 3〜5回 + 超極限指示書 2〜3回 が一般的です。アプリの複雑さによって変わります。' },
    ],
  },
  {
    num: 4, color: '#f59e0b', label: 'ビルド・署名',
    icon: '🔐',
    summary: 'PlayStore に出品するための「リリース用ファイル」を作る段階です。一度設定すれば以降は簡単です。',
    steps: [
      {
        title: '署名キーを生成する（初回のみ・最重要）',
        body: `署名キーとは？→ 「このアプリは私が作りました」という電子サインです。

Android Studio での操作：
① メニュー「Build」→「Generate Signed Bundle / APK」
② 「Android App Bundle」を選択して「Next」
③「Create new...」をクリック
④ 以下を入力：
   ・Key store path: 保存場所（例: C:\\Users\\user\\mykey.jks）
   ・Password: 忘れないパスワード
   ・Alias: 任意の名前（例: mykey）
   ・Validity: 25（年）
⑤「OK」で生成

⚠ 重要：生成した .jks ファイルと パスワードは絶対に失くさないこと！
  紛失するとアプリの更新が永遠にできなくなります。`,
      },
      {
        title: 'build.gradle に署名設定を追加する',
        body: `Claude に「リリースビルド用の署名設定を build.gradle.kts に追加して」と依頼します。
Claude が自動的に設定を追加してくれます。

環境変数を使うように設定してもらうと .jks ファイルをGitに含めずに済むので安全です。`,
      },
      {
        title: 'リリース用 AAB ファイルを生成する',
        body: `① メニュー「Build」→「Generate Signed Bundle / APK」
② 「Android App Bundle (.aab)」を選択して「Next」
③ 署名キーのファイルとパスワードを入力
④「Release」を選択して「Finish」
⑤ app/release/ フォルダに app-release.aab が生成される

.aab ファイルが PlayStore にアップロードするファイルです。`,
      },
    ],
    faq: [
      { q: '.apk と .aab の違いは？', a: '.apk はアプリのインストールファイル（古い形式）。.aab は Google が推奨する新しい形式で、PlayStore では .aab を使います。.aab は Google が自動的に各端末向けに最適化してくれます。' },
      { q: '署名キーを間違えて削除してしまった', a: 'バックアップがなければ復元不可能です。その場合は新しいアプリとして再登録するしかありません。必ず複数の場所にバックアップを！' },
    ],
  },
  {
    num: 5, color: '#ef4444', label: 'PlayStore 申請',
    icon: '📤',
    summary: 'Google Play Console にアプリ情報を登録して、審査に提出する段階です。',
    steps: [
      {
        title: 'Google Play Console のアカウントを作成する',
        body: `① play.google.com/console にアクセス
② Google アカウントでログイン
③ 開発者アカウントの登録（初回のみ）
   ・開発者名を入力（本名 or 会社名）
   ・連絡先メールアドレス
   ・登録料 25ドル（約4,000円）を支払い → 一生有効

これで無制限にアプリを出品できるようになります。`,
      },
      {
        title: 'アプリ情報を準備する',
        body: `以下を事前に用意しておきます：

【文章】
・アプリ名（最大30文字）
・短い説明（80文字以内）
・詳細説明（4,000文字以内）
・リリースノート（このバージョンの変更点）

【画像】
・アプリアイコン（512 × 512px、PNG）
・スクリーンショット（最低2枚、スマホ画面のキャプチャ）
・フィーチャーグラフィック（1,024 × 500px）← ストアページのバナー

Claude に「PlayStore 申請用の説明文を日本語で書いて」と依頼すると自動生成してくれます。`,
      },
      {
        title: 'プライバシーポリシーを用意する',
        body: `カメラ・位置情報・連絡先など個人情報を扱う場合は必須です。

無料で作成できるサービス：
・App Privacy Policy Generator（英語）
・プライバシーポリシー生成ツール（日本語）

作成したページの URL を PlayStore に登録します。
URL がない場合は Google Sites（無料）で公開することもできます。`,
      },
      {
        title: '新しいアプリを作成して情報を入力する',
        body: `① Play Console で「アプリを作成」
② アプリ名、言語、アプリ or ゲーム選択
③ 左メニューの各項目を埋めていく：
   ・ストアの掲載情報（説明文・スクショ）
   ・アプリのコンテンツ（対象年齢・コンテンツレーティング）
   ・ターゲットと配布（配布先の国）
   ・メインストアの掲載情報
④「製品版」→「新しいリリースを作成」
⑤ .aab ファイルをアップロード
⑥ 「審査のために送信」をクリック`,
      },
    ],
    faq: [
      { q: 'コンテンツレーティングがよくわからない', a: '質問に答えていくと自動的にレーティングが決まります。一般的なアプリなら「全年齢」になります。' },
      { q: 'プライバシーポリシーの URL がない', a: 'Google Sites（sites.google.com）で無料でページを作って公開できます。Claude に「プライバシーポリシーの文章を作って」と頼むと内容を生成してくれます。' },
    ],
  },
  {
    num: 6, color: '#6366f1', label: '審査・公開',
    icon: '🚀',
    summary: 'Google の審査を通過したら公開です！ここまで来たらゴールです。',
    steps: [
      { title: '審査を待つ', body: '初回審査：3〜7日程度かかることが多いです（最近は1〜2日のこともあります）。\n更新の場合：通常1〜3日程度。\n審査中は何もしなくてOKです。結果はメールで通知されます。' },
      { title: '審査が通らなかった場合（リジェクト）', body: 'Play Console にリジェクト理由が表示されます。\nよくある理由：\n・スクリーンショットがアプリと合っていない\n・プライバシーポリシーが見つからない\n・パーミッション（権限）の説明が不足\n\n理由を Claude に伝えると修正方法を教えてくれます。修正→再提出すればOKです。' },
      { title: '公開！', body: '審査通過後、「公開」ボタンを押すと1〜2時間で PlayStore に表示されます。\n自動公開に設定していれば、審査通過と同時に公開されます。\n\nおめでとうございます！ここがゴールです 🎉' },
      { title: 'アプリを更新する（今後の流れ）', body: '今後コードを修正したら：\n① build.gradle の versionCode を +1する\n② リリース用 .aab を再生成\n③ Play Console で「新しいリリースを作成」にアップロード\n④ 審査提出（更新版はすぐ通ることが多い）\n\nこれを繰り返すだけです。' },
    ],
    faq: [
      { q: '無料アプリに費用はかかる？', a: '初回登録費（25ドル）のみです。無料アプリには手数料はかかりません。有料アプリや課金がある場合は売上の15〜30%がGoogleの手数料です。' },
      { q: 'PlayStore に出品したら世界中からダウンロードできる？', a: 'はい。配布設定で「全世界」にしておけばどこからでもダウンロードできます。日本のみに絞ることも可能です。' },
      { q: 'アプリを削除したい場合は？', a: 'Play Console で「アプリを非公開」または「削除」できます。削除は慎重に（アプリIDを再利用できなくなります）。' },
    ],
  },
]

function StageCard({ stage, isOpen, onToggle }) {
  return (
    <div style={{
      border: `1px solid ${stage.color}30`,
      borderRadius: 'var(--radius)',
      marginBottom: '0.75rem',
      overflow: 'hidden',
      background: 'var(--surface)',
      boxShadow: 'var(--shadow)',
    }}>
      <button
        onClick={onToggle}
        style={{
          width: '100%', textAlign: 'left',
          padding: '1rem 1.25rem',
          display: 'flex', alignItems: 'center', gap: 12,
          background: isOpen ? `${stage.color}10` : 'transparent',
          borderBottom: isOpen ? `1px solid ${stage.color}20` : 'none',
        }}
      >
        <span style={{
          width: 32, height: 32, borderRadius: '50%',
          background: stage.color,
          color: '#fff', fontWeight: 700, fontSize: 14,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          {stage.num}
        </span>
        <span style={{ fontSize: 20 }}>{stage.icon}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, color: 'var(--text)', fontSize: 15 }}>
            ステージ{stage.num}: {stage.label}
          </div>
          {!isOpen && (
            <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>
              {stage.summary}
            </div>
          )}
        </div>
        <span style={{ color: 'var(--text3)', fontSize: 12, flexShrink: 0 }}>
          {isOpen ? '▲ 閉じる' : '▼ 詳しく見る'}
        </span>
      </button>

      {isOpen && (
        <div style={{ padding: '1.25rem' }}>
          <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: '1.25rem', lineHeight: 1.7 }}>
            {stage.summary}
          </p>

          {stage.steps.map((step, i) => (
            <div key={i} style={{
              marginBottom: '1.25rem',
              paddingLeft: '1rem',
              borderLeft: `3px solid ${stage.color}`,
            }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: '0.4rem', color: 'var(--text)' }}>
                {i + 1}. {step.title}
              </div>
              <pre style={{
                fontSize: 12, color: 'var(--text2)',
                whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                lineHeight: 1.7, fontFamily: 'inherit',
              }}>
                {step.body}
              </pre>
            </div>
          ))}

          {stage.faq && stage.faq.length > 0 && (
            <div style={{
              background: 'var(--surface2)',
              borderRadius: 'var(--radius-sm)',
              padding: '1rem',
              marginTop: '0.5rem',
            }}>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: '0.75rem', color: 'var(--text2)' }}>
                よくある質問
              </div>
              {stage.faq.map((item, i) => (
                <div key={i} style={{ marginBottom: i < stage.faq.length - 1 ? '0.75rem' : 0 }}>
                  <div style={{ fontWeight: 500, fontSize: 13, color: 'var(--text)', marginBottom: 2 }}>
                    Q: {item.q}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.6 }}>
                    A: {item.a}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function GuideTab() {
  const [openStage, setOpenStage] = useState(null)

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>
          PlayStore 出品 完全ガイド
        </h2>
        <p style={{ color: 'var(--text3)', fontSize: 13 }}>
          アプリ開発のはじめからPlayStore公開まで、ステージをクリックして詳しく確認できます
        </p>
      </div>

      {/* フロー概要 */}
      <div style={{
        display: 'flex', alignItems: 'center',
        overflowX: 'auto', gap: 0,
        marginBottom: '1.5rem',
        paddingBottom: '0.5rem',
      }}>
        {STAGES.map((s, i) => (
          <div key={s.num} style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
            <button
              onClick={() => setOpenStage(openStage === s.num ? null : s.num)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                gap: 4, padding: '0.5rem 0.75rem',
                borderRadius: 'var(--radius-sm)',
                background: openStage === s.num ? `${s.color}15` : 'var(--surface)',
                border: `1px solid ${openStage === s.num ? s.color : 'var(--border)'}`,
                minWidth: 72,
              }}
            >
              <span style={{
                width: 28, height: 28, borderRadius: '50%',
                background: s.color, color: '#fff',
                fontSize: 13, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {s.num}
              </span>
              <span style={{ fontSize: 11, color: 'var(--text2)', textAlign: 'center' }}>
                {s.label}
              </span>
            </button>
            {i < STAGES.length - 1 && (
              <div style={{ color: 'var(--text3)', fontSize: 16, padding: '0 4px' }}>›</div>
            )}
          </div>
        ))}
      </div>

      {/* ステージ詳細 */}
      {STAGES.map((stage) => (
        <StageCard
          key={stage.num}
          stage={stage}
          isOpen={openStage === stage.num}
          onToggle={() => setOpenStage(openStage === stage.num ? null : stage.num)}
        />
      ))}
    </div>
  )
}
