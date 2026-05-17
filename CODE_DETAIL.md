# Code Chi Tiết Từng Dòng - Luồng Đăng Ký & Đăng Nhập

## File 1: Frontend - SignInForm Component

**Đường dẫn**: `frontend/src/components/auth/signin-form.tsx`

```typescript
// ========== IMPORTS ==========
import { cn } from "@/lib/utils";                          // Hàm merge CSS classes
import { Button } from "@/components/ui/button";           // Component Button UI
import { Card, CardContent } from "@/components/ui/card";  // Card container
import { Input } from "@/components/ui/input";             // Input field component
import { Label } from "../ui/label";                       // Label component
import { z } from "zod";                                   // Thư viện validation schema
import { useForm } from "react-hook-form";                 // Hook quản lý form
import { zodResolver } from "@hookform/resolvers/zod";    // Nối zod + react-hook-form
import { useAuthStore } from "@/stores/useAuthStore";      // Store chứa auth state (token, user)
import { useNavigate } from "react-router";                // Hook điều hướng trang

// ========== VALIDATION SCHEMA ==========
// Định nghĩa luật kiểm tra dữ liệu form bằng zod
const signInSchema = z.object({
  // Trường username: phải là chuỗi, tối thiểu 3 ký tự, tối đa 100
  username: z
    .string()
    .min(3, "Tên đăng nhập bắt buộc phải có 3 ký tự")
    .max(100),
  // Trường password: phải là chuỗi, tối thiểu 6 ký tự, tối đa 100
  password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự").max(100),
});

// Dùng zod infer để lấy type dữ liệu từ schema
// Tức: SignInFormValues = { username: string; password: string }
type SignInFormValues = z.infer<typeof signInSchema>;

// ========== COMPONENT ==========
export function SignInForm({
  className,  // CSS class tùy chỉnh
  ...props    // Các props khác truyền vào div wrapper
}: React.ComponentProps<"div">) {
  // Lấy hàm signIn từ store (gọi backend để đăng nhập)
  const { signIn } = useAuthStore();

  // Hook để điều hướng sang trang khác
  const navigate = useNavigate();

  // Hook quản lý form
  // register: hàm gắn input vào form state
  // handleSubmit: bao bọc hàm submit để kiểm tra validation trước
  // errors: lỗi validation từng field
  // isSubmitting: bool, true khi đang submit (dùng để disable button)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),  // Dùng zod schema để validate
  });

  // ========== SUBMIT HANDLER ==========
  // Hàm này được gọi khi form submit và dữ liệu hợp lệ
  // data chứa: { username: "...", password: "..." }
  const onSubmit = async (data: SignInFormValues) => {
    const { username, password } = data;  // Tách username, password từ data
    try {
      // Gọi hàm signIn từ store (gọi backend)
      // store sẽ tự gọi fetchMe() để lấy user data nếu thành công
      await signIn(username, password);

      // Nếu đăng nhập thành công, chuyển sang trang chủ
      navigate("/");
    } catch {
      // Nếu có lỗi, toast đã được store xử lý
      // Không cần làm gì ở đây
    }
  };

  // ========== JSX RENDER ==========
  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0 border-border">
        <CardContent className="grid p-0 md:grid-cols-2">
          {/* Form */}
          <form
            className="p-6 md:p-8"
            onSubmit={handleSubmit(onSubmit)}  // handleSubmit tự validate trước khi gọi onSubmit
          >
            <div className="flex flex-col gap-6">
              {/* Header */}
              <div className="flex flex-col items-center text-center gap-2">
                <a href="/" className="max-auto block w-fit text-center">
                  <img src="/logo.svg" alt="logo" />
                </a>
                <h1 className="text-2xl font-bold">Chào mừng quay lại</h1>
                <p className="text-muted-foreground text-balance">
                  Đăng nhập vào tài khoản QQNA của bạn
                </p>
              </div>

              {/* Username Input */}
              <div className="flex flex-col gap-3">
                <Label htmlFor="username">Tên đăng nhập</Label>
                {/*
                  {...register("username")} làm 3 điều:
                  1. Gắn value của input vào form state
                  2. Theo dõi onChange event
                  3. Validate theo schema khi onChange
                */}
                <Input
                  id="username"
                  type="text"
                  placeholder="Nhập tên đăng nhập"
                  {...register("username")}
                />
                {/* Hiển thị lỗi nếu username không hợp lệ */}
                {errors.username && (
                  <p className="text-sm text-destructive">
                    {errors.username.message}
                  </p>
                )}
              </div>

              {/* Password Input */}
              <div className="flex flex-col gap-3">
                <Label htmlFor="password">Mật khẩu</Label>
                <Input
                  id="password"
                  type="password"  // Ẩn ký tự nhập
                  placeholder="Nhập mật khẩu"
                  {...register("password")}
                />
                {/* Hiển thị lỗi nếu password không hợp lệ */}
                {errors.password && (
                  <p className="text-sm text-destructive">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting}  {/* Disable nút khi đang submit */}
              >
                Đăng nhập
              </Button>

              {/* Link sang signup */}
              <div className="text-center text-sm">
                Chưa có tài khoản?{" "}
                <a href="/signup" className="underline underline-offset-4">
                  Đăng ký ngay
                </a>
              </div>
            </div>
          </form>

          {/* Ảnh bên phải (ẩn trên mobile) */}
          <div className="relative hidden bg-muted md:block">
            <img
              src="/placeholderSignUp.png"
              alt="Image"
              className="absolute top-1/2 -translate-y-1/2 object-cover "
            />
          </div>
        </CardContent>
      </Card>

      {/* Footer text */}
      <div className="text-xs text-balance px-6 text-center text-muted-foreground">
        Bằng cách tiếp tục, bạn đồng ý với <a href="#">Điều khoản Dịch vụ</a> và{" "}
        <a href="#">Chính sách Bảo mật</a>.
      </div>
    </div>
  );
}
```

