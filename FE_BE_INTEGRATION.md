# Hướng dẫn kết nối FE ↔ BE qua Fetch API

Tài liệu này mô tả cách Frontend (`lms-frontend`, React 19 + Vite) gọi Backend LMS (Express 5 + PostgreSQL + JWT + Socket.io) bằng `fetch`.

> Cập nhật lần cuối: 24/10/2026. Xem tiến độ hiện tại ở **mục 9** và code gợi ý cho các bước tiếp theo ở **mục 10**.

---

## 1. Thông tin chung

| Mục | Giá trị |
|---|---|
| Base URL (dev) | `http://localhost:3107` (đổi qua biến `PORT` trong `.env`) |
| Định dạng body | `application/json` (riêng nộp bài dùng `multipart/form-data`) |
| Xác thực | Header `Authorization: Bearer <token>` |
| Token | JWT, hết hạn sau **1 ngày**, payload `{ id, role }` |
| Role | `ADMIN`, `MENTOR`, `MEMBER` |
| Realtime | Socket.io 4.x, cùng host/port với API, xác thực bằng JWT |

### Format response

Thành công:
```json
{ "message": "Tuỳ chọn, có ở các API tạo/sửa/xoá", "data": { } }
```

Lỗi (mọi status 4xx/5xx):
```json
{ "message": "Mô tả lỗi" }
```

| Status | Ý nghĩa |
|---|---|
| 200 / 201 | Thành công |
| 400 | Dữ liệu sai, trùng lặp (Postgres `23505`), file không hợp lệ |
| 401 | Chưa đăng nhập, token sai hoặc đã hết hạn → FE nên logout. Riêng `/auth/login` trả 401 khi sai email/mật khẩu |
| 403 | Không đủ quyền (role) |
| 404 | Không tìm thấy |
| 500 | Lỗi hệ thống |

---

## 2. Cấu hình CORS phía BE ✅ (đã xong)

`src/app.js` đã bật CORS **trước** các router:
```js
import cors from "cors";

app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(",") || "http://localhost:5173",
  exposedHeaders: ["Content-Disposition"], // cho phép FE đọc tên file Excel
}));
```

`.env` của BE:
```
PORT=3107
CORS_ORIGIN=http://localhost:5173
```

Socket.io (`src/configs/socket.config.js`) dùng chung `CORS_ORIGIN`.

> Không cần `credentials: true` cho fetch vì hệ thống dùng Bearer token, không dùng cookie.

Phương án thay thế khi dev: dùng proxy của Vite (`server.proxy`) để FE gọi cùng origin, khi đó không cần CORS.

---

## 3. Cấu hình phía FE

`.env` của FE (Vite) ✅:
```
VITE_API_URL=http://localhost:3107
```

### 3.1. Wrapper fetch dùng chung: `src/api/client.js`

```js
export const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3107";

export function getToken() {
  return localStorage.getItem("token");
}

export function getUser() {
  try {
    return JSON.parse(localStorage.getItem("user"));
  } catch {
    return null;
  }
}

export function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "/login";
}

/**
 * @param {string} path      vd. "/classes"
 * @param {object} options   { method, body, headers, raw }
 *   - body: object (gửi JSON) hoặc FormData (gửi multipart)
 *   - raw: true → trả về Response gốc (dùng cho tải file)
 */
export async function api(path, { method = "GET", body, headers = {}, raw = false } = {}) {
  const token = getToken();
  const isForm = body instanceof FormData;

  const res = await fetch(BASE_URL + path, {
    method,
    headers: {
      // Với FormData KHÔNG được tự set Content-Type (trình duyệt tự thêm boundary)
      ...(body && !isForm ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: isForm ? body : body ? JSON.stringify(body) : undefined,
  });

  // /auth/login trả 401 khi sai mật khẩu → không logout, để form hiện lỗi
  if (res.status === 401 && token && path !== "/auth/login") logout();

  if (raw) {
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `HTTP ${res.status}`);
    }
    return res;
  }

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const error = new Error(json.message || `HTTP ${res.status}`);
    error.status = res.status;
    throw error;
  }
  return json; // { message?, data }
}
```

