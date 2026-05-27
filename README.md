# QQNA-chat (Moji Chat)

Ứng dụng trò chuyện và hỏi đáp thời gian thực (Real-time Q&A/Chat Platform) được xây dựng trên nền tảng **MERN Stack** (MongoDB, Express, React, Node.js).

---

## 🚀 Hướng Dẫn Chạy Dưới Localhost (Running Locally)

Để khởi chạy dự án ở local, bạn cần chạy đồng thời cả máy chủ Backend và ứng dụng Frontend:

### 1. Khởi chạy Backend
1. Mở Terminal và di chuyển vào thư mục `backend`:
   ```bash
   cd backend
   ```
2. Đảm bảo đã thiết lập file `.env` với các cấu hình cơ sở dữ liệu và Cloudinary.
3. Chạy lệnh start ở chế độ Development:
   ```bash
   npm run dev
   ```
   *Máy chủ Backend mặc định sẽ chạy tại cổng **5001**: http://localhost:5001*

### 2. Khởi chạy Frontend
1. Mở một cửa sổ Terminal mới và di chuyển vào thư mục `frontend`:
   ```bash
   cd frontend
   ```
2. Chạy lệnh start ứng dụng:
   ```bash
   npm run dev
   ```
   *Ứng dụng Frontend mặc định sẽ chạy tại: http://localhost:5173*

---

## ✨ Các Tính Năng Đã Đạt Được (Features Implemented)

Hệ thống đã hoàn thiện luồng trải nghiệm người dùng từ truy cập ứng dụng, xác thực, kết bạn, trò chuyện thời gian thực cho đến quản lý hồ sơ, nhóm chat và thông báo.

### 1. Màn Hình Chờ Đánh Thức Máy Chủ (Server Warmup)
* **Giải quyết Cold Start:** Tự động hiển thị màn hình chờ khi người dùng truy cập trong lúc backend Render miễn phí đang ngủ.
* **Cơ chế đánh thức:** Frontend gọi endpoint kiểm tra máy chủ, chờ backend sẵn sàng rồi mới đưa người dùng vào luồng đăng nhập/ứng dụng.
* **Trải nghiệm liền mạch:** Giảm cảm giác lỗi kết nối khi backend cần thời gian khởi động lại.

### 2. Đăng Ký, Đăng Nhập & Phiên Làm Việc (Authentication)
* Đăng ký tài khoản với `username`, `password`, `email`, `firstName`, `lastName`.
* Đăng nhập bằng `username` và `password`.
* Mật khẩu được mã hóa bằng `bcrypt` trước khi lưu vào cơ sở dữ liệu.
* Xác thực bằng JWT gồm Access Token và Refresh Token.
* Refresh Token được lưu bằng cookie `HttpOnly`, hỗ trợ tự động làm mới phiên khi Access Token hết hạn.
* Axios interceptor tự động gọi `/auth/refresh` với các API cần xác thực.
* Route bảo vệ frontend: chỉ người đã đăng nhập mới vào được trang chat, người đã đăng nhập không bị đưa lại trang đăng nhập.
* Đăng xuất sẽ xóa state đăng nhập, chat store, `localStorage` và `sessionStorage`.
* Hiển thị đúng thông báo lỗi do backend trả về khi đăng nhập/đăng ký thất bại, ví dụ sai tên đăng nhập hoặc mật khẩu.

### 3. Hồ Sơ Cá Nhân & Cài Đặt Tài Khoản (Profile & Account Settings)
* Xem hồ sơ cá nhân và hồ sơ người dùng khác.
* Cập nhật thông tin cá nhân: tên hiển thị, email, số điện thoại và tiểu sử.
* Username được giữ cố định sau khi đăng ký.
* Kiểm tra trùng email khi cập nhật thông tin.
* Đổi mật khẩu với kiểm tra mật khẩu hiện tại, độ dài mật khẩu mới và xác nhận mật khẩu.
* Bật/tắt hiển thị mật khẩu trong form đổi mật khẩu.
* Tải avatar cá nhân lên Cloudinary qua `multer` buffer upload.
* Xem ảnh đại diện ở dạng preview/phóng to.
* Hủy kết bạn trực tiếp từ hồ sơ người dùng khác.

