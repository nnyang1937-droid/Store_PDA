export default function SetupPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6 py-10">
      <div className="w-full max-w-sm card p-6 space-y-4">
        <div className="text-4xl">🛠️</div>

        <div>
          <h1 className="text-xl font-bold text-gray-900">
            Supabase 설정이 필요합니다
          </h1>
          <p className="text-sm text-gray-500 mt-2">
            무료 Supabase 프로젝트를 만들고 아래 순서대로 연결하세요.
          </p>
        </div>

        <div className="space-y-2 text-sm text-gray-700">
          <p>
            <strong>1.</strong>{' '}
            <a
              href="https://supabase.com/dashboard"
              target="_blank"
              rel="noreferrer"
              className="text-brand-600"
              style={{ textDecoration: 'underline' }}
            >
              supabase.com/dashboard
            </a>
            에서 새 프로젝트를 만듭니다. (Free 플랜)
          </p>
          <p>
            <strong>2.</strong> SQL Editor에서{' '}
            <code className="font-mono text-xs">supabase/quickstart.sql</code>{' '}
            전체를 실행합니다.
          </p>
          <p>
            <strong>3.</strong> Project Settings → API에서 Project URL과
            anon/publishable key를 복사합니다.
          </p>
          <p>
            <strong>4.</strong> 프로젝트 루트의{' '}
            <code className="font-mono text-xs">.env.example</code>을{' '}
            <code className="font-mono text-xs">.env</code>로 복사하고 두 값을
            넣습니다.
          </p>
        </div>

        <pre
          className="bg-gray-100 rounded-lg p-3 text-xs font-mono text-gray-700"
          style={{ overflowX: 'auto', whiteSpace: 'pre-wrap' }}
        >
          {`VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_...`}
        </pre>

        <p className="text-xs text-gray-400">
          저장 후 개발 서버를 다시 시작하면 매장 키 <strong>seven01</strong>로
          바로 로그인할 수 있습니다.
        </p>
      </div>
    </div>
  );
}