> ⚠️ File `client.js` hiện tại trong `lms-frontend` **chưa có** `getUser()` và điều kiện `path !== "/auth/login"`. Nếu không thêm: khi trong `localStorage` còn token cũ mà người dùng nhập sai mật khẩu, trang sẽ bị tải lại và mất thông báo lỗi.

Cách dùng:
```js
try {
  const { data } = await api("/classes");
} catch (e) {
  alert(e.message); // message tiếng Việt từ BE
}
```

---

## 4. Danh sách API

Ký hiệu quyền: 🌐 public · 🔑 cần đăng nhập · 🛡️ ADMIN · 👨‍🏫 MENTOR hoặc ADMIN

### 4.1. Auth: `/auth`

| Method | Path | Quyền | Body | `data` trả về |
|---|---|---|---|---|
| POST | `/auth/login` | 🌐 | `{ email, password }` | `{ token, user: { id, email, full_name, role } }` |

### 4.2. Users: `/users`

| Method | Path | Quyền | Body |
|---|---|---|---|
| GET | `/users` | 🛡️ | – |
| GET | `/users/:id` | 🛡️ | – |
| POST | `/users` | 🛡️ | thông tin user + `password` |
| PUT | `/users/:id` | 🛡️ | các trường cần sửa |
| DELETE | `/users/:id` | 🛡️ | – |

### 4.3. Classes: `/classes`

| Method | Path | Quyền | Body / `data` trả về |
|---|---|---|---|
| GET | `/classes` | 🌐 | mảng lớp `{ id, name, description, start_date, end_date, mentor_id, ... }` |
| POST | `/classes` | 🛡️ | `{ name, description, start_date, end_date, mentor_id? }` |
| GET | `/classes/:classId/progress` | 🔑 | `{ totalLessons, completedLessons, progress }` (`progress` là %, của user hiện tại) |

### 4.4. Class members: `/class-members`

| Method | Path | Quyền | Body / `data` trả về |
|---|---|---|---|
| POST | `/class-members/add` | 🛡️ | `{ class_id, member_id }` |
| GET | `/class-members/:classId/members` | 🔑 | mảng `{ class_id, joined_at, member_id, email, full_name, role }` |

### 4.5. Lessons: `/lessons`

| Method | Path | Quyền | Body / `data` trả về |
|---|---|---|---|
| POST | `/lessons` | 🛡️ | `{ class_id, title, content, order }` |
| GET | `/lessons/class/:classId` | 🔑 | mảng `{ id, class_id, title, content, order, created_by, created_at }` |
| POST | `/lessons/:lessonId/complete` | 🔑 | – (đánh dấu hoàn thành) |

### 4.6. Assignments: `/assignments`

| Method | Path | Quyền | Body |
|---|---|---|---|
| POST | `/assignments` | 👨‍🏫 | `{ class_id, title, description, deadline, maximum_score }` |
| GET | `/assignments/class/:classId` | 🔑 | – |
| GET | `/assignments/:id` | 🔑 | – |
| PUT | `/assignments/:id` | 👨‍🏫 | các trường cần sửa |
| DELETE | `/assignments/:id` | 👨‍🏫 | – |

Tạo bài tập xong BE gửi thông báo (`new_notification`) cho tất cả member của lớp.

### 4.7. Submissions: `/submissions`

| Method | Path | Quyền | Body |
|---|---|---|---|
| POST | `/submissions` | 🔑 | `multipart/form-data`: `assignment_id`, `content?`, `repository_url?`, `file?` (hoặc `file_url?`) |
| GET | `/submissions/my-submission/:assignmentId` | 🔑 | – |
| GET | `/submissions/assignment/:assignmentId` | 👨‍🏫 | – (mỗi bài nộp có thêm `member_name`, `member_email`) |
| PUT | `/submissions/:id/grade` | 👨‍🏫 | `{ score, feedback }` |

- Nộp lại cùng một bài sẽ **ghi đè** bài nộp cũ (upsert theo `assignment_id` + `member_id`).
- Chấm điểm: `score` phải nằm trong `0 … maximum_score` của bài tập, nếu không BE trả 400. Chấm xong BE gửi thông báo (`new_notification`) cho member.
- Ràng buộc file: tối đa **10MB**, chỉ nhận PDF, ZIP, DOCX, PNG, JPG. File được upload lên Cloudflare R2, `data.file_url` là link file.

