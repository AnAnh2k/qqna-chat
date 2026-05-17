# Commit Chi Tiết: feat(chat): add conversations, messages, and friend checks

**Commit Hash**: `d89299a`  
**Date**: Fri May 8 21:33:08 2026 +0700  
**Author**: AnAnh2k  
**Summary**: Thêm hệ thống chat (tin nhắn), quản lý bạn bè, và các kiểm tra quyền

---

## 📊 Thống Kê Thay Đổi

- **834 insertions** (dòng code mới)
- **2 deletions** (dòng code xóa)
- **15 files changed**

---

## 🏗️ Kiến Trúc Tổng Quan

Commit này thêm các chức năng chính:

1. **Hệ thống Chat** (Conversations + Messages)
   - Hỗ trợ chat trực tiếp 1-1 (direct)
   - Hỗ trợ chat nhóm (group)
   - Theo dõi tin nhắn cuối cùng
   - Đếm tin nhắn chưa đọc

2. **Hệ thống Bạn Bè** (Friends + FriendRequests)
   - Gửi lời mời kết bạn
   - Chấp nhận/từ chối lời mời
   - Quản lý danh sách bạn bè

3. **Kiểm Tra Quyền** (Middleware)
   - Kiểm tra bạn bè trước khi chat
   - Kiểm tra membership trước khi gửi tin nhắn

4. **Real-time** (Socket.IO)
   - Cơ sở hạ tầng cho các cập nhật real-time

---

## 📁 Models - Cấu Trúc Dữ Liệu

### 1. Model: `Conversation.js` (Cuộc Trò Chuyện)

Đây là file quan trọng nhất của cụm chat. Hiện tại code thật không chỉ là một object `conversation` đơn giản, mà là 4 lớp schema con ghép lại với nhau để phục vụ direct chat, group chat, lưu tin nhắn cuối và thống kê chưa đọc.

```javascript
import mongoose from "mongoose";

const participantSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    _id: false,
  },
);

const groupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    _id: false,
  },
);

const lastMessageSchema = new mongoose.Schema(
  {
    _id: { type: String },
    content: {
      type: String,
      default: null,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    createdAt: {
      type: Date,
      default: null,
    },
  },
  {
    _id: false,
  },
);

const conversationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["direct", "group"],
      required: true,
    },
    participants: {
      type: [participantSchema],
      required: true,
    },
    group: {
      type: groupSchema,
    },
    lastMessageAt: {
      type: Date,
    },
    seenBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    lastMessage: {
      type: lastMessageSchema,
      default: null,
    },
    unreadCounts: {
      type: Map,
      of: Number,
      default: {},
    },
  },
  {
    timestamps: true,
  },
);

conversationSchema.index({
  "participant.userId": 1,
  lastMessageAt: -1,
});

const Conversation = mongoose.model("Conversation", conversationSchema);
export default Conversation;
```

**Giải thích đúng theo code hiện giờ**:

- `participantSchema` là schema con để mỗi người tham gia có `userId` và `joinedAt`.
- `groupSchema` chỉ được dùng khi `type = "group"`, lưu `name` và `createdBy`.
- `lastMessageSchema` không lưu full message document, chỉ cache đúng 4 field cần để render danh sách chat nhanh.
- `conversationSchema` là schema chính, gộp tất cả lại.
- `seenBy` là mảng user đã xem tin nhắn gần nhất.
- `unreadCounts` là `Map`, nghĩa là key là `userId`, value là số tin chưa đọc.
- `timestamps: true` tự sinh `createdAt` và `updatedAt`.

**Điểm rất quan trọng trong code hiện giờ**:

- Dòng index đang viết là `"participant.userId"`, nhưng field thật trong schema là `participants.userId`.
- Nghĩa là phần index này đang có khả năng bị gõ thiếu `s`.
- Nếu giữ nguyên, MongoDB có thể vẫn tạo index nhưng không đi đúng field mong muốn.
- Đây là chỗ bạn cần hiểu rõ khi đọc commit: tài liệu cũ có thể mô tả ý định, nhưng code hiện tại mới là thứ app đang chạy.