**Tóm tắt SignInForm**:

1. Người dùng nhập username & password.
2. Form validate theo schema (min length, etc).
3. Nếu hợp lệ, bấm Đăng nhập → gọi `onSubmit`.
4. `onSubmit` gọi `useAuthStore.signIn(username, password)`.
5. Nếu thành công, chuyển sang trang chủ `/`.

---

## File 2: Frontend - Store Auth

**Đường dẫn**: `frontend/src/stores/useAuthStore.tsx`

```typescript
import { create } from "zustand"; // Thư viện state management
import { toast } from "sonner"; // Thư viện toast notifications
import { authService } from "@/services/authServiec"; // Service gọi API
import type { AuthState } from "@/types/store"; // Type của store

// create<T>: hàm tạo store với TypeScript type
export const useAuthStore = create<AuthState>((set, get) => ({
  // ========== STATE ==========
  // set: hàm cập nhật state
  // get: hàm đọc state hiện tại

  accessToken: null, // Token JWT ngắn hạn để call API (lưu ở memory)
  user: null, // Thông tin user hiện tại (id, email, displayName, etc)
  loading: false, // Loading state

  // ========== ACTIONS ==========

  // Hàm lưu access token vào store
  setAccessToken: (accessToken) => {
    set({ accessToken });
  },

  // Hàm xóa tất cả trạng thái (logout)
  clearState: () => {
    set({ accessToken: null, user: null, loading: false });
  },

  // ========== SIGNUP ==========
  signUp: async (username, password, email, firstName, lastName) => {
    try {
      set({ loading: true }); // Bật loading
      // Gọi backend POST /auth/signup
      await authService.signUp(username, password, email, firstName, lastName);
      // Nếu thành công, hiện toast
      toast.success("Đăng ký thành công! Vui lòng đăng nhập.");
    } catch (error) {
      console.error("Lỗi khi đăng ký:", error);
      toast.error("Đăng ký không thành công. Vui lòng thử lại.");
      throw error; // Ném lỗi để SignupForm bắt
    } finally {
      set({ loading: false }); // Tắt loading
    }
  },

  // ========== SIGNIN ==========
  signIn: async (username, password) => {
    try {
      set({ loading: true });
      // Gọi backend POST /auth/signin
      // Response sẽ chứa: { accessToken: "...", message: "..." }
      const { accessToken } = await authService.signIn(username, password);

      // Lưu access token vào store
      get().setAccessToken(accessToken);

      // Lấy thông tin user hiện tại từ backend
      // Backend sẽ dùng access token để xác thực
      // Và trả thông tin user từ req.user
      await get().fetchMe();

      toast.success("Chào mừng bạn quay lại với QQNA 🎉!");
    } catch (error) {
      console.error("Lỗi khi đăng nhập:", error);
      toast.error("Đăng nhập không thành công. Vui lòng kiểm tra lại.");
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  // ========== SIGNOUT ==========
  signOut: async () => {
    try {
      // Xóa trạng thái ngay lập tức (không chờ backend)
      get().clearState();
      // Gọi backend để xóa session & cookie
      await authService.signOut();
      toast.success("Đăng xuất thành công!");
    } catch (error) {
      console.error("Lỗi khi đăng xuất:", error);
      toast.error("Đăng xuất không thành công. Vui lòng thử lại.");
      throw error;
    }
  },

  // ========== FETCH USER ==========
  // Lấy thông tin user hiện tại từ backend
  fetchMe: async () => {
    try {
      set({ loading: true });
      // Gọi backend GET /users/me
      // Backend sẽ kiểm tra access token rồi trả user data
      const user = await authService.fetchMe();
      // Lưu user vào store
      set({ user });
    } catch (error) {
      console.error("Lỗi khi lấy thông tin người dùng:", error);
      // Nếu lỗi (token không hợp lệ), xóa trạng thái
      set({ user: null, accessToken: null });
      toast.error("Không thể lấy thông tin người dùng. Vui lòng thử lại.");
    } finally {
      set({ loading: false });
    }
  },

  // ========== REFRESH TOKEN ==========
  // Lấy access token mới bằng refresh token
  refresh: async () => {
    try {
      set({ loading: true });
      const { user, fetchMe } = get(); // Đọc user và fetchMe từ state hiện tại

      // Gọi backend POST /auth/refresh
      // Cookie refresh token sẽ được gửi tự động
      // Backend trả access token mới
      const accessToken = await authService.refresh();

      // Lưu access token mới
      get().setAccessToken(accessToken);

      // Nếu chưa có user thì lấy thông tin user
      if (!user) {
        await fetchMe();
      }

      return accessToken;
    } catch (error) {
      console.error("Lỗi khi refresh token:", error);
      toast.error("Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại!");
      // Nếu refresh thất bại, xóa trạng thái
      get().clearState();
    } finally {
      set({ loading: false });
    }
  },
}));
```

