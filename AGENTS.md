# AI Agent Instructions for QQNA-chat

This is a Vietnamese Q&A/Chat application (MERN Stack) currently in early development. These instructions help AI agents understand the codebase structure and conventions.

## Project Overview

**QQNA-chat** is a real-time question-answer and chat platform with:

- **Backend**: Node.js + Express 5.2.1 with ES modules
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT-based with password hashing (bcrypt)
- **Language**: Vietnamese UI/content (error messages, comments, user-facing text)

## Architecture

### Backend Structure

```
backend/
├── src/
│   ├── server.js              # Express app entry point
│   ├── controllers/           # Business logic
│   │   └── authController.js # Auth operations (signup, login, etc.)
│   ├── routes/               # API endpoints
│   │   └── authRoute.js      # Auth routes (/api/auth/*)
│   ├── models/               # Mongoose schemas
│   │   └── User.js           # User schema with auth fields
│   ├── libs/                 # Utilities & helpers
│   │   └── db.js             # MongoDB connection
│   └── middlewares/          # Express middlewares (empty, prepare for auth middleware)
└── package.json
```

### Current Status

- **Authentication**: In progress (signup controller has validation logic, password hashing not yet implemented)
- **Frontend**: Empty directory, not yet started
- **Middleware**: Empty directory, prepare for JWT verification middleware

## Key Commands

**Development:**

```bash
npm run dev              # Start dev server with nodemon (watches file changes)
```

**Environment Setup:**
Create `.env` file in `backend/` with:

```
MONGODB_CONNECTIONSTRING=mongodb://...
PORT=5001
```

## Code Conventions

### Language & Style

- **Vietnamese for user-facing content**: Error messages, comments, and UI text should be in Vietnamese
- **English for code structure**: Class names, function names, variable names in English (camelCase)
- **Example**: `res.status(409).json({ message: "Username đã tồn tại" })`

### Error Handling

- Use try-catch blocks in async functions
- Return structured JSON responses with status codes (400, 409, 500)
- Vietnamese error messages for user feedback
- Log errors to console for debugging

### Response Format

All endpoints return JSON:

```javascript
// Error response
{
  message: "Vietnamese error description";
}

// Success response (structure TBD)
```

### Database Patterns

- **Mongoose Schema Design**: Use required fields, unique indexes, trim, lowercase for sensitive data
- **Timestamps**: Enable `timestamps: true` for createdAt/updatedAt auto-tracking
- **Sparse Indexes**: Use `sparse: true` for optional unique fields (e.g., phone)
- **Field Naming**: `hashedPassword` (not plain), `displayName` (not fullName), explicit `avatarUrl` + `avatarId`

### Authentication (In Progress)

- **Password Hashing**: Use bcrypt (already in dependencies)
- **JWT Tokens**: Use jsonwebtoken (already in dependencies)
- **Endpoints**: `/api/auth/signup` currently in progress

## Common Development Tasks

### Adding a New API Endpoint

1. Create/update schema in `models/`
2. Add business logic in `controllers/`
3. Add route in `routes/`
4. Mount route in `server.js` with `app.use()`

### Handling Validation

Follow the signup controller pattern:

- Check required fields first
- Return 400 status for missing data
- Check uniqueness constraints (return 409 for duplicates)
- Include Vietnamese error messages

### Database Connection Issues

- Verify `.env` has valid `MONGODB_CONNECTIONSTRING`
- Connection logs: "Kết nối cơ sở dữ liệu thành công" (success) or error with details
- Process exits with code 1 on connection failure (see db.js)

## Important Notes

- **ES Modules**: `package.json` has `"type": "module"`, use `import/export` not `require()`
- **Async/Await**: All database operations use async/await
- **CORS Enabled**: Cross-origin requests are allowed
- **Nodemon**: Dev server auto-reloads on file changes
- **Port Default**: 5001 (overridable via PORT env var)

## Next Steps for Agents

When working on this project:

1. Complete the signup authentication flow (password hashing with bcrypt, User model import)
2. Add JWT token generation and login endpoint
3. Create auth middleware for protected routes
4. Implement error handling middleware
5. Add validation middleware for request data
