import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../store/useAppStore';

export default function LoginPage() {
  const navigate = useNavigate();
  const setStore = useAppStore((state) => state.setStore);
  const currentStoreKey = useAppStore((state) => state.currentStoreKey);
  const [storeKey, setStoreKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (currentStoreKey) {
      navigate('/main', { replace: true });
    }
  }, [currentStoreKey, navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const key = storeKey.trim();
    if (!key) {
      setError('매장 키를 입력하세요.');
      return;
    }

    setLoading(true);
    setError(null);

    const { data, error: queryError } = await supabase
      .from('store_key')
      .select('*')
      .eq('store_key', key)
      .maybeSingle();

    setLoading(false);

    if (queryError) {
      setError(`오류: ${queryError.message}`);
      return;
    }

    if (!data) {
      setError('존재하지 않는 매장 키입니다.');
      return;
    }

    if (!data.is_active) {
      setError('비활성화된 매장입니다. 관리자에게 문의하세요.');
      return;
    }

    setStore(data.store_key, data.store_name);
    navigate('/main');
  };

  return (
    <div className="min-h-full flex flex-col items-center justify-center px-6 py-10">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-600 text-white text-3xl mb-4">
            📦
          </div>
          <h1 className="text-2xl font-bold text-gray-900">바코드 매장 관리</h1>
          <p className="text-sm text-gray-500 mt-2">
            매장 키를 입력하여 시작하세요
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label" htmlFor="store-key">
              매장 키
            </label>
            <input
              id="store-key"
              type="text"
              inputMode="text"
              autoCapitalize="none"
              autoCorrect="off"
              autoComplete="off"
              className="input"
              placeholder="예: seven01"
              value={storeKey}
              onChange={(event) => setStoreKey(event.target.value)}
              disabled={loading}
            />
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 ring-1 ring-red-200">
              {error}
            </div>
          )}

          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? '확인 중...' : '입장'}
          </button>
        </form>

        <p className="text-xs text-center text-gray-400 mt-6">
          매장 키는 관리자에게 문의하세요.
        </p>
      </div>
    </div>
  );
}