**Tóm tắt useAuthStore**:

1. Giữ `accessToken` (JWT ngắn hạn) trong memory.
2. Giữ `user` (thông tin người dùng).
3. `signIn` gọi backend, lưu token, rồi `fetchMe()` lấy user.
4. `refresh()` xin access token mới bằng refresh token (từ cookie).
5. `fetchMe()` lấy dữ liệu user từ backend.

---

## File 3: Frontend - Auth Service

**Đường dẫn**: `frontend/src/services/authServiec.ts`

```typescript
import api from "@/lib/axios"; // Axios instance có interceptor

export const authService = {
  // ========== SIGNUP ==========
  signUp: async (
    username: string,
    password: string,
    email: string,
    firstName: string,
    lastName: string,
  ) => {
    try {
      // POST /auth/signup với dữ liệu cần tạo user
      const res = await api.post(
        "/auth/signup",
        {
          username,
          password,
          email,
          firstName,
          lastName,
        },
        { withCredentials: true }, // Cho phép gửi & nhận cookie
      );
      return res.data; // Trả response từ backend (204 No Content)
    } catch (error) {
      console.error("Lỗi khi đăng ký:", error);
      throw error; // Ném lỗi để store xử lý
    }
  },

  // ========== SIGNIN ==========
  signIn: async (username: string, password: string) => {
    try {
      // POST /auth/signin để xác thực
      const res = await api.post(
        "/auth/signin",
        {
          username,
          password,
        },
        { withCredentials: true }, // Backend sẽ set cookie refreshToken
      );
      // Response: { accessToken: "jwt...", message: "..." }
      return res.data;
    } catch (error) {
      console.error("Lỗi khi đăng nhập:", error);
      throw error;
    }
  },

  // ========== SIGNOUT ==========
  signOut: async () => {
    try {
      // POST /auth/signout để xóa session & cookie
      await api.post("/auth/signout", {}, { withCredentials: true });
    } catch (error) {
      console.error("Lỗi khi đăng xuất:", error);
      throw error;
    }
  },

  // ========== FETCH USER ==========
  fetchMe: async () => {
    try {
      // GET /users/me để lấy thông tin user
      // axios request interceptor sẽ tự gắn: Authorization: Bearer <accessToken>
      const res = await api.get("/users/me", { withCredentials: true });
      // Response: { user: { _id, username, email, displayName, ... } }
      return res.data.user;
    } catch (error) {
      console.error("Lỗi khi lấy thông tin người dùng:", error);
      throw error;
    }
  },

  // ========== REFRESH TOKEN ==========
  refresh: async () => {
    try {
      // POST /auth/refresh
      // Cookie refreshToken sẽ được gửi tự động bởi browser
      // (vì: withCredentials: true ở axios config)
      const res = await api.post(
        "/auth/refresh",
        {},
        { withCredentials: true },
      );
      // Response: { accessToken: "new_jwt..." }
      return res.data.accessToken;
    } catch (error) {
      console.error("Lỗi khi refresh token:", error);
      throw error;
    }
  },
};
```

