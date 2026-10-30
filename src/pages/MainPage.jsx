import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { listTable, supabase } from '../lib/supabase';
import { daysUntil, getExpiryStatus } from '../lib/date';
import { useIntersection } from '../lib/useIntersection';
import { useAppStore } from '../store/useAppStore';

const PAGE_SIZE = 30;

export default function MainPage() {
  const navigate = useNavigate();
  const storeKey = useAppStore((state) => state.currentStoreKey);
  const storeName = useAppStore((state) => state.currentStoreName);
  const clear = useAppStore((state) => state.clear);

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);

  const loadedPages = useRef(new Set());
  const loadingRef = useRef(false);
  const activeStoreRef = useRef(null);

  const loadPage = useCallback(
    async (pageIndex) => {
      if (!storeKey || loadingRef.current || loadedPages.current.has(pageIndex)) {
        return;
      }

      loadingRef.current = true;
      setLoading(true);

      const from = pageIndex * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const { data, error } = await supabase
        .from(listTable(storeKey))
        .select('*')
        .order('expiry_date', { ascending: true })
        .range(from, to);

      loadingRef.current = false;
      setLoading(false);

      if (error) {
        console.error('[main fetch error]', error);
        return;
      }

      const rows = data || [];
      loadedPages.current.add(pageIndex);
      setProducts((previous) => [...previous, ...rows]);

      if (rows.length < PAGE_SIZE) {
        setHasMore(false);
      }
    },
    [storeKey],
  );

  useEffect(() => {
    if (!storeKey) {
      navigate('/', { replace: true });
      return;
    }

    if (activeStoreRef.current === storeKey) {
      return;
    }

    activeStoreRef.current = storeKey;
    loadedPages.current = new Set();
    setProducts([]);
    setHasMore(true);
    setPage(0);
    loadPage(0);
  }, [storeKey, navigate, loadPage]);

  useEffect(() => {
    if (page > 0) {
      loadPage(page);
    }
  }, [page, loadPage]);

  const sentinelRef = useIntersection(
    () => {
      if (!loadingRef.current && hasMore) {
        setPage((previous) => previous + 1);
      }
    },
    [hasMore],
  );

  const handleLogout = () => {
    if (confirm('매장에서 나가시겠습니까?')) {
      activeStoreRef.current = null;
      clear();
      navigate('/');
    }
  };

  if (!storeKey) {
    return null;
  }

  return (
    <div className="min-h-full flex flex-col">
      <header className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div>
          <div className="text-xs text-gray-500">현재 매장</div>
          <div className="font-semibold text-gray-900">
            {storeName || storeKey}
            {storeName && (
              <span className="text-xs text-gray-400 font-normal ml-1.5">
                ({storeKey})
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Link
            to="/main/category"
            className="p-2 rounded-lg hover:bg-gray-100"
            aria-label="설정"
          >
            ⚙️
          </Link>
          <button
            onClick={handleLogout}
            className="p-2 rounded-lg hover:bg-gray-100"
            aria-label="나가기"
          >
            🚪
          </button>
        </div>
      </header>

      <main className="flex-1 px-4 py-4 pb-24">
        {products.length === 0 && !loading && (
          <div className="text-center py-16 text-gray-400">
            <div className="text-5xl mb-3">📭</div>
            <p>등록된 제품이 없습니다.</p>
            <p className="text-sm mt-1">하단 + 버튼을 눌러 추가하세요.</p>
          </div>
        )}

        <ul className="space-y-2">
          {products.map((product) => {
            const status = getExpiryStatus(product.expiry_date);
            const days = daysUntil(product.expiry_date);
            const displayName =
              product.product_name && product.product_name !== product.barcode
                ? product.product_name
                : product.barcode;

            return (
              <li key={product.id}>
                <Link
                  to={`/main/edit/${product.id}`}
                  className={`block card hover:shadow-md transition ${
                    status === 'expired' ? 'bg-red-50 ring-red-200' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {product.product_image_url ? (
                      <img
                        src={product.product_image_url}
                        alt={product.product_name}
                        className="w-14 h-14 object-cover rounded-lg bg-gray-100 flex-shrink-0"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-lg bg-gray-100 flex items-center justify-center text-2xl flex-shrink-0">
                        📦
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="font-semibold text-gray-900 truncate">
                          {displayName}
                        </div>
                        <div className="text-xs text-gray-500 flex-shrink-0">
                          {product.expiry_date}
                        </div>
                      </div>

                      {displayName !== product.barcode && (
                        <div className="text-xs text-gray-400 font-mono truncate">
                          {product.barcode}
                        </div>
                      )}

                      <div className="mt-1.5">
                        {status === 'expired' && (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-700">
                            🔴 유통기한 만료 ({Math.abs(days)}일 경과)
                          </span>
                        )}
                        {status === 'soon' && (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-orange-700">
                            🟠 {days}일 남음
                          </span>
                        )}
                        {status === 'fresh' && (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700">
                            🟢 {days}일 남음
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>

        <div
          ref={sentinelRef}
          className="h-10 flex items-center justify-center text-xs text-gray-400"
        >
          {loading
            ? '불러오는 중...'
            : !hasMore
              ? products.length > 0
                ? '모든 제품 로드 완료'
                : ''
              : ''}
        </div>
      </main>

      <Link
        to="/main/add"
        className="fixed bottom-6 right-6 w-16 h-16 rounded-full bg-brand-600 text-white text-3xl shadow-lg flex items-center justify-center active:scale-95 hover:bg-brand-700"
        aria-label="제품 추가"
      >
        +
      </Link>
    </div>
  );
}
