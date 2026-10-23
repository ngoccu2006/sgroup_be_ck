# Hướng dẫn kết nối FE ↔ BE qua Fetch API

Tài liệu này mô tả cách Frontend gọi Backend LMS (Express 5 + PostgreSQL + JWT + Socket.io) bằng `fetch`.

---

## 1. Thông tin chung

| Mục | Giá trị |
|---|---|
| Base URL (dev) | `http://localhost:3107` (đổi qua biến `PORT` trong `.env`) |
| Định dạng body | `application/json` (riêng nộp bài dùng `multipart/form-data`) |
| Xác thực | Header `Authorization: Bearer <token>` |
| Token | JWT, hết hạn sau **1 ngày**, payload `{ id, role }` |
| Role | `ADMIN`, `MENTOR`, `MEMBER` |
| Realtime | Socket.io 4.x, cùng host/port với API |

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
| 401 | Chưa đăng nhập, token sai hoặc đã hết hạn → FE nên logout |
| 403 | Không đủ quyền (role) |
| 404 | Không tìm thấy |
| 500 | Lỗi hệ thống |

---

## 2. Việc cần làm phía BE trước khi FE gọi được

Hiện tại Express **chưa bật CORS** (chỉ Socket.io có `cors: { origin: "*" }`). Nếu FE chạy ở origin khác (vd. Vite `http://localhost:5173`), trình duyệt sẽ chặn request.

```bash
npm i cors
```

`src/app.js` — thêm **trước** các `app.use("/...", router)`:
```js
import cors from "cors";

app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(",") || "http://localhost:5173",
  exposedHeaders: ["Content-Disposition"], // cho phép FE đọc tên file Excel
}));
```

`.env`:
```
CORS_ORIGIN=http://localhost:5173
```

> Không cần `credentials: true` vì hệ thống dùng Bearer token, không dùng cookie.

Phương án thay thế khi dev: dùng proxy của Vite (`server.proxy`) để FE gọi cùng origin, khi đó không cần CORS.

---

## 3. Cấu hình phía FE

`.env` của FE (Vite):
```
VITE_API_URL=http://localhost:3107
```

### 3.1. Wrapper fetch dùng chung — `src/api/client.js`

```js
export const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3107";

export function getToken() {
  return localStorage.getItem("token");
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

  if (res.status === 401 && token) logout();

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

### 4.1. Auth — `/auth`

| Method | Path | Quyền | Body | `data` trả về |
|---|---|---|---|---|
| POST | `/auth/login` | 🌐 | `{ email, password }` | `{ token, user: { id, email, full_name, role } }` |

### 4.2. Users — `/users`

| Method | Path | Quyền | Body |
|---|---|---|---|
| GET | `/users` | 🌐 | – |
| GET | `/users/:id` | 🌐 | – |
| POST | `/users` | 🌐 | thông tin user + `password` |
| PUT | `/users/:id` | 🌐 | các trường cần sửa |
| DELETE | `/users/:id` | 🌐 | – |

> ⚠️ Nhóm `/users` hiện chưa gắn middleware xác thực.

### 4.3. Classes — `/classes`

| Method | Path | Quyền | Body |
|---|---|---|---|
| GET | `/classes` | 🌐 | – |
| POST | `/classes` | 🛡️ | thông tin lớp |
| GET | `/classes/:classId/progress` | 🔑 | – (tiến độ học của user hiện tại trong lớp) |

### 4.4. Class members — `/class-members`

| Method | Path | Quyền | Body |
|---|---|---|---|
| POST | `/class-members/add` | 🛡️ | `{ class_id, member_id }` |
| GET | `/class-members/:classId/members` | 🔑 | – |

### 4.5. Lessons — `/lessons`

| Method | Path | Quyền | Body |
|---|---|---|---|
| POST | `/lessons` | 🛡️ | `{ class_id, order, ... }` |
| GET | `/lessons/class/:classId` | 🔑 | – |
| POST | `/lessons/:lessonId/complete` | 🔑 | – (đánh dấu hoàn thành) |

### 4.6. Assignments — `/assignments`

| Method | Path | Quyền | Body |
|---|---|---|---|
| POST | `/assignments` | 👨‍🏫 | `{ class_id, title, ... }` |
| GET | `/assignments/class/:classId` | 🔑 | – |
| GET | `/assignments/:id` | 🔑 | – |
| PUT | `/assignments/:id` | 👨‍🏫 | các trường cần sửa |
| DELETE | `/assignments/:id` | 👨‍🏫 | – |

### 4.7. Submissions — `/submissions`

| Method | Path | Quyền | Body |
|---|---|---|---|
| POST | `/submissions` | 🔑 | `multipart/form-data`: `assignment_id`, `content?`, `repository_url?`, `file?` (hoặc `file_url?`) |
| GET | `/submissions/my-submission/:assignmentId` | 🔑 | – |
| GET | `/submissions/assignment/:assignmentId` | 👨‍🏫 | – |
| PUT | `/submissions/:id/grade` | 👨‍🏫 | `{ score, feedback }` |

Ràng buộc file: tối đa **10MB**, chỉ nhận PDF, ZIP, DOCX, PNG, JPG. File được upload lên Cloudflare R2, `data.file_url` là link file.

### 4.8. Analytics — `/analytics`

| Method | Path | Quyền | Trả về |
|---|---|---|---|
| GET | `/analytics/class/:classId/assignments-summary` | 👨‍🏫 | JSON thống kê nộp bài |
| GET | `/analytics/class/:classId/members-gpa` | 👨‍🏫 | JSON GPA từng member |
| GET | `/analytics/class/:classId/export-excel` | 👨‍🏫 | **File `.xlsx`** (không phải JSON) |

### 4.9. Notifications — `/notifications`

| Method | Path | Quyền | Body |
|---|---|---|---|
| GET | `/notifications` | 🔑 | – (thông báo của user hiện tại) |
| PATCH | `/notifications/:id/read` | 🔑 | – |

---

## 5. Module API mẫu phía FE

`src/api/index.js`:
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
// Điều hướng theo data.user.role: ADMIN / MENTOR / MEMBER
```