**Tóm tắt authService**:

1. Lớp "giao tiếp HTTP" với backend.
2. Tất cả đều dùng `withCredentials: true` để cookie được gửi kèm.
3. Store gọi các hàm này, không tự gọi axios.

---

## File 4: Frontend - Axios Wrapper

**Đường dẫn**: `frontend/src/lib/axios.ts`

```typescript
import { useAuthStore } from "@/stores/useAuthStore";
import axios from "axios";

const api = axios.create({
  baseURL:
    import.meta.env.MODE === "development"
      ? "http://localhost:5001/api" // Dev: localhost:5001
      : "/api", // Production: /api (cùng domain)
  withCredentials: true, // Cho phép browser gửi & nhận cookie
});

// ========== REQUEST INTERCEPTOR ==========
// Hàm chạy TRƯỚC mỗi request
api.interceptors.request.use((config) => {
  // Lấy accessToken từ store
  const { accessToken } = useAuthStore.getState();

  // Nếu có token, gắn vào header Authorization
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config; // Trả config đã sửa
});

// ========== RESPONSE INTERCEPTOR ==========
// Hàm chạy TRONG khi nhận response
api.interceptors.response.use(
  (res) => res, // Nếu response OK, trả ngay
  async (error) => {
    // Xử lý error

    const originalRequest = error.config; // Request gốc (để retry sau)

    // Nếu không có response hoặc URL, reject error
    if (!error.response || !originalRequest?.url) {
      return Promise.reject(error);
    }

    // Những API auth không cần tự động refresh (tránh infinite loop)
    if (
      originalRequest.url.includes("/auth/signin") ||
      originalRequest.url.includes("/auth/signup") ||
      originalRequest.url.includes("/auth/refresh")
    ) {
      return Promise.reject(error);
    }

    // Đếm bao nhiêu lần đã retry
    originalRequest._retryCount = originalRequest._retryCount || 0;

    // Nếu lỗi 403 (Forbidden - token hết hạn) và chưa retry quá 4 lần
    if (error.response.status === 403 && originalRequest._retryCount < 4) {
      originalRequest._retryCount += 1;

      console.log(
        `Access token có thể đã hết hạn. Thử refresh token lần ${originalRequest._retryCount}...`,
      );

      try {
        // Gọi /auth/refresh để lấy access token mới
        // Cookie refreshToken sẽ được gửi tự động
        const res = await api.post(
          "/auth/refresh",
          {},
          { withCredentials: true },
        );

        // Lấy access token mới từ response
        const newAccessToken = res.data.accessToken;

        // Lưu token mới vào store
        useAuthStore.getState().setAccessToken(newAccessToken);

        // Cập nhật header của request cũ với token mới
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        // Retry request cũ (gửi lại cùng URL nhưng với token mới)
        return api(originalRequest);
      } catch (err) {
        // Nếu refresh thất bại, xóa trạng thái & logout
        console.error("Lỗi khi refresh token:", err);
        useAuthStore.getState().clearState();
        return Promise.reject(err);
      }
    }

    // Nếu không phải 403 hoặc đã retry nhiều lần, reject error
    return Promise.reject(error);
  },
);

export default api;
```

**Tóm tắt axios**:

1. Request interceptor: tự gắn `Authorization: Bearer <accessToken>`.
2. Response interceptor:
   - Nếu 403: gọi refresh để lấy token mới.
   - Nếu refresh OK: retry request cũ.
   - Nếu refresh fail: logout.

---

## File 5: Backend - Auth Controller

**Đường dẫn**: `backend/src/controllers/authController.js`