### 4. Giao Diện & Trải Nghiệm Ứng Dụng (UI/UX)
* Giao diện sidebar cho danh sách trò chuyện, nhóm, bạn bè và menu tài khoản.
* Hỗ trợ Light Mode/Dark Mode, lưu lựa chọn theme bằng Zustand persist.
* Giao diện responsive, có sidebar mobile.
* Skeleton/loading state cho các vùng nội dung cần tải dữ liệu.
* Dialog xác nhận cho các thao tác quan trọng như đăng xuất, xóa trò chuyện, thu hồi tin nhắn, rời nhóm hoặc giải tán nhóm.
* Toast thông báo trạng thái thao tác bằng Sonner.

### 5. Quản Lý Bạn Bè (Friend Management)
* Tìm kiếm người dùng bằng `username`.
* Gửi lời mời kết bạn kèm lời nhắn tùy chọn.
* Không cho gửi lời mời đến chính mình, người đã là bạn bè hoặc lời mời đã tồn tại.
* Quản lý danh sách lời mời đã nhận và đã gửi.
* Đồng ý hoặc từ chối lời mời kết bạn.
* Lấy danh sách bạn bè hiện tại.
* Hủy kết bạn.
* Đồng bộ thời gian thực các sự kiện bạn bè qua Socket.io: lời mời mới, lời mời được chấp nhận, lời mời bị từ chối và hủy kết bạn.

### 6. Trò Chuyện Trực Tiếp 1-1 (Direct Chat)
* Tạo hoặc mở cuộc trò chuyện trực tiếp với bạn bè.
* Chỉ cho phép nhắn tin trực tiếp với người đã kết bạn.
* Gửi và nhận tin nhắn thời gian thực bằng Socket.io.
* Sidebar tự cập nhật tin nhắn cuối, thời gian mới nhất và sắp xếp conversation theo hoạt động gần nhất.
* Hiển thị số tin nhắn chưa đọc theo từng cuộc trò chuyện.
* Tự động đánh dấu đã xem khi đang mở đúng cuộc trò chuyện.
* Đồng bộ trạng thái đã xem giữa các client.
* Xóa lịch sử cuộc trò chuyện ở phía người dùng hiện tại.

### 7. Nhóm Trò Chuyện (Group Chat)
* Tạo nhóm mới với tên nhóm và danh sách thành viên được chọn từ bạn bè.
* Gửi socket event để thành viên được mời thấy nhóm mới ngay, không cần reload.
* Thêm thành viên mới vào nhóm.
* Rời nhóm.
* Giải tán nhóm.
* Đổi tên nhóm.
* Cập nhật avatar nhóm bằng upload ảnh lên Cloudinary.
* Xem danh sách thành viên nhóm và mở hồ sơ thành viên.
* Đồng bộ realtime các thay đổi nhóm qua socket: nhóm mới, cập nhật nhóm, thành viên bị remove/nhóm bị giải tán.

### 8. Tin Nhắn, Ảnh, Reply & Mention (Messaging)
* Gửi tin nhắn văn bản trong chat 1-1 và chat nhóm.
* Gửi một ảnh hoặc nhiều ảnh trong cùng một tin nhắn.
* Upload ảnh tin nhắn lên Cloudinary.
* Preview ảnh trước khi gửi.
* Dán ảnh trực tiếp từ clipboard vào ô nhập tin nhắn.
* Xem ảnh trong lightbox/phóng to.
* Trả lời tin nhắn, hiển thị block quote của tin nhắn gốc.
* Click vào tin nhắn được reply để cuộn về tin nhắn gốc nếu còn trong danh sách.
* Mention thành viên trong nhóm bằng `@tên`, hỗ trợ `@mọi người`.
* Gửi thông báo mention realtime cho người được nhắc.
* Hiển thị mention nổi bật trong nội dung tin nhắn.
* Emoji Picker hỗ trợ chèn emoji vào nội dung tin nhắn.

