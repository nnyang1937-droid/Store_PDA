const API_BASE = 'https://openapi.foodsafetykorea.go.kr/api';
const API_KEY = import.meta.env.VITE_FOODSAFETY_API_KEY || 'sample';
const TIMEOUT_MS = 8000;

export class FoodSafetyLookupError extends Error {
  constructor(message, code) {
    super(message);
    this.name = 'FoodSafetyLookupError';
    this.code = code;
  }
}

export async function lookupFoodSafetyProduct(barcode) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const url = `${API_BASE}/${encodeURIComponent(API_KEY)}/C005/json/1/1/BAR_CD=${encodeURIComponent(barcode)}`;
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      throw new FoodSafetyLookupError(
        `HTTP ${response.status}`,
        'HTTP_ERROR',
      );
    }

    const data = await response.json();
    const service = data?.C005;

    if (!service) {
      throw new FoodSafetyLookupError(
        '응답 형식이 올바르지 않습니다.',
        'INVALID_RESPONSE',
      );
    }

    const result = service.RESULT || {};
    const code = result.CODE;

    if (code && code !== 'INFO-000' && code !== 'INFO-200') {
      throw new FoodSafetyLookupError(
        result.MSG || '식품안전나라 조회 오류',
        code,
      );
    }

    const rows = Array.isArray(service.row)
      ? service.row
      : service.row
        ? [service.row]
        : [];

    if (code === 'INFO-200' || rows.length === 0) {
      return null;
    }

    const row = rows[0];

    return {
      barcode: row.BAR_CD || barcode,
      name: (row.PRDLST_NM || '').trim(),
      manufacturer: (row.BSSH_NM || '').trim(),
      foodType: (row.PRDLST_DCNM || '').trim(),
      shelfLife: (row.POG_DAYCNT || '').trim(),
      reportNo: row.PRDLST_REPORT_NO || '',
    };
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new FoodSafetyLookupError(
        '조회 시간이 초과되었습니다.',
        'TIMEOUT',
      );
    }

    throw error;
  } finally {
    clearTimeout(timer);
  }
}