### 4.8. Analytics: `/analytics`

| Method | Path | Quyền | Trả về |
|---|---|---|---|
| GET | `/analytics/class/:classId/assignments-summary` | 👨‍🏫 | JSON thống kê nộp bài |
| GET | `/analytics/class/:classId/members-gpa` | 👨‍🏫 | JSON GPA từng member |
| GET | `/analytics/class/:classId/export-excel` | 👨‍🏫 | **File `.xlsx`** (không phải JSON) |

### 4.9. Notifications: `/notifications`

| Method | Path | Quyền | Body / `data` trả về |
|---|---|---|---|
| GET | `/notifications` | 🔑 | 20 thông báo mới nhất `{ id, user_id, title, message, is_read, created_at }` |
| PATCH | `/notifications/:id/read` | 🔑 | – |

---

## 5. Module API phía FE

Nên tách **mỗi nhóm một file** trong `src/api/`, giống `auth.js` đang có. Ví dụ `src/api/classes.js` chứa `classApi` và `classMemberApi`. Nếu muốn gom chung thì dùng `src/api/index.js` như dưới đây.

```js
import { api } from "./client";

export const authApi = {
  login: (email, password) => api("/auth/login", { method: "POST", body: { email, password } }),
};

export const userApi = {
  getAll: () => api("/users"),
  getById: (id) => api(`/users/${id}`),
  create: (payload) => api("/users", { method: "POST", body: payload }),
  update: (id, payload) => api(`/users/${id}`, { method: "PUT", body: payload }),
  remove: (id) => api(`/users/${id}`, { method: "DELETE" }),
};

export const classApi = {
  getAll: () => api("/classes"),
  create: (payload) => api("/classes", { method: "POST", body: payload }),
  getProgress: (classId) => api(`/classes/${classId}/progress`),
};

export const classMemberApi = {
  add: (class_id, member_id) => api("/class-members/add", { method: "POST", body: { class_id, member_id } }),
  getMembers: (classId) => api(`/class-members/${classId}/members`),
};

export const lessonApi = {
  create: (payload) => api("/lessons", { method: "POST", body: payload }),
  getByClass: (classId) => api(`/lessons/class/${classId}`),
  complete: (lessonId) => api(`/lessons/${lessonId}/complete`, { method: "POST" }),
};

export const assignmentApi = {
  create: (payload) => api("/assignments", { method: "POST", body: payload }),
  getByClass: (classId) => api(`/assignments/class/${classId}`),
  getById: (id) => api(`/assignments/${id}`),
  update: (id, payload) => api(`/assignments/${id}`, { method: "PUT", body: payload }),
  remove: (id) => api(`/assignments/${id}`, { method: "DELETE" }),
};

export const submissionApi = {
  submit: ({ assignment_id, content, repository_url, file }) => {
    const fd = new FormData();
    fd.append("assignment_id", assignment_id);
    if (content) fd.append("content", content);
    if (repository_url) fd.append("repository_url", repository_url);
    if (file) fd.append("file", file); // tên field phải là "file"
    return api("/submissions", { method: "POST", body: fd });
  },
  getMine: (assignmentId) => api(`/submissions/my-submission/${assignmentId}`),
  getByAssignment: (assignmentId) => api(`/submissions/assignment/${assignmentId}`),
  grade: (id, score, feedback) => api(`/submissions/${id}/grade`, { method: "PUT", body: { score, feedback } }),
};

export const analyticsApi = {
  assignmentsSummary: (classId) => api(`/analytics/class/${classId}/assignments-summary`),
  membersGpa: (classId) => api(`/analytics/class/${classId}/members-gpa`),
  exportExcel: async (classId) => {
    const res = await api(`/analytics/class/${classId}/export-excel`, { raw: true });
    const disposition = res.headers.get("Content-Disposition") || "";
    const filename = disposition.match(/filename=([^;]+)/)?.[1] || `Bang_Diem_Lop_${classId}.xlsx`;
    const url = URL.createObjectURL(await res.blob());
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  },
};

export const notificationApi = {
  getMine: () => api("/notifications"),
  markAsRead: (id) => api(`/notifications/${id}/read`, { method: "PATCH" }),
};
```

---

## 6. Các luồng chính