Ẩn/hiện chức năng theo role ở FE chỉ để trải nghiệm — BE vẫn kiểm tra quyền và trả 403 nếu không hợp lệ.

### 6.2. Nộp bài kèm file
```html
<input type="file" id="file" accept=".pdf,.zip,.docx,.png,.jpg,.jpeg" />
```
```js
const file = document.getElementById("file").files[0];
if (file && file.size > 10 * 1024 * 1024) throw new Error("File tối đa 10MB");
const { data } = await submissionApi.submit({ assignment_id, content, repository_url, file });
console.log(data.file_url);
```

### 6.3. Thông báo realtime (Socket.io)

```bash
npm i socket.io-client
```
```js
import { io } from "socket.io-client";
import { BASE_URL } from "./api/client";

const user = JSON.parse(localStorage.getItem("user"));
const socket = io(BASE_URL);

socket.on("connect", () => socket.emit("join", user.id)); // join room theo user_id
socket.on("new_notification", (notification) => {
  // thêm vào danh sách, tăng badge chưa đọc
});

// Khi logout
socket.disconnect();
```

Khuyến nghị: lúc vào trang gọi `notificationApi.getMine()` để lấy lịch sử, sau đó nghe `new_notification` để cập nhật realtime. Có thể test nhanh socket bằng trang `http://localhost:3107/test-socket.html`.

---

## 7. Lỗi thường gặp

| Hiện tượng | Nguyên nhân / cách xử lý |
|---|---|
| `blocked by CORS policy` | BE chưa bật `cors` hoặc `CORS_ORIGIN` không khớp origin FE (xem mục 2) |
| 401 sau khi đăng nhập một thời gian | Token hết hạn (1 ngày) → đăng nhập lại |
| Nộp bài lỗi / `req.body` rỗng | Tự set `Content-Type` khi gửi `FormData`, hoặc đặt sai tên field (phải là `file`) |
| 400 "Định dạng file không hỗ trợ" | File không thuộc PDF/ZIP/DOCX/PNG/JPG |
| Lỗi dung lượng file | File > 10MB |
| Tải Excel ra file hỏng | Gọi `res.json()` thay vì `res.blob()` |
| Không đọc được tên file Excel | BE chưa `exposedHeaders: ["Content-Disposition"]` |
| Không nhận thông báo socket | Chưa `emit("join", user.id)` sau khi `connect` |

---

## 8. Lưu ý bảo mật (cần cải thiện sau)

- Nhóm `/users` chưa yêu cầu đăng nhập: ai cũng có thể tạo, sửa, xoá user.
- Event socket `join` nhận `userId` bất kỳ mà không kiểm tra token, nên người khác có thể nghe thông báo của user khác. Hướng sửa: FE gửi `io(BASE_URL, { auth: { token } })`, BE verify JWT trong `io.use(...)` rồi tự `socket.join(decoded.id)`.
- Token lưu trong `localStorage` dễ bị lộ khi có lỗ hổng XSS. Chấp nhận được với dự án học tập; production nên cân nhắc httpOnly cookie.