### 9. Bài Viết Trong Chat (Rich Post)
* Tạo bài viết dạng rich text trong cuộc trò chuyện.
* Hỗ trợ tiêu đề bài viết riêng.
* Editor hỗ trợ định dạng heading, bold, italic, underline và link.
* Hỗ trợ chèn/dán ảnh trong nội dung bài viết và upload ảnh lên Cloudinary.
* Hiển thị bài viết dạng card trong chat.
* Mở bài viết ở chế độ đọc chi tiết.
* Sửa bài viết đã gửi nếu người dùng là tác giả.
* Đồng bộ cập nhật bài viết realtime đến các thành viên trong conversation.

### 10. Tương Tác Tin Nhắn (Message Actions)
* Thu hồi tin nhắn của chính mình.
* Đồng bộ trạng thái thu hồi realtime bằng socket event `message-recalled`.
* Thả cảm xúc nhanh vào tin nhắn với các emoji phổ biến.
* Toggle reaction của chính mình.
* Hiển thị tổng số reaction và tooltip danh sách người đã react.
* Đồng bộ reaction realtime bằng socket event `message-reaction`.
* Hiển thị trạng thái gửi/đã xem cho tin nhắn cuối của người gửi.

### 11. Thông Báo, Unread Title & Âm Thanh (Notifications & Sound Effects)
* **Unread Badge trên tiêu đề trình duyệt:** Tự động hiển thị tổng số tin nhắn chưa đọc trên tab, ví dụ `(2) QQNA Chat`.
* Title tự quay về `QQNA Chat` khi không còn tin chưa đọc.
* **Âm báo tin nhắn:** Phát âm thanh khi nhận tin nhắn mới từ người khác.
* Hỗ trợ nhiều kiểu âm báo: QQNA Classic, Pop, Chime, Ping và Soft.
* **Âm thanh thao tác:** Có feedback âm thanh cho các hành động chính như chọn cuộc trò chuyện, gửi tin nhắn, react emoji, thu hồi tin nhắn, tạo nhóm, xóa trò chuyện, rời/giải tán nhóm, đổi tên nhóm, cập nhật avatar nhóm và thao tác bạn bè.
* Người dùng có thể bật/tắt âm báo tin nhắn, âm thao tác, pop-up trong app, thông báo trình duyệt và chỉnh âm lượng trong `Profile & Settings > Cấu Hình`.
* **Thông báo trình duyệt thông minh:** Chỉ hiện browser notification khi không có tab/cửa sổ QQNA nào đang visible, tránh thông báo trùng khi người dùng đang mở app ở cửa sổ Chrome khác.
* Pop-up trong app hiển thị người gửi và preview nội dung tin nhắn mới.

### 12. Socket Realtime & Trạng Thái Online
* Xác thực socket bằng Access Token.
* Tự động join các phòng conversation mà người dùng là thành viên.
* Join/leave conversation khi tạo nhóm hoặc bị remove khỏi nhóm.
* Theo dõi online users và hiển thị trạng thái online/offline trong danh sách bạn bè.
* Các socket event chính: `new-message`, `read-message`, `new-group`, `group-updated`, `group-removed`, `message-recalled`, `message-updated`, `message-reaction`, `mention-notification`, `new-friend-request`, `friend-request-accepted`, `friend-request-declined`, `unfriended`.

### 13. Phân Trang & Lưu Trữ State
* Tin nhắn được tải theo phân trang cursor với giới hạn 50 tin/lần.
* Hỗ trợ infinite scroll để tải thêm tin nhắn cũ.
* Persist một phần auth state, chat conversations, theme và notification settings bằng Zustand persist.
* Reset state chat khi đăng xuất để tránh lộ dữ liệu phiên trước.

### 14. Upload Ảnh & Cloudinary
* Upload avatar cá nhân.
* Upload avatar nhóm.
* Upload ảnh tin nhắn.
* Upload ảnh trong rich post.
* Backend dùng `multer` memory storage và helper upload buffer lên Cloudinary.