### 6.1. Đăng nhập
```js
const { data } = await authApi.login(email, password);
localStorage.setItem("token", data.token);
localStorage.setItem("user", JSON.stringify(data.user));
navigate("/classes"); // dùng useNavigate của react-router-dom (code đầy đủ ở mục 10.3)
```

Ẩn/hiện chức năng theo role ở FE chỉ để trải nghiệm. BE vẫn kiểm tra quyền và trả 403 nếu không hợp lệ.

### 6.2. Nộp bài kèm file
```jsx
<input type="file" accept=".pdf,.zip,.docx,.png,.jpg,.jpeg" onChange={(e) => setFile(e.target.files[0])} />
```
```js
if (file && file.size > 10 * 1024 * 1024) throw new Error("File tối đa 10MB");
const { data } = await submissionApi.submit({ assignment_id, content, repository_url, file });
console.log(data.file_url);
```

### 6.3. Thông báo realtime (Socket.io)

BE xác thực socket bằng JWT trong `io.use(...)` và **tự join room theo `user.id`**. FE chỉ cần gửi token khi kết nối, **không** cần `emit("join")`.

```js
import { io } from "socket.io-client";
import { BASE_URL, getToken } from "./api/client";

const socket = io(BASE_URL, { auth: { token: getToken() } });

socket.on("connect_error", (err) => console.error(err.message)); // "Authentication error: ..."
socket.on("new_notification", (notification) => {
  // thêm vào danh sách, tăng badge chưa đọc
});

// Khi logout
socket.disconnect();
```

Khuyến nghị: lúc vào trang gọi `notificationApi.getMine()` để lấy lịch sử, sau đó nghe `new_notification` để cập nhật realtime (hook mẫu ở mục 10.4).

---

## 7. Lỗi thường gặp

| Hiện tượng | Nguyên nhân / cách xử lý |
|---|---|
| `blocked by CORS policy` | `CORS_ORIGIN` trong `.env` BE không khớp origin FE (vd. Vite chạy cổng 5174) |
| 401 sau khi đăng nhập một thời gian | Token hết hạn (1 ngày) → đăng nhập lại |
| Sai mật khẩu nhưng trang tự tải lại, không thấy lỗi | `client.js` logout cả khi gọi `/auth/login` (xem lưu ý ở mục 3.1) |
| Đăng nhập xong vẫn ở trang Login | Chưa có router, `App.jsx` luôn render `<Login />` (xem mục 10.2) |
| Nộp bài lỗi / `req.body` rỗng | Tự set `Content-Type` khi gửi `FormData`, hoặc đặt sai tên field (phải là `file`) |
| 400 "Định dạng file không hỗ trợ" | File không thuộc PDF/ZIP/DOCX/PNG/JPG |
| Lỗi dung lượng file | File > 10MB |
| Tải Excel ra file hỏng | Gọi `res.json()` thay vì `res.blob()` |
| Không đọc được tên file Excel | BE chưa `exposedHeaders: ["Content-Disposition"]` |
| Socket `connect_error: Authentication error` | Chưa gửi `auth: { token }` khi `io(...)`, hoặc token hết hạn |

---

## 8. Lưu ý bảo mật

- Socket dùng `process.env.JWT_SECRET || "your_secret_key"`, còn REST API chỉ dùng `process.env.JWT_SECRET`. Đảm bảo `.env` luôn có `JWT_SECRET` và nên bỏ giá trị mặc định ở socket.
- `GET /classes` vẫn public. Nếu không muốn khách xem danh sách lớp thì thêm `authenticate`.
- Token lưu trong `localStorage` dễ bị lộ khi có lỗ hổng XSS. Chấp nhận được với dự án học tập; production nên cân nhắc httpOnly cookie.

---

## 9. Tiến độ tích hợp (24/10/2026)

### ✅ Đã xong
| Hạng mục | File |
|---|---|
| CORS BE + `CORS_ORIGIN` | `BE_cuoi_khoa/src/app.js`, `.env` |
| `.env` FE | `lms-frontend/.env` |
| Wrapper fetch | `lms-frontend/src/api/client.js` (cần vá 401 ở mục 3.1) |
| Auth API | `lms-frontend/src/api/auth.js` |
| Trang đăng nhập | `lms-frontend/src/pages/Login.jsx` |
| Cài `react-router-dom`, `socket.io-client`, `lucide-react` | `lms-frontend/package.json` |

