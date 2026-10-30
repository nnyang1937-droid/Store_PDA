import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  formatDate,
  isValidCalendarDate,
  parseExpiryInput,
} from '../lib/date';
import { categoryTable, listTable, supabase } from '../lib/supabase';
import { useAppStore } from '../store/useAppStore';
import { toast } from '../store/useToastStore';

export default function EditProductPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const storeKey = useAppStore((state) => state.currentStoreKey);

  const [product, setProduct] = useState(null);
  const [barcode, setBarcode] = useState('');
  const [barcodeImage, setBarcodeImage] = useState(null);
  const [productName, setProductName] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [expiryInput, setExpiryInput] = useState('');
  const [expiryError, setExpiryError] = useState(null);
  const [categoryId, setCategoryId] = useState('');
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!storeKey) {
      navigate('/', { replace: true });
      return;
    }

    if (!id) {
      return;
    }

    (async () => {
      setLoading(true);

      const [{ data: productRow }, { data: categoryRows }] = await Promise.all([
        supabase
          .from(listTable(storeKey))
          .select('*')
          .eq('id', id)
          .maybeSingle(),
        supabase
          .from(categoryTable(storeKey))
          .select('*')
          .eq('is_active', true)
          .order('display_order'),
      ]);

      if (productRow) {
        setProduct(productRow);
        setBarcode(productRow.barcode);
        setBarcodeImage(productRow.barcode_image_url);
        setProductName(productRow.product_name || productRow.barcode || '');
        setExpiryDate(productRow.expiry_date);
        setExpiryInput(productRow.expiry_date.replace(/-/g, ''));
        setCategoryId(
          productRow.category_id ? String(productRow.category_id) : '',
        );
      }

      setCategories(categoryRows || []);
      setLoading(false);
    })();
  }, [id, storeKey, navigate]);

  const handleExpiryChange = (value) => {
    const digits = value.replace(/[^\d]/g, '').slice(0, 8);
    setExpiryInput(digits);
    setExpiryError(null);

    if (digits.length === 0) {
      setExpiryDate('');
      return;
    }

    if (digits.length < 4) {
      return;
    }

    const parsed = parseExpiryInput(digits);

    if (!parsed) {
      setExpiryError('올바른 날짜 형식이 아닙니다 (MMDD / YYYYMMDD).');
      setExpiryDate('');
      return;
    }

    if (!isValidCalendarDate(parsed.year, parsed.month, parsed.day)) {
      setExpiryError('달력에 없는 날짜입니다!');
      setExpiryDate('');
      return;
    }

    setExpiryDate(formatDate(parsed.year, parsed.month, parsed.day));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!storeKey || !product) {
      return;
    }

    if (!expiryDate) {
      toast.error('유통기한은 필수입니다.');
      return;
    }

    if (expiryError) {
      toast.error(expiryError);
      return;
    }

    setSubmitting(true);

    try {
      const { error } = await supabase
        .from(listTable(storeKey))
        .update({
          barcode,
          barcode_image_url: barcodeImage,
          product_name: productName.trim() || barcode,
          expiry_date: expiryDate,
          category_id: categoryId || null,
        })
        .eq('id', id);

      if (error) {
        throw error;
      }

      toast.success('저장되었습니다');
      navigate('/main');
    } catch (error) {
      console.error(error);
      toast.error('저장 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!storeKey || !product || !confirm('정말 삭제하시겠습니까?')) {
      return;
    }

    const { error } = await supabase
      .from(listTable(storeKey))
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('삭제 중 오류가 발생했습니다.');
      return;
    }

    toast.success('삭제되었습니다');
    navigate('/main');
  };

  if (loading) {
    return (
      <div className="p-6 text-center text-gray-400">불러오는 중...</div>
    );
  }

  if (!product) {
    return (
      <div className="p-6 text-center text-gray-400">
        제품을 찾을 수 없습니다.
      </div>
    );
  }

  return (
    <div className="min-h-full flex flex-col">
      <header className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
        <Link
          to="/main"
          className="p-2 -ml-2 rounded-lg hover:bg-gray-100"
          aria-label="뒤로"
        >
          ←
        </Link>
        <h1 className="font-semibold text-gray-900">제품 수정</h1>
      </header>

      <form
        onSubmit={handleSubmit}
        className="flex-1 px-4 py-4 pb-28 space-y-4"
      >
        <div className="card text-center">
          <div className="text-xs font-semibold text-gray-500 mb-2">바코드</div>
          {barcodeImage && (
            <img
              src={barcodeImage}
              alt="barcode"
              className="mx-auto max-h-20"
            />
          )}
          <div className="font-mono text-lg mt-1">{barcode}</div>
        </div>

        <div className="card space-y-4">
          <div>
            <label className="label" htmlFor="product-name">
              상품명
            </label>
            <input
              id="product-name"
              type="text"
              className="input"
              value={productName}
              onChange={(event) => setProductName(event.target.value)}
              placeholder="상품명을 입력하세요"
            />
          </div>

          <div>
            <label className="label" htmlFor="expiry-date">
              유통기한 *
            </label>
            <input
              id="expiry-date"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={8}
              className={`input font-mono ${
                expiryError ? 'ring-2 ring-red-400' : ''
              }`}
              value={expiryInput}
              onChange={(event) => handleExpiryChange(event.target.value)}
              placeholder={`${new Date().getFullYear()} + MMDD (예: ${new Date().getFullYear()}0731)`}
            />
            {expiryError && (
              <div className="text-xs text-red-600 mt-1">{expiryError}</div>
            )}
            {!expiryError && expiryDate && (
              <div className="text-xs text-gray-400 mt-1">→ {expiryDate}</div>
            )}
            <div className="text-xs text-gray-400 mt-1">
              연도({new Date().getFullYear()})가 미리 입력됨. 월/일(4자리)만 더
              입력하세요.
              <br />
              다른 연도로 변경 시 8자리 모두 입력 (YYYYMMDD)
            </div>
          </div>

          <div>
            <label className="label" htmlFor="category">
              카테고리
            </label>
            <select
              id="category"
              className="input"
              value={categoryId}
              onChange={(event) => setCategoryId(event.target.value)}
            >
              <option value="">선택 안 함</option>
              {categories.map((category) => (
                <option value={category.id} key={category.id}>
                  {category.category_name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 flex gap-2">
          <button
            type="button"
            onClick={handleDelete}
            className="btn-danger"
          >
            삭제
          </button>
          <Link to="/main" className="btn-secondary flex-1">
            취소
          </Link>
          <button
            type="submit"
            className="btn-primary flex-1"
            disabled={submitting}
          >
            {submitting ? '저장 중...' : '저장'}
          </button>
        </div>
      </form>
    </div>
  );
}