```javascript
{
  type: "direct" | "group",           // Loại: 1-1 hoặc nhóm

  participants: [                      // Danh sách người tham gia
    {
      userId: ObjectId (ref: User),    // ID người
      joinedAt: Date                   // Ngày tham gia
    }
  ],

  group: {                             // Chỉ cho type="group"
    name: String,                      // Tên nhóm
    createdBy: ObjectId (ref: User)    // Người tạo nhóm
  },

  lastMessageAt: Date,                 // Thời điểm tin nhắn cuối cùng

  lastMessage: {                       // Tin nhắn cuối cùng (cache)
    _id: String,
    content: String,
    senderId: ObjectId (ref: User),
    createdAt: Date
  },

  seenBy: [ObjectId (ref: User)],      // Danh sách người đã xem tin nhắn cuối

  unreadCounts: Map<userId, number>,   // {userId1: 3, userId2: 1} - số tin chưa đọc

  timestamps: true                     // createdAt, updatedAt
}
```

**Từng lớp trong `Conversation.js`**:

1. `import mongoose from "mongoose";`


    - Nạp thư viện Mongoose để khai báo schema và model.

2. `participantSchema`


    - Tách riêng mỗi participant ra thành 1 object con.
    - `userId` là khóa chính để biết ai đang tham gia.
    - `joinedAt` cho biết người đó tham gia lúc nào.
    - `_id: false` để Mongoose không tự tạo `_id` cho từng phần tử participant.

3. `groupSchema`


    - Dùng cho conversation nhóm.
    - `trim: true` để tên nhóm không có khoảng trắng thừa ở đầu/cuối.
    - `createdBy` chỉ rõ ai tạo nhóm.

4. `lastMessageSchema`


    - Chỉ lưu bản tóm tắt của message cuối cùng.
    - `_id` ở đây là string chứ không phải ObjectId vì nó lấy từ message thật rồi cache lại.
    - `content` và `createdAt` đều có `default: null` để conversation mới chưa có tin nhắn vẫn hợp lệ.

5. `conversationSchema`


    - `type` bắt buộc phải là `direct` hoặc `group`.
    - `participants` bắt buộc phải có vì không có người tham gia thì không phải conversation.
    - `group` chỉ có ý nghĩa nếu conversation là nhóm.
    - `lastMessageAt` dùng để sort danh sách chat.
    - `seenBy` dùng cho trạng thái đã xem.
    - `lastMessage` dùng cho preview của conversation.
    - `unreadCounts` lưu đếm tin chưa đọc theo từng user.

6. `timestamps: true`


    - Mongoose tự tạo `createdAt` và `updatedAt`.

7. `conversationSchema.index(...)`


    - Ý định là tăng tốc truy vấn conversation theo người tham gia và thời điểm tin nhắn cuối.
    - Đây là một phần bạn nên để ý vì field đang viết thiếu `s`.

8. `mongoose.model("Conversation", conversationSchema)`


    - Đăng ký model tên `Conversation` để các controller dùng `import Conversation from ...`.

**Dùng trong luồng thực tế**:

- Khi tạo chat 1-1, controller sẽ tạo document `Conversation` có 2 participants.
- Khi tạo nhóm, controller sẽ nhét thêm `group.name` và `group.createdBy`.
- Khi có tin nhắn mới, helper sẽ cập nhật `lastMessage`, `lastMessageAt`, và `unreadCounts`.

---

**Chỉ mục (Indexes)**:

- `{ "participants.userId": 1, lastMessageAt: -1 }` - Tìm nhanh các cuộc trò chuyện của user

---

### 2. Model: `Message.js` (Tin Nhắn)

```javascript
{
  conversationId: ObjectId (ref: Conversation),  // Cuộc trò chuyện chứa tin nhắn
  senderId: ObjectId (ref: User),                // Người gửi
  content: String,                               // Nội dung tin nhắn
  imgUrl: String,                                // URL ảnh (nếu có)
  timestamps: true                               // createdAt, updatedAt
}
```

**Chỉ mục**:

- `{ conversationId: 1 }` - Index trên field hay query
- `{ conversationId: 1, createdAt: -1 }` - Tìm tin nhắn của cuộc trò chuyện, sắp xếp mới nhất

---

### 3. Model: `Friend.js` (Bạn Bè)

```javascript
{
  userA: ObjectId (ref: User),         // User thứ nhất (ID nhỏ hơn)
  userB: ObjectId (ref: User),         // User thứ hai (ID lớn hơn)
  timestamps: true                     // createdAt, updatedAt
}
```

**Đặc điểm**:

- **Deterministic Order**: Luôn lưu user nhỏ hơn vào `userA`, user lớn hơn vào `userB`
  - Ví dụ: nếu Alice (id=1) + Bob (id=2) là bạn
  - Luôn lưu: `{ userA: 1, userB: 2 }` (không bao giờ có `{ userA: 2, userB: 1 }`)
  - Điều này giúp **tìm kiếm nhanh** vì query pattern luôn giống nhau
- **Pre-save Hook**: Tự động sắp xếp trước khi lưu vào DB

**Chỉ mục**:

- `{ userA: 1, userB: 1 } (unique: true)` - Đảm bảo không có duplicate friend relationship

---

### 4. Model: `FriendRequest.js` (Lời Mời Kết Bạn)

```javascript
{
  from: ObjectId (ref: User),          // Người gửi lời mời
  to: ObjectId (ref: User),            // Người nhận lời mời
  message: String,                     // Thông điệp (tùy chọn, max 300 ký tự)
  timestamps: true                     // createdAt, updatedAt
}
```

**Chỉ mục**:

- `{ from: 1, to: 1 } (unique: true)` - Chỉ có 1 lời mời giữa 2 người
- `{ from: 1 }` - Tìm lời mời mà A gửi
- `{ to: 1 }` - Tìm lời mời mà A nhận

---

## 🛡️ Middleware - Kiểm Tra Quyền

### 1. `checkFriendship()`

**Mục đích**: Đảm bảo 2 người là bạn bè trước khi cho phép chat

```javascript
// Đầu vào: req.body.recipientId (chat 1-1) hoặc req.body.memberIds (chat nhóm)
// Đầu ra: next() (thành công) hoặc res.status(403)

// Logic:
1. Lấy ID người dùng hiện tại từ token: me = req.user._id
2. Nếu chat 1-1:
   - Tìm Friend document với cả 2 user ID (bất kể thứ tự)
   - Nếu không tìm thấy: trả 403 "Chưa kết bạn"
   - Nếu tìm thấy: cho phép (gọi next())
3. Nếu chat nhóm:
   - Loop qua tất cả memberIds
   - Kiểm tra mỗi member có phải bạn không
   - Nếu có member không phải bạn: trả 403 + danh sách notFriends
   - Nếu tất cả là bạn: cho phép (gọi next())
```

**Nơi sử dụng**:

- `POST /api/conversations` - Tạo cuộc trò chuyện (kiểm tra bạn bè)
- `POST /api/messages/direct` - Gửi tin nhắn trực tiếp

---

### 2. `checkGroupMembership()`

**Mục đích**: Đảm bảo user là thành viên của nhóm trước khi gửi tin nhắn

```javascript
// Đầu vào: req.body.conversationId
// Đầu ra: req.conversation = conversation, next() (thành công) hoặc res.status(403)

// Logic:
1. Lấy conversationId từ req.body
2. Tìm conversation trong DB
3. Kiểm tra userId có trong participants không
4. Nếu không: trả 403 "Không phải thành viên"
5. Nếu có: gắn req.conversation = conversation, gọi next()
```

**Nơi sử dụng**:

- `POST /api/messages/group` - Gửi tin nhắn nhóm

---

## 🎮 Controllers - Business Logic

### 1. `conversationController.js`

#### `createConversation()`

**Flow**:

```
User bấm "Chat với Bob" (direct) hoặc "Tạo nhóm" (group)
    ↓
Frontend gửi: POST /api/conversations
    { type: "direct", memberIds: [bobId] }
    hoặc
    { type: "group", name: "Nhóm A", memberIds: [userId1, userId2] }
    ↓
Middleware checkFriendship kiểm tra bạn bè
    ↓
Controller: createConversation()
    ├─ Validate dữ liệu
    ├─ Nếu type="direct":
    │  ├─ Tìm conversation trước (nếu đã có thì không tạo mới)
    │  └─ Nếu không có: tạo mới với 2 participants
    ├─ Nếu type="group":
    │  └─ Tạo conversation với nhóm info
    ├─ Populate participants + lastMessage (lấy displayName, avatar)
    └─ Response: 201 + conversation object
```

**Mã**:

```javascript
export const createConversation = async (req, res) => {
  const { type, name, memberIds } = req.body;
  const userId = req.user._id; // Từ token

  // 1. Validate
  if (!type || !memberIds || memberIds.length === 0) {
    return res.status(400).json({ message: "Thiếu dữ liệu" });
  }
  if (type === "group" && !name) {
    return res.status(400).json({ message: "Tên nhóm là bắt buộc" });
  }

  let conversation;

  // 2. Nếu direct: tìm conversation cũ hoặc tạo mới
  if (type === "direct") {
    const participantId = memberIds[0];
    conversation = await Conversation.findOne({
      type: "direct",
      "participants.userId": { $all: [userId, participantId] }, // Cả 2 user đều trong
    });
    if (!conversation) {
      conversation = new Conversation({
        type: "direct",
        participants: [{ userId: userId }, { userId: participantId }],
        lastMessageAt: new Date(),
      });
      await conversation.save();
    }
  }
  // 3. Nếu group: luôn tạo mới
  else if (type === "group") {
    conversation = new Conversation({
      type: "group",
      participants: [{ userId }, ...memberIds.map((id) => ({ userId: id }))],
      group: { name, createdBy: userId },
      lastMessageAt: new Date(),
    });
    await conversation.save();
  }

  // 4. Populate + Response
  await conversation.populate([
    { path: "participants.userId", select: "displayName avatarUrl" },
    { path: "lastMessage.senderId", select: "displayName avatarUrl" },
  ]);
  res.status(201).json({ conversation });
};
```

---

#### `getConversations()`

**Flow**:

```
User vào app/chat
    ↓
Frontend gửi: GET /api/conversations
    ↓
Controller: getConversations()
    ├─ Lấy tất cả conversation của user (nơi user là participant)
    ├─ Sắp xếp theo lastMessageAt (mới nhất trước)
    ├─ Populate participants + lastMessage info
    └─ Format + Response: 200 + [conversations]
```

**Logic**:

```javascript
export const getConversations = async (req, res) => {
  const userId = req.user._id;

  // Tìm tất cả conversation chứa userId trong participants
  const conversations = await Conversation.find({
    "participants.userId": userId,
  })
    .sort({ lastMessageAt: -1, updatedAt: -1 }) // Mới nhất trước
    .populate({
      path: "participants.userId",
      select: "displayName avatarUrl",
    })
    .populate({
      path: "lastMessage.senderId",
      select: "displayName avatarUrl",
    });

  // Format data
  const formatted = conversations.map((convo) => {
    const participants = (convo.participants || []).map((p) => ({
      _id: p.userId?._id,
      displayName: p.userId?.displayName,
      avatarUrl: p.userId?.avatarUrl ?? null,
    }));

    return {
      _id: convo._id,
      type: convo.type,
      participants,
      lastMessage: convo.lastMessage,
      unreadCounts: Object.fromEntries(convo.unreadCounts),
    };
  });

  res.json(formatted);
};
```

---

#### `getMessages()`

**Flow**:

```
User click vào conversation
    ↓
Frontend gửi: GET /api/conversations/{conversationId}/messages
    ↓
Controller: getMessages()
    ├─ Lấy tất cả message của conversation (sắp xếp cũ nhất trước)
    ├─ Populate sender info
    └─ Response: 200 + [messages]
```

---

### 2. `friendController.js`

#### `sendFriendRequest()`

**Flow**:

```
User A bấm "Thêm bạn"
    ↓
Frontend gửi: POST /api/friends/requests
    { to: userBId, message: "Kết bạn nào" }
    ↓
Controller: sendFriendRequest()
    ├─ Validate dữ liệu
    ├─ Kiểm tra from !== to
    ├─ Kiểm tra userB tồn tại
    ├─ Kiểm tra chưa là bạn + chưa có request đang chờ
    ├─ Tạo FriendRequest
    └─ Response: 201 + request
```

**Mã**:

```javascript
export const sendFriendRequest = async (req, res) => {
  const { to, message } = req.body;
  const from = req.user._id;

  // 1. Kiểm tra không kết bạn với chính mình
  if (from === to) {
    return res
      .status(400)
      .json({ message: "Không thể gửi lời mời cho chính mình" });
  }

  // 2. Kiểm tra user B tồn tại
  const userExits = await User.exists({ _id: to });
  if (!userExits) {
    return res.status(404).json({ message: "Người dùng không tồn tại" });
  }

  // 3. Sắp xếp ID (deterministic)
  let UserA = from.toString();
  let UserB = to.toString();
  if (UserA > UserB) {
    [UserA, UserB] = [UserB, UserA];
  }

  // 4. Kiểm tra đã là bạn hay có request đang chờ
  const [alreadyFriends, exitingRequest] = await Promise.all([
    Friend.findOne({ userA: UserA, userB: UserB }),
    FriendRequest.findOne({
      $or: [
        { from, to },
        { from: to, to: from }, // Request từ B gửi A
      ],
    }),
  ]);

  if (alreadyFriends) {
    return res.status(400).json({ message: "Hai người đã là bạn bè" });
  }
  if (exitingRequest) {
    return res.status(400).json({ message: "Đã tồn tại lời mời kết bạn" });
  }

  // 5. Tạo request
  const request = await FriendRequest.create({
    from,
    to,
    message,
  });

  res.status(201).json({ message: "Gửi lời mời kết bạn thành công", request });
};
```