### ⚠️ Đang dở
- `src/components/ProtectedRoute.jsx` mới có import, chưa có component.
- `src/App.jsx` chưa có router, luôn render `<Login />`.

### ❌ Chưa làm
| Nhóm | File api | Trang UI |
|---|---|---|
| Users (ADMIN) | ❌ | ❌ |
| Classes + progress | ❌ | ❌ |
| Class members | ❌ | ❌ |
| Lessons + complete | ❌ | ❌ |
| Assignments | ❌ | ❌ |
| Submissions (nộp, chấm) | ❌ | ❌ |
| Analytics + Excel | ❌ | ❌ |
| Notifications + Socket | ❌ | ❌ |
| Layout chung, logout, ẩn/hiện theo role | – | ❌ |

### Thứ tự đề xuất
1. Router + `ProtectedRoute` + sửa `Login` dùng `useNavigate` (mục 10.1 → 10.3)
2. Tạo các file `src/api/*.js` theo mục 5
3. Layout chung có logout và chuông thông báo realtime (mục 10.4, 10.5)
4. Trang lớp học → chi tiết lớp → bài tập & nộp bài (mục 10.6 → 10.8)
5. Trang chấm điểm và analytics cho MENTOR/ADMIN (mục 10.9)
6. Trang quản trị cho ADMIN: users, tạo lớp, thêm member, tạo lesson

---

## 10. Code gợi ý cho các bước tiếp theo

Cấu trúc thư mục đề xuất:
```
src/
├── api/
│   ├── client.js          ✅ (vá 401)
│   ├── auth.js            ✅
│   ├── classes.js         classApi, classMemberApi
│   ├── lessons.js
│   ├── assignments.js
│   ├── submissions.js
│   ├── analytics.js
│   └── notifications.js
├── hooks/
│   └── useNotifications.js
├── components/
│   ├── ProtectedRoute.jsx
│   └── MainLayout.jsx
└── pages/
    ├── Login.jsx          ✅ (đổi sang useNavigate)
    ├── ClassList.jsx
    ├── ClassDetail.jsx
    ├── AssignmentDetail.jsx
    ├── GradeSubmissions.jsx
    └── Forbidden.jsx
```

### 10.1. `src/components/ProtectedRoute.jsx`

Chặn route khi chưa đăng nhập; tuỳ chọn giới hạn theo role.

```jsx
import { Navigate, Outlet } from "react-router-dom";
import { getToken, getUser } from "../api/client";

/**
 * <Route element={<ProtectedRoute />}>                       → chỉ cần đăng nhập
 * <Route element={<ProtectedRoute roles={["ADMIN"]} />}>     → chỉ ADMIN
 */
export default function ProtectedRoute({ roles }) {
  const token = getToken();
  const user = getUser();

  if (!token || !user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/403" replace />;

  return <Outlet />;
}
```

### 10.2. `src/App.jsx`: khai báo router

```jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import MainLayout from "./components/MainLayout";
import Login from "./pages/Login";
import ClassList from "./pages/ClassList";
import ClassDetail from "./pages/ClassDetail";
import AssignmentDetail from "./pages/AssignmentDetail";
import GradeSubmissions from "./pages/GradeSubmissions";
import Forbidden from "./pages/Forbidden";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/403" element={<Forbidden />} />

        {/* Cần đăng nhập */}
        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            <Route path="/" element={<Navigate to="/classes" replace />} />
            <Route path="/classes" element={<ClassList />} />
            <Route path="/classes/:classId" element={<ClassDetail />} />
            <Route path="/assignments/:id" element={<AssignmentDetail />} />

            {/* Chỉ MENTOR / ADMIN */}
            <Route element={<ProtectedRoute roles={["MENTOR", "ADMIN"]} />}>
              <Route path="/assignments/:id/grade" element={<GradeSubmissions />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
```

`src/pages/Forbidden.jsx`:
```jsx
import { Link } from "react-router-dom";

export default function Forbidden() {
  return (
    <div style={{ padding: 32 }}>
      <h2>403 – Bạn không có quyền truy cập trang này</h2>
      <Link to="/">Về trang chủ</Link>
    </div>
  );
}
```