```javascript
import bcrypt from "bcrypt"; // Thư viện hash password
import User from "../models/User.js"; // Model user
import jwt from "jsonwebtoken"; // Thư viện tạo JWT
import crypto from "crypto"; // Tạo random string
import Session from "../models/Session.js"; // Model refresh token

// ========== CONSTANTS ==========
const ACCESS_TOKEN_TTL = "30m"; // Access token sống 30 phút
const REFRESH_TOKEN_TTL = 14 * 24 * 60 * 60 * 1000; // Refresh token sống 14 ngày (ms)

// ========== SIGNUP ==========
export const signUp = async (req, res) => {
  try {
    // Lấy dữ liệu từ request body
    const { username, password, email, firstName, lastName } = req.body;

    // Kiểm tra thiếu dữ liệu bắt buộc
    if (!username || !password || !email || !firstName || !lastName) {
      return res.status(400).json({
        message:
          "Không thể thiếu username, password, email, firstName và lastName",
      });
    }

    // Tìm user theo username để kiểm tra trùng
    const duplicateUser = await User.findOne({ username });

    // Nếu user đã tồn tại, trả lỗi 409 (Conflict)
    if (duplicateUser) {
      return res.status(409).json({ message: "Username đã tồn tại" });
    }

    // Hash password với bcrypt
    // saltRounds = 10: độ an toàn (càng cao càng lâu)
    // Ví dụ: password "123456" sẽ trở thành: $2b$10$...
    const hashedPassword = await bcrypt.hash(password, 10);

    // Tạo user mới trong database
    await User.create({
      username, // username từ request
      hashedPassword, // password đã hash
      email, // email từ request
      displayName: `${lastName} ${firstName}`, // Tên hiển thị
    });

    // Trả 204 No Content (đăng ký thành công, không có response body)
    return res.sendStatus(204);
  } catch (error) {
    console.error("Lỗi khi gọi signUp:", error);
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

// ========== SIGNIN ==========
export const signIn = async (req, res) => {
  try {
    // Lấy username & password từ request
    const { username, password } = req.body;

    // Kiểm tra thiếu dữ liệu
    if (!username || !password) {
      return res.status(400).json({ message: "Thiếu username hoặc password" });
    }

    // Tìm user theo username
    const user = await User.findOne({ username });

    // Nếu không tìm thấy, trả lỗi 401 (Unauthorized)
    if (!user) {
      return res
        .status(401)
        .json({ message: "username hoặc password không chính xác" });
    }

    // So sánh password người dùng nhập với hashedPassword trong DB
    // bcrypt.compare tự xử lý: hash password input rồi so với hash trong DB
    const passwordCorrect = await bcrypt.compare(password, user.hashedPassword);

    // Nếu password sai, trả lỗi
    if (!passwordCorrect) {
      return res
        .status(401)
        .json({ message: "username hoặc password không chính xác" });
    }

    // ========== TẠO ACCESS TOKEN ==========
    // JWT là chuỗi: header.payload.signature
    // payload chứa: { userId: user._id, exp: <expiry time> }
    const accessToken = jwt.sign(
      {
        userId: user._id, // Payload: lưu userId
      },
      process.env.ACCESS_TOKEN_SECRET, // Secret key (từ .env)
      { expiresIn: ACCESS_TOKEN_TTL }, // TTL: 30 phút
    );

    // ========== TẠO REFRESH TOKEN ==========
    // Refresh token là chuỗi ngẫu nhiên (không phải JWT)
    // 64 bytes = 128 ký tự hex
    const refreshToken = crypto.randomBytes(64).toString("hex");

    // ========== LƯU SESSION ==========
    // Lưu refresh token vào database với thời hạn
    await Session.create({
      userId: user._id, // User này sở hữu session
      refreshToken, // Refresh token
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL), // Hết hạn sau 14 ngày
    });

    // ========== SET COOKIE ==========
    // Gửi refresh token trong cookie httpOnly (an toàn hơn localStorage)
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true, // JS không thể đọc cookie này
      secure: true, // Chỉ gửi qua HTTPS
      sameSite: "none", // Cho phép cross-site (vì frontend khác domain)
      maxAge: REFRESH_TOKEN_TTL, // Cookie tồn tại 14 ngày
    });

    // ========== RESPONSE ==========
    // Trả 200 OK với access token
    return res.status(200).json({
      message: `User ${user.displayName} đã đăng nhập thành công`,
      accessToken, // Frontend sẽ dùng token này
    });
  } catch (error) {
    console.error("Lỗi khi gọi signIn:", error);
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

// ========== SIGNOUT ==========
export const signOut = async (req, res) => {
  try {
    // Lấy refresh token từ cookie
    const refreshToken = req.cookies?.refreshToken;

    if (refreshToken) {
      // Xóa session tương ứng từ database
      // Điều này revoke (hủy) refresh token
      await Session.findOneAndDelete({ refreshToken });

      // Clear cookie refreshToken (báo browser xóa cookie)
      res.clearCookie("refreshToken");
    }

    // Trả 204 No Content
    return res.sendStatus(204);
  } catch (error) {
    console.error("Lỗi khi gọi signOut:", error);
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

// ========== REFRESH TOKEN ==========
export const refreshToken = async (req, res) => {
  try {
    // Lấy refresh token từ cookie
    const refreshToken = req.cookies?.refreshToken;

    // Nếu không có cookie, trả lỗi
    if (!refreshToken) {
      return res.status(401).json({ message: "Token không tồn tại" });
    }

    // Tìm session tương ứng trong database
    const session = await Session.findOne({ refreshToken: refreshToken });

    // Nếu không tìm thấy session, trả lỗi
    if (!session) {
      return res
        .status(401)
        .json({ message: "Token không hợp lệ hoặc đã hết hạn" });
    }

    // Kiểm tra refresh token đã hết hạn hay chưa
    if (session.expiresAt < new Date()) {
      return res.status(403).json({ message: "Token đã hết hạn" });
    }

    // ========== TẠO ACCESS TOKEN MỚI ==========
    // Tạo JWT mới với userId từ session
    const accessToken = jwt.sign(
      {
        userId: session.userId, // Lấy userId từ session
      },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: ACCESS_TOKEN_TTL }, // TTL: 30 phút
    );

    // Trả access token mới
    return res.status(200).json({ accessToken });
  } catch (error) {
    console.error("Lỗi khi gọi refreshToken:", error);
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};
```