---

#### `acceptFriendRequest()`

**Flow**:

```
User B nhấn "Chấp nhận" lời mời từ A
    ↓
Frontend gửi: POST /api/friends/requests/{requestId}/accept
    ↓
Controller: acceptFriendRequest()
    ├─ Kiểm tra request tồn tại
    ├─ Kiểm tra user là người nhận (request.to === current user)
    ├─ Tạo Friend document
    ├─ Xóa FriendRequest
    └─ Response: 200 + newFriend info
```

---

### 3. `messageController.js`

#### `sendDirectMessage()`

**Flow**:

```
User A nhập tin nhắn + bấm "Gửi" cho Bob
    ↓
Frontend gửi: POST /api/messages/direct
    { recipientId: bobId, content: "Hi Bob", conversationId: convId }
    ↓
Middleware checkFriendship kiểm tra bạn bè
    ↓
Controller: sendDirectMessage()
    ├─ Validate content
    ├─ Nếu có conversationId: tìm conversation cũ
    ├─ Nếu không có: tạo conversation mới
    ├─ Tạo Message document
    ├─ Cập nhật conversation (lastMessage, unreadCounts)
    └─ Response: 201 + message
```

**Mã**:

```javascript
export const sendDirectMessage = async (req, res) => {
  const { recipientId, content, conversationId } = req.body;
  const senderId = req.user._id;

  if (!content) {
    return res.status(400).json({ message: "Thiếu nội dung" });
  }

  let conversation;

  // Tìm conversation cũ nếu có conversationId
  if (conversationId) {
    conversation = await Conversation.findById(conversationId);
  }

  // Nếu không tìm thấy: tạo conversation mới
  if (!conversation) {
    conversation = await Conversation.create({
      type: "direct",
      participants: [
        { userId: senderId, joinedAt: new Date() },
        { userId: recipientId, joinedAt: new Date() },
      ],
      lastMessageAt: new Date(),
      unreadCounts: new Map(),
    });
  }

  // Tạo Message
  const message = await Message.create({
    conversationId: conversation._id,
    senderId,
    content,
  });

  // Cập nhật conversation
  updateConversationAfterCreateMessage(conversation, message, senderId);
  await conversation.save();

  res.status(201).json({ message });
};
```

---

#### `sendGroupMessage()`

**Flow**:

```
User A nhập tin nhắn nhóm
    ↓
Frontend gửi: POST /api/messages/group
    { conversationId: groupId, content: "Hello group" }
    ↓
Middleware checkGroupMembership kiểm tra membership
    ↓
Controller: sendGroupMessage()
    ├─ Validate content
    ├─ Tạo Message
    ├─ Cập nhật conversation (lastMessage, unreadCounts)
    └─ Response: 201 + message
```

---

## 🔧 Utility Functions

### `messageHelper.js`

#### `updateConversationAfterCreateMessage()`

**Mục đích**: Cập nhật conversation khi có tin nhắn mới

```javascript
export const updateConversationAfterCreateMessage = (
  conversation,
  message,
  senderId,
) => {
  // 1. Cập nhật lastMessage
  conversation.set({
    seenBy: [], // Reset người đã xem
    lastMessageAt: message.createdAt,
    lastMessage: {
      _id: message._id,
      content: message.content,
      senderId,
      createdAt: message.createdAt,
    },
  });

  // 2. Cập nhật unreadCounts
  // - Người gửi: đặt về 0
  // - Người khác: tăng 1
  conversation.participants.forEach((p) => {
    const memberId = p.userId.toString();
    const isSender = memberId === senderId.toString();
    const prevCount = conversation.unreadCounts.get(memberId) || 0;
    conversation.unreadCounts.set(memberId, isSender ? 0 : prevCount + 1);
  });
};
```

**Ví dụ**:

- Conversation có 2 participants: Alice, Bob
- Alice gửi tin nhắn
- Result:
  ```
  unreadCounts: {
    "aliceId": 0,  // Người gửi
    "bobId": 1,    // Người nhận (chưa đọc)
  }
  ```

---

## 📡 Routes - Kết Nối Endpoints

### `conversationRoute.js`

```javascript
router.post("/", checkFriendship, createConversation); // Tạo conversation
router.get("/", getConversations); // Lấy danh sách
router.get("/:conversationId/messages", getMessages); // Lấy tin nhắn
```

### `friendRoute.js`

```javascript
router.post("/requests", sendFriendRequest); // Gửi lời mời
router.post("/requests/:requestId/accept", acceptFriendRequest); // Chấp nhận
router.post("/requests/:requestId/decline", declineFriendRequest); // Từ chối
router.get("/", getAllFriends); // Lấy danh sách bạn
router.get("/requests", getFriendsRequests); // Lấy lời mời
```

### `messageRoute.js`

```javascript
router.post("/direct", checkFriendship, sendDirectMessage); // Chat 1-1
router.post("/group", checkGroupMembership, sendGroupMessage); // Chat nhóm
```

---

## 🔌 Server.js - Tích Hợp

```javascript
// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors({ ... }));

// Public routes
app.use("/api/auth", authRoute);

// Protected middleware
app.use(protectedRoute);  // ← Tất cả route sau đây cần token

// Private routes
app.use("/api/users", userRoute);
app.use("/api/friends", friendRoute);     // ← Mới thêm
app.use("/api/messages", messageRoute);   // ← Mới thêm
app.use("/api/conversations", conversationRoute);  // ← Mới thêm
```

---

## 🔌 Socket.IO - Real-time (Cơ Sở Hạ Tầng)

```javascript
// backend/src/libs/socket.js

export const initSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || "*",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);
    socket.on("disconnect", () => {
      console.log("Socket disconnected:", socket.id);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) throw new Error("Socket.IO not initialized");
  return io;
};
```

**Hiện tại**: Chỉ có connection/disconnect handler  
**Sau**: Sẽ thêm events như `"new_message"`, `"typing"`, etc.

---

## 🔀 Luồng Hoàn Chỉnh: Chat 1-1

### 1. Alice muốn chat với Bob

```
Frontend (React)
  ├─ Alice click "Chat với Bob"
  ├─ Gọi POST /api/conversations
  │   { type: "direct", memberIds: [bobId] }
  │
  └─→ Backend
      ├─ authMiddleware: Verify token → req.user = Alice
      ├─ checkFriendship: Alice + Bob là bạn? → YES ✓
      ├─ createConversation():
      │   ├─ Tìm conversation (Alice + Bob)
      │   ├─ Nếu không có: tạo mới
      │   └─ Populate + Return
      │
      └─→ Frontend: Response 201 + conversation object
          ├─ Lưu conversationId vào state
          └─ Render chat window
```

### 2. Alice gửi tin nhắn "Hi Bob"

```
Frontend (React)
  ├─ Alice type "Hi Bob" + bấm Send
  ├─ Gọi POST /api/messages/direct
  │   {
  │     recipientId: bobId,
  │     content: "Hi Bob",
  │     conversationId: convId
  │   }
  │
  └─→ Backend
      ├─ authMiddleware: Verify → req.user = Alice
      ├─ checkFriendship: Alice + Bob là bạn? → YES ✓
      ├─ sendDirectMessage():
      │   ├─ Tìm conversation (hoặc tạo mới)
      │   ├─ Tạo Message document
      │   ├─ Cập nhật Conversation:
      │   │   ├─ lastMessage = {content: "Hi Bob", senderId: Alice}
      │   │   ├─ lastMessageAt = now
      │   │   └─ unreadCounts = {Alice: 0, Bob: 1}
      │   └─ Lưu conversation
      │
      └─→ Frontend: Response 201 + message object
          ├─ Thêm vào chat history
          └─ (Sau: Socket emit "new_message")
```

### 3. Bob mở chat room