### 10.3. Sửa `src/pages/Login.jsx`

Thay `alert` + `window.location.href` bằng `useNavigate`, và tự chuyển trang nếu đã đăng nhập:

```jsx
import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { authApi } from "../api/auth";
import { getToken } from "../api/client";

export default function Login() {
  const navigate = useNavigate();
  // ...các useState giữ nguyên

  if (getToken()) return <Navigate to="/" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await authApi.login(email, password);
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      navigate("/classes", { replace: true });
    } catch (err) {
      setError(err.message || "Đăng nhập thất bại.");
    } finally {
      setLoading(false);
    }
  };

  // ...JSX giữ nguyên
}
```

### 10.4. `src/hooks/useNotifications.js`: lịch sử + realtime

```js
import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { BASE_URL, getToken } from "../api/client";
import { notificationApi } from "../api/notifications";

export default function useNotifications() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    // 1. Lấy lịch sử
    notificationApi.getMine()
      .then(({ data }) => setItems(data))
      .catch(console.error);

    // 2. Nghe realtime (BE tự join room theo user id từ token)
    const socket = io(BASE_URL, { auth: { token: getToken() } });
    socket.on("new_notification", (n) => setItems((prev) => [n, ...prev]));
    socket.on("connect_error", (err) => console.error("Socket:", err.message));

    return () => socket.disconnect();
  }, []);

  const markAsRead = async (id) => {
    await notificationApi.markAsRead(id);
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
  };

  const unread = items.filter((n) => !n.is_read).length;

  return { items, unread, markAsRead };
}
```

`src/api/notifications.js`:
```js
import { api } from "./client";

export const notificationApi = {
  getMine: () => api("/notifications"),
  markAsRead: (id) => api(`/notifications/${id}/read`, { method: "PATCH" }),
};
```

### 10.5. `src/components/MainLayout.jsx`: header, logout, chuông thông báo

```jsx
import { useState } from "react";
import { Link, Outlet } from "react-router-dom";
import { Bell, LogOut } from "lucide-react";
import { getUser, logout } from "../api/client";
import useNotifications from "../hooks/useNotifications";

export default function MainLayout() {
  const user = getUser();
  const { items, unread, markAsRead } = useNotifications();
  const [open, setOpen] = useState(false);

  return (
    <div>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 24px", borderBottom: "1px solid #27272a" }}>
        <Link to="/classes"><b>LMS</b></Link>

        <div style={{ display: "flex", gap: 16, alignItems: "center", position: "relative" }}>
          <button onClick={() => setOpen(!open)} aria-label="Thông báo">
            <Bell size={18} /> {unread > 0 && <span>{unread}</span>}
          </button>

          {open && (
            <ul style={{ position: "absolute", top: 36, right: 0, width: 320, maxHeight: 400, overflowY: "auto", background: "#18181b", border: "1px solid #27272a", listStyle: "none", padding: 0, margin: 0 }}>
              {items.length === 0 && <li style={{ padding: 12 }}>Không có thông báo</li>}
              {items.map((n) => (
                <li key={n.id} onClick={() => !n.is_read && markAsRead(n.id)}
                    style={{ padding: 12, cursor: "pointer", opacity: n.is_read ? 0.6 : 1 }}>
                  <b>{n.title}</b>
                  <div>{n.message}</div>
                </li>
              ))}
            </ul>
          )}

          <span>{user?.full_name} ({user?.role})</span>
          <button onClick={logout}><LogOut size={18} /> Đăng xuất</button>
        </div>
      </header>

      <main style={{ padding: 24 }}>
        <Outlet />
      </main>
    </div>
  );
}
```

### 10.6. `src/pages/ClassList.jsx`: danh sách lớp + tiến độ

`src/api/classes.js`:
```js
import { api } from "./client";

export const classApi = {
  getAll: () => api("/classes"),
  create: (payload) => api("/classes", { method: "POST", body: payload }),
  getProgress: (classId) => api(`/classes/${classId}/progress`),
};

export const classMemberApi = {
  add: (class_id, member_id) => api("/class-members/add", { method: "POST", body: { class_id, member_id } }),
  getMembers: (classId) => api(`/class-members/${classId}/members`),
};
```

```jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { classApi } from "../api/classes";

export default function ClassList() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    classApi.getAll()
      .then(({ data }) => setClasses(data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Đang tải...</p>;
  if (error) return <p style={{ color: "#f87171" }}>{error}</p>;

  return (
    <div>
      <h2>Lớp học</h2>
      {classes.length === 0 && <p>Chưa có lớp nào.</p>}
      <ul>
        {classes.map((c) => (
          <li key={c.id}>
            <Link to={`/classes/${c.id}`}>{c.name}</Link>
            <p>{c.description}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### 10.7. `src/pages/ClassDetail.jsx`: bài học, bài tập, tiến độ

`src/api/lessons.js` và `src/api/assignments.js` copy từ mục 5.

```jsx
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { classApi } from "../api/classes";
import { lessonApi } from "../api/lessons";
import { assignmentApi } from "../api/assignments";

export default function ClassDetail() {
  const { classId } = useParams();
  const [lessons, setLessons] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState("");

  const loadProgress = () =>
    classApi.getProgress(classId).then(({ data }) => setProgress(data));

  useEffect(() => {
    Promise.all([
      lessonApi.getByClass(classId).then(({ data }) => setLessons(data)),
      assignmentApi.getByClass(classId).then(({ data }) => setAssignments(data)),
      loadProgress(),
    ]).catch((e) => setError(e.message));
  }, [classId]);

  const handleComplete = async (lessonId) => {
    try {
      await lessonApi.complete(lessonId);
      await loadProgress();
    } catch (e) {
      alert(e.message);
    }
  };

  if (error) return <p style={{ color: "#f87171" }}>{error}</p>;

  return (
    <div>
      {progress && (
        <p>Tiến độ: {progress.completedLessons}/{progress.totalLessons} bài ({progress.progress}%)</p>
      )}

      <h3>Bài học</h3>
      <ol>
        {lessons.map((l) => (
          <li key={l.id}>
            <b>{l.title}</b>
            <p>{l.content}</p>
            <button onClick={() => handleComplete(l.id)}>Đánh dấu hoàn thành</button>
          </li>
        ))}
      </ol>

      <h3>Bài tập</h3>
      <ul>
        {assignments.map((a) => (
          <li key={a.id}>
            <Link to={`/assignments/${a.id}`}>{a.title}</Link>
            {a.deadline && <span> · Hạn: {new Date(a.deadline).toLocaleString("vi-VN")}</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

> BE hiện chưa có API trả về danh sách bài học **đã hoàn thành** của user, nên nút "Đánh dấu hoàn thành" không biết bài nào đã xong. Nếu cần thì thêm API ở BE, vd. `GET /lessons/class/:classId` trả kèm `is_completed`.

### 10.8. `src/pages/AssignmentDetail.jsx`: xem đề + nộp bài

`src/api/submissions.js` copy `submissionApi` từ mục 5.

```jsx
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getUser } from "../api/client";
import { assignmentApi } from "../api/assignments";
import { submissionApi } from "../api/submissions";

const MAX_SIZE = 10 * 1024 * 1024;

export default function AssignmentDetail() {
  const { id } = useParams();
  const user = getUser();
  const canGrade = ["MENTOR", "ADMIN"].includes(user?.role);

  const [assignment, setAssignment] = useState(null);
  const [mySubmission, setMySubmission] = useState(null);
  const [content, setContent] = useState("");
  const [repositoryUrl, setRepositoryUrl] = useState("");
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    assignmentApi.getById(id).then(({ data }) => setAssignment(data)).catch((e) => alert(e.message));
    // Chưa nộp thì BE có thể trả 404 → bỏ qua
    submissionApi.getMine(id).then(({ data }) => setMySubmission(data)).catch(() => {});
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (file && file.size > MAX_SIZE) return alert("File tối đa 10MB");
    setSubmitting(true);
    try {
      const { data } = await submissionApi.submit({
        assignment_id: id,
        content,
        repository_url: repositoryUrl,
        file,
      });
      setMySubmission(data);
      alert("Nộp bài thành công!");
    } catch (e) {
      alert(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!assignment) return <p>Đang tải...</p>;

  return (
    <div>
      <h2>{assignment.title}</h2>
      <p>{assignment.description}</p>
      <p>Điểm tối đa: {assignment.maximum_score}</p>

      {canGrade && <Link to={`/assignments/${id}/grade`}>Xem & chấm bài nộp →</Link>}

      {mySubmission && (
        <div>
          <h4>Bài đã nộp ({new Date(mySubmission.submitted_at).toLocaleString("vi-VN")})</h4>
          {mySubmission.file_url && <a href={mySubmission.file_url} target="_blank" rel="noreferrer">Xem file</a>}
          {mySubmission.score != null && <p>Điểm: {mySubmission.score}. Nhận xét: {mySubmission.feedback}</p>}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <h4>{mySubmission ? "Nộp lại (ghi đè bài cũ)" : "Nộp bài"}</h4>
        <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Nội dung / ghi chú" />
        <input value={repositoryUrl} onChange={(e) => setRepositoryUrl(e.target.value)} placeholder="Link GitHub (tuỳ chọn)" />
        <input type="file" accept=".pdf,.zip,.docx,.png,.jpg,.jpeg" onChange={(e) => setFile(e.target.files[0] || null)} />
        <button disabled={submitting}>{submitting ? "Đang nộp..." : "Nộp bài"}</button>
      </form>
    </div>
  );
}
```

### 10.9. `src/pages/GradeSubmissions.jsx`: MENTOR/ADMIN chấm bài

```jsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { submissionApi } from "../api/submissions";

export default function GradeSubmissions() {
  const { id } = useParams(); // assignmentId
  const [submissions, setSubmissions] = useState([]);

  useEffect(() => {
    submissionApi.getByAssignment(id)
      .then(({ data }) => setSubmissions(data))
      .catch((e) => alert(e.message));
  }, [id]);

  const handleGrade = async (submissionId, form) => {
    const score = Number(form.score.value);
    const feedback = form.feedback.value;
    try {
      const { data } = await submissionApi.grade(submissionId, score, feedback);
      setSubmissions((prev) => prev.map((s) => (s.id === submissionId ? { ...s, ...data } : s)));
      alert("Đã chấm điểm"); // BE sẽ bắn new_notification tới member
    } catch (e) {
      alert(e.message);
    }
  };

  return (
    <div>
      <h2>Bài nộp</h2>
      {submissions.length === 0 && <p>Chưa có ai nộp.</p>}
      <table>
        <thead>
          <tr><th>Member</th><th>Bài nộp</th><th>Điểm / Nhận xét</th></tr>
        </thead>
        <tbody>
          {submissions.map((s) => (
            <tr key={s.id}>
              <td>{s.member_name}<br /><small>{s.member_email}</small></td>
              <td>
                {s.content}
                {s.repository_url && <div><a href={s.repository_url} target="_blank" rel="noreferrer">Repo</a></div>}
                {s.file_url && <div><a href={s.file_url} target="_blank" rel="noreferrer">File</a></div>}
              </td>
              <td>
                <form onSubmit={(e) => { e.preventDefault(); handleGrade(s.id, e.target); }}>
                  <input name="score" type="number" step="0.1" defaultValue={s.score ?? ""} required />
                  <input name="feedback" defaultValue={s.feedback ?? ""} placeholder="Nhận xét" />
                  <button>Lưu</button>
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

Nút xuất Excel (đặt ở `ClassDetail` khi role là MENTOR/ADMIN):
```jsx
import { analyticsApi } from "../api/analytics";

<button onClick={() => analyticsApi.exportExcel(classId).catch((e) => alert(e.message))}>
  Xuất bảng điểm Excel
</button>
```

### 10.10. Kiểm tra sau mỗi bước

1. Chạy BE: `cd BE_cuoi_khoa && npm run dev` (cổng 3107).
2. Chạy FE: `cd lms-frontend && npm run dev` (cổng 5173).
3. Đăng nhập bằng tài khoản trong `src/seeds/seed.js`, mở DevTools → Network, kiểm tra request có header `Authorization` và response đúng `{ data }`.
4. Mở 2 trình duyệt (MENTOR và MEMBER): MEMBER nộp bài, MENTOR chấm. Phía MEMBER phải thấy chuông thông báo tăng ngay mà không cần reload.
