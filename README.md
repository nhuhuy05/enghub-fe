# EngHub React

EngHub React la frontend cho nen tang hoc tieng Anh va luyen TOEIC EngHub. Ung dung co hai nhom vai tro chinh: student va admin.

## Noi Dung Chinh

- Student: trang chu, ho so ca nhan, tu vung, nghe chep chinh ta, doc song ngu, danh sach de thi, lam bai, lich su lam bai va ket qua.
- Admin: quan ly nguoi dung va gan role ADMIN/STUDENT, de thi, tao de theo luong nhieu buoc, upload media, review question group, publish/unpublish de, quan ly noi dung nghe, doc va tu vung.
- Xac thuc: JWT luu trong `localStorage`, Zustand quan ly session, axios interceptor tu gan Bearer token va xu ly loi `401`.

## Tech Stack

- React 19
- TypeScript
- Vite
- React Router
- Tailwind CSS
- Axios
- Zustand
- Lucide React
- Framer Motion
- WaveSurfer.js
- ESLint

## Yeu Cau Moi Truong

- Node.js 20+ khuyen nghi
- npm
- Backend EngHub dang chay, mac dinh tai `http://localhost:8080/enghub`

Frontend doc base URL tu bien moi truong `VITE_API_BASE_URL`. Neu khong cau hinh, app dung fallback trong [src/api/apiClient.ts](src/api/apiClient.ts).

```env
VITE_API_BASE_URL=http://localhost:8080/enghub
```

## Cai Dat Va Chay

```bash
npm install
npm run dev
```

Vite mac dinh mo ung dung tai `http://localhost:5173`.

## Scripts

```bash
npm run dev
npm run build
npm run lint
npm run preview
```

- `dev`: chay Vite dev server.
- `build`: chay `tsc -b` truoc, sau do build production bang Vite.
- `lint`: kiem tra ESLint toan project.
- `preview`: preview ban build production.

## Cau Truc Du An

```text
src/
  api/
  assets/
  components/
    brand/
    layout/
    ui/
  features-admin/
    listening/
    reading/
    tests/
    users/
  features-user/
    auth/
    home/
    listening/
    profile/
    reading/
    test-attempt/
    vocabulary/
  routes/
  types/
```

Quy uoc trong moi feature:

- `components`: UI va page components.
- `hooks`: stateful logic, session logic hoac controller logic.
- `services`: API client methods va mapping du lieu.
- `types`: TypeScript types cua feature.
- `utils`, `constants`, `data`: helper, nhan hien thi hoac du lieu cuc bo khi feature can.

Alias `@/*` tro toi `src/*`, cau hinh trong [vite.config.ts](vite.config.ts) va [tsconfig.app.json](tsconfig.app.json).

## Routing Va Phan Quyen

Routing chinh nam trong [src/routes/AppRoutes.tsx](src/routes/AppRoutes.tsx).

### Public

- `/`: hien thi trang chu neu chua dang nhap, hoac redirect theo role neu da dang nhap.
- `/login`: dang nhap.
- `/register`: dang ky.
- `/tests`: danh sach de thi public trong layout student.

### Protected Chung

- `/profile`: ho so ca nhan.

### Student

- `/dashboard`
- `/vocabulary`
- `/vocabulary/review`
- `/vocabulary/topics/:topicId`
- `/attempts`
- `/attempts/:attemptId`
- `/attempts/:attemptId/result`
- `/listening`
- `/listening/:testId/:partId`
- `/reading`
- `/reading/:lessonId`

### Admin

- `/admin/users`
- `/admin/tests`
- `/admin/tests/create`
- `/admin/listening`
- `/admin/reading`
- `/admin/vocabulary`
- `/admin/vocabulary/topics/:topicId`

Role mac dinh duoc xu ly trong [src/features-user/auth/utils/roleUtils.ts](src/features-user/auth/utils/roleUtils.ts):

- `ADMIN` -> `/admin/users`
- `STUDENT` -> `/dashboard`

## Luong Xac Thuc

Auth duoc trien khai qua:

- [src/features-user/auth/services/authService.ts](src/features-user/auth/services/authService.ts)
- [src/features-user/auth/hooks/useAuth.ts](src/features-user/auth/hooks/useAuth.ts)
- [src/features-user/auth/store/useAuthStore.ts](src/features-user/auth/store/useAuthStore.ts)
- [src/api/apiClient.ts](src/api/apiClient.ts)

Luong chinh:

1. Dang nhap qua `POST /auth/token`.
2. Luu JWT vao `localStorage`.
3. Goi `GET /users/myInfo` de lay thong tin user.
4. Khi app khoi dong lai, `App.tsx` goi `initializeAuth()`.
5. `initializeAuth()` introspect token bang `POST /auth/introspect`, sau do load lai user.
6. Axios interceptor tu gan `Authorization: Bearer <token>` cho request.
7. Khi backend tra `401`, app xoa session local va chuyen ve `/login`.

Google login/register, quen mat khau va tuy chon Remember me chua duoc trien khai; cac control placeholder nay da duoc bo. Cach luu token hien tai khong thay doi.

## API Va Tai Lieu FE-BE

API response chung dung shape:

```ts
export interface ApiResponse<T> {
  code: number;
  message: string;
  result: T;
}
```

Type dung chung nam o [src/types/apiTypes.ts](src/types/apiTypes.ts).

Checkout nay khong co thu muc `docs/` cho cac guide FE-BE. Tham khao OpenAPI cua backend va cac file `services`/`types` theo feature de xem contract hien tai.

Cac nhom endpoint dang duoc frontend goi:

- Auth/profile: `/auth/token`, `/auth/introspect`, `/auth/logout`, `/users`, `/users/myInfo`, `/users/{userId}`.
- Student tests/attempts: `/test-collections`, `/tests`, `/attempts`, `/attempts/{attemptId}/content`, `/attempts/{attemptId}/answers`, `/attempts/{attemptId}/submit`, `/attempts/{attemptId}/result`.
- Vocabulary: `/vocabulary/*`, `/admin/vocabulary/*`.
- Reading: `/reading-lessons/*`, `/admin/reading-lessons/*`.
- Listening dictation: `/listening/tests/{testId}/parts/{partNumber}/dictation`.
- Admin tests: `/admin/test-collections`, `/admin/tests`, `/admin/question-groups`, `/admin/tests/{testId}/media`, preview va publish endpoints.
- Admin users: `/admin/users`, `/roles`.

## Feature Overview

### Student

- `features-user/home`: dashboard va top navigation.
- `features-user/auth`: dang nhap, dang ky, restore session, logout.
- `features-user/profile`: xem va cap nhat ho so.
- `features-user/vocabulary`: danh sach chu de, chi tiet tu, hoc tu va on tap.
- `features-user/listening`: danh sach bai nghe va man hinh nghe chep chinh ta.
- `features-user/reading`: danh sach bai doc song ngu va man hinh luyen doc.
- `features-user/test-attempt`: catalog de, tao attempt, lam bai, audio range player, bang cau hoi, nop bai, ket qua, lich su va chat AI theo cau hoi trong practice mode.

### Admin

- `features-admin/users`: danh sach user, loc, phan trang, tao/sua/xoa, bat tat trang thai va gan role.
- `features-admin/tests`: danh sach de, tao de, import cau hoi, upload media, review groups, preview, publish/unpublish.
- `features-admin/listening`: quan ly transcript lines cho listening dictation.
- `features-admin/reading`: quan ly reading lessons tu TOEIC Part 7, ho tro AI translation/vocabulary.
- Admin vocabulary management nam trong `features-user/vocabulary` va duoc route qua `/admin/vocabulary`.

Placeholder dashboard/classes/assignments/roles va du lieu mau reading da duoc xoa. Cac redirect URL cu van duoc giu. `GET /roles` van phuc vu trang quan ly nguoi dung.

Modal chon MOCK/PRACTICE nam trong `features-user/test-attempt/components/ModeSelectorModal.tsx`, duoc TestCatalogPage su dung. Listening van ho tro nghe, nhap dap an, goi y va ban dich; chua luu tien do hoan thanh, nen UI khong hien thanh tien do mac dinh 0. Vocabulary progress va lich su lam bai van hoat dong nhu truoc.

## Ghi Chu Phat Trien

- Khong commit `dist/`, `node_modules/` hoac file build cache.
- Neu build fail vi TypeScript unused checks, xoa import/type/variable khong dung truoc khi build lai.
- Giu service layer chiu trach nhiem mapping snake_case tu backend sang camelCase neu UI dang dung camelCase.
- Voi streaming SSE cua AI chat, dung `fetch()` va `ReadableStream`; khong dung `EventSource` vi endpoint can `POST` va Bearer token.
- Voi audio theo doan, uu tien dung `start_ms` va `end_ms` tu backend de phat dung segment.

## Kiem Tra Truoc Khi Gui Code

```bash
npm run lint
npm run build
```
