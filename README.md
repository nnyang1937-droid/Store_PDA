# 바코드 매장 관리 - 복구본

배포된 사이트(`store-sable-nine.vercel.app`)의 프로덕션 번들에서 복원한 프론트엔드입니다.
원본 Git 저장소가 확인되지 않아, 원본 파일 구조 그대로는 아니며 동작과 화면을 기준으로
재구성했습니다.

## 무료 DB 추천

이 앱은 **Supabase Free**를 권장합니다.

- 이미 앱이 Supabase JS와 `store_key`, `<store_key>_list`, `<store_key>_category`
  테이블 구조로 만들어져 있어 코드 수정 없이 바로 연결됩니다.
- 무료 한도: **500MB 데이터베이스 + 1GB 파일 저장소**, 활성 프로젝트 2개.
- 상품 이미지는 DB에 넣지 않고 URL만 저장하므로 500MB로도 상품 100만 개 이상을
  저장할 수 있습니다. 바코드 매장 용도에는 충분합니다.
- 브라우저에서 바로 쓸 수 있는 anon/publishable key와 RLS, 자동 REST API를 제공합니다.

용량만 최대로 원하면 Turso Free(5GB, 100 DB, 일시정지 없음)가 더 크지만, 이 앱은
데이터 계층을 전부 다시 작성해야 하고 브라우저에 DB 토큰을 노출해야 해서 추천하지
않습니다. Cloudflare D1(5GB)도 Worker/백엔드가 필요합니다. Neon Free는 0.5GB,
Firebase Firestore는 1GB이며 NoSQL이라 전면 재작성해야 합니다.

| 서비스 | 무료 DB 용량 | 이 앱 적합도 |
| --- | --- | --- |
| **Supabase Free** | 500MB DB + 1GB storage | ★★★★★ 코드 수정 없음, RLS/REST/JS 클라이언트 |
| Turso Free | 5GB, 100 DB, 일시정지 없음 | ★★☆ 용량은 크지만 데이터 계층 재작성 필요 |
| Cloudflare D1 | 5GB | ★★☆ Worker/백엔드 필요 |
| Neon Free | 0.5GB | ★★☆ Postgres, 백엔드 필요 |
| Firebase Firestore | 1GB | ★☆☆ NoSQL, 전면 재작성 |

참고: CockroachDB와 Xata는 2026년 기준 신규 사용자용 상시 무료 티어가 종료되어
제외했습니다.

## 5분 설정

1. https://supabase.com/dashboard 에서 새 프로젝트를 만듭니다. (Free 플랜)
2. SQL Editor에서 `supabase/quickstart.sql` 전체를 붙여넣고 Run 합니다.
   - `seven01` 매장, 카테고리 3개, 샘플 제품 3개가 자동으로 생성됩니다.
3. Project Settings → API에서 **Project URL**과 **anon/publishable key**를 복사합니다.
4. 프로젝트 루트에서:

```powershell
Copy-Item .env.example .env
notepad .env
```

`.env`에 두 값을 넣습니다.

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_...
```

5. 실행:

```powershell
npm install
npm run dev
```

매장 키 **`seven01`**로 로그인하면 샘플 제품이 보이고, `+` 버튼으로 실제 데이터를
바로 등록할 수 있습니다. 매장 이름은 SQL Editor에서 아래처럼 바꾸면 됩니다.

```sql
update public.store_key set store_name = '실제 매장 이름' where store_key = 'seven01';
```

다른 매장 키를 추가하려면:

```sql
insert into public.store_key (store_key, store_name, is_active)
values ('my_store', '새 매장', true)
on conflict (store_key) do nothing;

select public.create_store_tables('my_store');
```

빌드:

```bash
npm run build
npm run preview
```

Vercel에 배포할 때 `/main` 직접 접근이 404가 되지 않도록 `vercel.json`에 SPA rewrite를
넣어 두었습니다. Vercel Project Settings → Environment Variables에도
`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`를 같은 값으로 넣고 재배포하세요.
Vite 환경 변수는 빌드 시점에 번들에 들어갑니다.

## GitHub Pages 배포

이 앱은 정적 SPA라서 GitHub Pages에서 구동 가능합니다. GitHub Pages는 SPA rewrite를
지원하지 않으므로 GitHub Pages 빌드에서는 `HashRouter`를 사용합니다. 주소는
`https://<username>.github.io/<repo>/#/main` 형태가 됩니다.

준비된 파일:

- `.github/workflows/deploy.yml` — GitHub Actions 빌드/배포
- `vite.config.js` — `VITE_BASE_PATH` 지원
- `src/App.jsx` — `VITE_ROUTER=hash`일 때 HashRouter 사용
- `public/.nojekyll`

배포 순서:

1. GitHub에서 새 **public** 저장소를 만듭니다. 무료 플랜은 public 저장소만 Pages를
   사용할 수 있습니다. (private 저장소는 GitHub Pro 이상 필요)
2. 프로젝트 루트에서:

```powershell
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/<username>/<repo>.git
git push -u origin main
```

3. 저장소 **Settings → Pages → Build and deployment → Source**를
   **GitHub Actions**로 설정합니다.
4. **Actions** 탭에서 `Deploy to GitHub Pages`가 실행됩니다. 또는 Run workflow를
   클릭합니다.
5. 배포 URL: `https://<username>.github.io/<repo>/`

워크플로가 저장소 이름을 읽어 base path를 자동 설정합니다.
`<username>.github.io` 저장소면 `/`로 설정됩니다. Supabase 값은 워크플로의 env에
들어 있으며 publishable key는 공개 키라서 문제없습니다. **secret 키는 워크플로에
넣지 마세요.**

Vercel을 쓰면 `vercel.json`과 BrowserRouter(clean URL)를 그대로 사용할 수 있습니다.
GitHub Pages에서는 hash URL이 되고, Vercel에서는 `/main` 같은 일반 URL이 됩니다.

## 7일 미사용 pause 방지

Supabase Free는 7일 동안 DB 활동이 적으면 프로젝트를 pause합니다. pause되어도 1년
안에는 대시보드에서 Resume 할 수 있고 데이터는 유지됩니다. 자동 pause를 막으려면
3~7일마다 아래 요청을 보내면 됩니다.

- URL: `https://<project-ref>.supabase.co/rest/v1/store_key?select=store_key&limit=1`
- Header: `apikey: <publishable/anon key>`

UptimeRobot 같은 무료 모니터에 위 URL과 헤더를 등록하고 3일 간격으로 체크하면
편합니다. 또는 SQL Editor에서 `pg_cron`을 사용할 수 있습니다(환경에 따라 확장 활성화
필요).

```sql
create extension if not exists pg_cron;
select cron.schedule('keepalive', '0 3 * * *', $$select 1$$);
```

## 원본 위치

- 배포: https://store-sable-nine.vercel.app
- Vercel 프로젝트: `sable-nine` 스코프의 `store` (추정)
  - https://vercel.com/sable-nine/store
  - Settings → Git 에서 원본 저장소 확인
- 기존 데이터베이스: Supabase 프로젝트 `angjwtxevqswrjnsyazq` (현재 도메인 NXDOMAIN)
  - https://supabase.com/dashboard/project/angjwtxevqswrjnsyazq
  - 프로젝트가 보이면 Resume 하면 기존 데이터가 살아납니다. 보이지 않으면 새 프로젝트를
    만들고 위 5분 설정을 진행하세요.

## 데이터베이스 구조

- `store_key` — 매장 키, 매장 이름, 활성 여부
- `<store_key>_list` — 제품 목록
- `<store_key>_category` — 카테고리

예: 매장 키가 `seven01`이면 `seven01_list`, `seven01_category`.

## 구성

- React 19 + Vite
- React Router
- Zustand (매장 선택 상태, 토스트)
- Supabase JS
- `@zxing/browser` — 카메라/이미지 바코드 인식 (EAN-13, EAN-8)
- `jsbarcode` — 바코드 이미지 생성
- Tailwind CSS 빌드 결과물(`src/index.css`)을 배포본에서 그대로 복원

## 보안 주의

- **원본 배포 번들에 GitHub 개인 액세스 토큰(PAT)이 평문으로 포함되어 있었습니다.**
  해당 토큰은 즉시 폐기(revoke)해야 합니다. 이 복구본에는 포함하지 않았습니다.
- 현재 앱은 Supabase Auth 없이 매장 키만으로 데이터에 접근합니다. `quickstart.sql`의
  RLS 정책은 `anon`에 전체 읽기/쓰기를 허용하므로, 공개 서비스로 운영하려면 Supabase
  Auth와 사용자별 RLS로 교체해야 합니다.
- `.env`의 Supabase publishable key는 클라이언트 공개용 키입니다. service_role 키는
  절대 프론트엔드에 넣지 마세요.

## 복구 한계

- 원본 Git 저장소가 없고 소스맵도 없어서, 원본 TypeScript/TSX 파일과 정확히 같은 코드는
  아닙니다. 화면, 라우트, Supabase 테이블 구조, 바코드 스캔/소비기한 로직은 배포 번들에서
  복원했습니다.
- 기존 Supabase 데이터는 이 PC에 없습니다. 기존 프로젝트가 pause 상태라면 Resume 후
  그대로 사용할 수 있고, 삭제되었다면 백업이 없는 한 데이터 복구는 어렵습니다.