```
Frontend (React)
  ├─ Bob vào chat app
  ├─ Gọi GET /api/conversations
  │
  └─→ Backend
      ├─ authMiddleware: Verify → req.user = Bob
      ├─ getConversations():
      │   ├─ Tìm tất cả Conversation có Bob là participant
      │   ├─ Sắp xếp theo lastMessageAt (mới nhất trước)
      │   └─ Populate + Format
      │
      └─→ Frontend: Response 200 + [conversations]
          ├─ Thấy conversation với Alice (lastMessage: "Hi Bob")
          ├─ unreadCounts: {Alice: 0, Bob: 1} ← Số tin chưa đọc
          └─ Click vào conversation
```

### 4. Bob mở tin nhắn từ Alice

```
Frontend (React)
  ├─ Bob click vào conversation với Alice
  ├─ Gọi GET /api/conversations/{convId}/messages
  │
  └─→ Backend
      ├─ Lấy tất cả Message của conversation
      ├─ Sắp xếp theo createdAt (cũ nhất trước)
      ├─ Populate sender info
      │
      └─→ Frontend: Response 200 + [messages]
          ├─ Render chat history
          └─ (Sau: Emit "message_read" event qua Socket)
```

---

## 🔀 Luồng: Kết Bạn

### 1. Alice gửi lời mời kết bạn cho Bob

```
Frontend
  ├─ Alice click "Thêm bạn" trên profile Bob
  ├─ Gửi POST /api/friends/requests
  │   { to: bobId, message: "Kết bạn nào" }
  │
  └─→ Backend
      ├─ authMiddleware: Verify → req.user = Alice
      ├─ sendFriendRequest():
      │   ├─ Kiểm tra Alice ≠ Bob
      │   ├─ Kiểm tra Bob tồn tại
      │   ├─ Kiểm tra chưa là bạn
      │   ├─ Kiểm tra chưa có request đang chờ
      │   └─ Tạo FriendRequest: {from: Alice, to: Bob}
      │
      └─→ Frontend: Response 201 + request object
          └─ Toast: "Đã gửi lời mời"
```

### 2. Bob chấp nhận lời mời

```
Frontend
  ├─ Bob mở Notification
  ├─ Thấy lời mời từ Alice
  ├─ Click "Chấp nhận"
  ├─ Gửi POST /api/friends/requests/{requestId}/accept
  │
  └─→ Backend
      ├─ authMiddleware: Verify → req.user = Bob
      ├─ acceptFriendRequest():
      │   ├─ Lấy FriendRequest
      │   ├─ Kiểm tra Bob = request.to
      │   ├─ Tạo Friend: {userA: aliceId, userB: bobId}
      │   │            (userA < userB luôn, vì deterministic sort)
      │   └─ Xóa FriendRequest
      │
      └─→ Frontend: Response 200 + newFriend info
          ├─ Alice + Bob là bạn bè
          └─ Bây giờ có thể chat được
```

---

## 📊 Thay Đổi Nhỏ trong AuthController

**File**: `backend/src/controllers/authController.js`

```diff
- displayName: `${firstName} ${lastName}`,
+ displayName: `${lastName} ${firstName}`,
```

**Giải thích**: Đổi thứ tự từ `firstName lastName` thành `lastName firstName` (theo quy ước tiếng Việt)

**Ví dụ**:

- Input: `firstName: "Anh"`, `lastName: "Đức"`
- Cũ: `displayName: "Anh Đức"`
- Mới: `displayName: "Đức Anh"` ✓ (đúng theo phong tục Việt Nam)

---

## 🎯 Tóm Tắt Điểm Quan Trọng

✅ **Conversation Model**:

- Hỗ trợ direct (1-1) + group chat
- Cache `lastMessage` để tránh query Message mỗi lần
- Theo dõi `unreadCounts` per participant

✅ **Friend Model**:

- Deterministic order (userA < userB) để tìm kiếm nhanh
- Unique constraint: chỉ có 1 friend relationship

✅ **Middleware**:

- `checkFriendship`: Kiểm tra bạn trước khi tạo conversation/chat
- `checkGroupMembership`: Kiểm tra membership trước khi gửi tin nhắn

✅ **Message Creation Flow**:

- Tạo Message document
- Cập nhật Conversation (lastMessage, unreadCounts)
- Response

✅ **Socket.IO Setup**: Cơ sở cho real-time events

✅ **Routes**: Đã mount tất cả vào server.js

---

## 🚀 Tiếp Theo (Frontend Implementation)

1. **Conversation Component**: Hiển thị danh sách chat
2. **Message Component**: Hiển thị tin nhắn + form gửi
3. **Friend Component**: Danh sách bạn + lời mời
4. **Socket Events**: Real-time updates
