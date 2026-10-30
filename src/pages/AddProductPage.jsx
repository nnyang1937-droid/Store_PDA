import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BrowserMultiFormatReader } from '@zxing/browser';
import {
  createBarcodeImage,
  createEanHints,
  decodeBarcodeFromImage,
  isEan,
} from '../lib/barcode';
import {
  formatDate,
  isValidCalendarDate,
  parseExpiryInput,
} from '../lib/date';
import { categoryTable, listTable, supabase } from '../lib/supabase';
import { useAppStore } from '../store/useAppStore';
import { toast } from '../store/useToastStore';

export default function AddProductPage() {
  const navigate = useNavigate();
  const storeKey = useAppStore((state) => state.currentStoreKey);

  const [mode, setMode] = useState('scan');
  const [barcode, setBarcode] = useState(null);
  const [barcodeImage, setBarcodeImage] = useState(null);
  const [expiryDate, setExpiryDate] = useState('');
  const [expiryInput, setExpiryInput] = useState(() =>
    String(new Date().getFullYear()),
  );
  const [expiryError, setExpiryError] = useState(null);
  const [categoryId, setCategoryId] = useState('');
  const [categories, setCategories] = useState([]);
  const [scanError, setScanError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [manualError, setManualError] = useState(null);
  const [imageDecoding, setImageDecoding] = useState(false);
  const [imageError, setImageError] = useState(null);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const controlsRef = useRef(null);
  const sessionRef = useRef(0);

  const applyBarcode = useCallback((value) => {
    setBarcode(value);
    try {
      setBarcodeImage(createBarcodeImage(value));
    } catch {
      setBarcodeImage(null);
    }
  }, []);

  const stopCamera = useCallback(() => {
    controlsRef.current?.stop();
    controlsRef.current = null;

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const startCamera = useCallback(async (session) => {
    setScanError(null);

    if (!navigator.mediaDevices?.getUserMedia) {
      setScanError(
        '이 브라우저는 카메라를 지원하지 않습니다. 수동 입력을 이용해주세요.',
      );
      setMode('manual');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      if (session !== sessionRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }

      const reader = new BrowserMultiFormatReader(createEanHints());
      const controls = await reader.decodeFromStream(
        stream,
        videoRef.current,
        (result, _error, scannerControls) => {
          if (!result || session !== sessionRef.current) {
            return;
          }

          const text = result.getText();
          if (!isEan(text)) {
            return;
          }

          applyBarcode(text);
          scannerControls.stop();
          stopCamera();

          if (navigator.vibrate) {
            navigator.vibrate(100);
          }
        },
      );

      if (session !== sessionRef.current) {
        controls.stop();
        return;
      }

      controlsRef.current = controls;
    } catch (error) {
      if (session !== sessionRef.current) {
        return;
      }

      let message =
        '카메라에 접근할 수 없습니다. 수동 입력을 이용해주세요.';

      if (error instanceof Error) {
        if (
          error.name === 'NotAllowedError' ||
          error.name === 'PermissionDeniedError'
        ) {
          message =
            '카메라 권한이 거부되었습니다. 브라우저 설정에서 권한을 허용해주세요.';
        } else if (
          error.name === 'NotFoundError' ||
          error.name === 'DevicesNotFoundError'
        ) {
          message = '카메라를 찾을 수 없습니다.';
        } else if (
          error.name === 'NotReadableError' ||
          error.name === 'TrackStartError'
        ) {
          message = '다른 앱에서 카메라를 사용 중입니다.';
        } else if (error.name === 'SecurityError') {
          message = 'HTTPS 연결이 필요합니다.';
        } else if (error.name === 'OverconstrainedError') {
          message = '후면 카메라가 없습니다. 수동 입력을 이용해주세요.';
        }
      }

      setScanError(message);
      setMode('manual');
      console.error('[scanner]', error);
    }
  }, [applyBarcode, stopCamera]);

  useEffect(() => {
    const session = ++sessionRef.current;

    if (mode === 'scan' && !barcode) {
      startCamera(session);
    } else {
      stopCamera();
    }

    return () => {
      sessionRef.current += 1;
      stopCamera();
    };
  }, [mode, barcode, startCamera, stopCamera]);

  useEffect(() => {
    if (!storeKey) {
      navigate('/', { replace: true });
      return;
    }

    (async () => {
      const { data } = await supabase
        .from(categoryTable(storeKey))
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      setCategories(data || []);
    })();
  }, [storeKey, navigate]);

  const handleImage = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      setImageError('이미지 파일만 가능합니다.');
      return;
    }

    setImageDecoding(true);
    setImageError(null);

    try {
      const value = await decodeBarcodeFromImage(file);

      if (!isEan(value)) {
        setImageError(
          `디코딩된 값(${value})이 EAN-13/EAN-8 형식이 아닙니다.`,
        );
        return;
      }

      applyBarcode(value);
    } catch (error) {
      console.error('[barcode decode]', error);
      setImageError(
        '이미지에서 바코드를 찾을 수 없습니다. 더 선명한 사진을 사용해주세요.',
      );
    } finally {
      setImageDecoding(false);
    }
  };

  const handleManualChange = (value) => {
    const trimmed = value.trim();
    setManualError(null);

    if (!trimmed) {
      setBarcode(null);
      setBarcodeImage(null);
      return;
    }

    if (!isEan(trimmed)) {
      setManualError(
        'EAN-13 (13자리) 또는 EAN-8 (8자리) 숫자만 가능합니다.',
      );
      return;
    }

    applyBarcode(trimmed);
  };

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

  const resetForm = () => {
    setBarcode(null);
    setBarcodeImage(null);
    setExpiryDate('');
    setExpiryInput(String(new Date().getFullYear()));
    setExpiryError(null);
    setManualError(null);
    setImageError(null);
    setScanError(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!storeKey) {
      return;
    }

    if (!barcode) {
      toast.error('바코드를 입력하거나 스캔하세요.');
      return;
    }

    if (expiryError) {
      toast.error(expiryError);
      return;
    }

    if (!expiryDate) {
      toast.error('유통기한을 입력하세요.');
      return;
    }

    setSubmitting(true);

    try {
      const { error } = await supabase.from(listTable(storeKey)).insert({
        store_key: storeKey,
        barcode,
        barcode_image_url: barcodeImage,
        product_name: barcode,
        product_image_url: null,
        expiry_date: expiryDate,
        category_id: categoryId || null,
        memo: null,
      });

      if (error) {
        throw error;
      }

      toast.success('제품이 추가되었습니다');
      resetForm();
    } catch (error) {
      console.error('[add submit error]', error);
      toast.error(`저장 중 오류: ${error.message || error}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (!storeKey) {
    return null;
  }

  return (
    <div className="min-h-full flex flex-col">
      <header className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/main')}
          className="p-2 -ml-2 rounded-lg hover:bg-gray-100"
          aria-label="뒤로"
        >
          ←
        </button>
        <h1 className="font-semibold text-gray-900">제품 추가</h1>
      </header>

      <form
        onSubmit={handleSubmit}
        className="flex-1 px-4 py-4 pb-28 space-y-4"
      >
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs font-semibold text-gray-500">바코드</div>
            <div className="inline-flex rounded-lg bg-gray-100 p-0.5 text-xs">
              <button
                type="button"
                onClick={() => {
                  setMode('scan');
                  setBarcode(null);
                  setBarcodeImage(null);
                }}
                className={`px-3 py-1 rounded-md font-medium ${
                  mode === 'scan'
                    ? 'bg-white shadow text-brand-700'
                    : 'text-gray-500'
                }`}
              >
                📷 스캔
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('manual');
                  stopCamera();
                }}
                className={`px-3 py-1 rounded-md font-medium ${
                  mode === 'manual'
                    ? 'bg-white shadow text-brand-700'
                    : 'text-gray-500'
                }`}
              >
                ⌨️ 수동
              </button>
            </div>
          </div>

          {barcode ? (
            <div className="text-center">
              {barcodeImage && (
                <img
                  src={barcodeImage}
                  alt="barcode"
                  className="mx-auto max-h-20"
                />
              )}
              <div className="font-mono text-lg mt-1">{barcode}</div>
              <button
                type="button"
                onClick={() => {
                  setBarcode(null);
                  setBarcodeImage(null);
                }}
                className="text-xs text-brand-600 mt-1"
              >
                다시 입력
              </button>
            </div>
          ) : mode === 'scan' ? (
            <div className="space-y-3">
              <div className="relative rounded-lg overflow-hidden bg-black aspect-video">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  muted
                  playsInline
                  autoPlay
                />
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div className="relative w-3/4 aspect-[2/1] max-w-xs">
                    <div className="absolute inset-0 border-2 border-white/80 rounded-lg" />
                    <div className="absolute inset-x-0 top-1/2 h-0.5 bg-red-500/80 animate-pulse" />
                  </div>
                </div>
              </div>

              {scanError && (
                <div className="text-xs text-red-600">{scanError}</div>
              )}

              <div className="text-xs text-gray-400 text-center">
                바코드를 프레임 안에 맞춰주세요 (EAN-13 / EAN-8)
              </div>

              <div className="flex items-center gap-3 text-xs text-gray-400">
                <div className="flex-1 h-px bg-gray-200" />
                <span>또는 이미지에서 인식</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              <label
                className={`block w-full rounded-lg border-2 border-dashed p-3 text-center cursor-pointer transition ${
                  imageDecoding
                    ? 'border-brand-500 bg-brand-50'
                    : 'border-gray-300 hover:border-brand-500'
                }`}
              >
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImage}
                  disabled={imageDecoding}
                />
                {imageDecoding ? (
                  <div className="text-sm text-gray-600">🔍 디코딩 중...</div>
                ) : (
                  <>
                    <div className="text-xl mb-1">🖼️</div>
                    <div className="text-sm text-gray-600">
                      바코드 이미지 선택 (image.jpg 등)
                    </div>
                  </>
                )}
              </label>

              {imageError && (
                <div className="text-xs text-red-600">{imageError}</div>
              )}
            </div>
          ) : (
            <div>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={13}
                className="input font-mono text-center text-lg tracking-wider"
                placeholder="13자리 또는 8자리 숫자"
                onChange={(event) => handleManualChange(event.target.value)}
              />
              {manualError && (
                <div className="text-xs text-red-600 mt-2">{manualError}</div>
              )}
              <div className="text-xs text-gray-400 mt-2 text-center">
                EAN-13 (13자리) 또는 EAN-8 (8자리)
              </div>
            </div>
          )}
        </div>

        <div className="card space-y-4">
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
            {categories.length === 0 ? (
              <div className="text-sm text-gray-400">
                등록된 카테고리가 없습니다.
              </div>
            ) : (
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
            )}
          </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 flex gap-2">
          <button
            type="button"
            onClick={() => navigate('/main')}
            className="btn-secondary flex-1"
          >
            취소
          </button>
          <button
            type="submit"
            className="btn-primary flex-1"
            disabled={submitting}
          >
            {submitting ? '저장 중...' : '제품 추가'}
          </button>
        </div>
      </form>
    </div>
  );
}