**Tóm tắt authController**:

1. `signUp`: Hash password, tạo user, trả 204.
2. `signIn`: So password, tạo access + refresh token, set cookie, trả access token.
3. `signOut`: Xóa session và cookie.
4. `refreshToken`: Kiểm tra session còn hạn, tạo access token mới.

---

## Tóm Tắt Luồng End-to-End

### Bước 1: Đăng Ký

1. `SignupForm` → người dùng nhập dữ liệu → validate → `onSubmit`.
2. `onSubmit` → gọi `useAuthStore.signUp()`.
3. Store → gọi `authService.signUp()`.
4. Service → POST `/auth/signup` (axios thêm data).
5. Backend → kiểm tra trùng → hash password → tạo user → trả 204.
6. Frontend → toast success → chuyển `/signin`.

### Bước 2: Đăng Nhập

1. `SignInForm` → người dùng nhập username, password → validate → `onSubmit`.
2. `onSubmit` → gọi `useAuthStore.signIn(username, password)`.
3. Store → gọi `authService.signIn()` → set loading = true.
4. Service → POST `/auth/signin` (axios gửi username, password).
5. Backend:
   - Tìm user theo username.
   - So password bằng bcrypt.
   - Tạo access token (JWT).
   - Tạo refresh token (random string).
   - Lưu session (refresh token + expiresAt) vào DB.
   - Set cookie `refreshToken` (httpOnly, maxAge=14 ngày).
   - Trả response: `{ accessToken, message }`.
6. Frontend Store:
   - Nhận access token.
   - Gọi `setAccessToken(accessToken)`.
   - Gọi `fetchMe()` (GET `/users/me`).
7. Axios request interceptor:
   - Gắn header: `Authorization: Bearer <accessToken>`.
8. Backend `protectedRoute`:
   - Lấy token từ header.
   - Verify JWT.
   - Lấy user từ DB.
   - Gắn `req.user`.
9. Backend `authMe`:
   - Trả `req.user`.
10. Frontend Store:
    - Nhận user.
    - Lưu user vào store.
    - Tắt loading.
11. Frontend `SignInForm`:
    - `navigate("/")`.
12. Frontend `ProtecedRoute`:
    - Có access token + user → render `ChatAppPage`.
    - `ChatAppPage` → hiển thị tên user.

### Bước 3: Khi Access Token Hết Hạn

1. User gọi API bảo vệ (vd: GET `/users/me` lần 2).
2. Axios request interceptor gắn token cũ.
3. Backend `protectedRoute` verify JWT → token hết hạn → trả 403.
4. Axios response interceptor:
   - Phát hiện 403.
   - Gọi `refresh()`.
5. Store:
   - Gọi `authService.refresh()`.
6. Service:
   - POST `/auth/refresh` (cookie refreshToken được gửi tự động).
7. Backend:
   - Kiểm tra session còn hạn.
   - Tạo access token mới.
   - Trả `{ accessToken }`.
8. Axios:
   - Nhận access token mới.
   - Lưu vào store.
   - Cập nhật header của request cũ.
   - Retry request cũ (gửi lại với token mới).
9. Request retry thành công.
