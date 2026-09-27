# Realtime Chat Frontend

Plain JavaScript Vite + React + Tailwind frontend for the supplied Node/Express/Socket.io backend.

## Requirements

- Node.js 18+
- Backend running on `http://localhost:4000`
- Backend CORS `CLIENT_ORIGIN=http://localhost:5173`

## Install

```bash
npm install
```

Create `.env`:

```env
VITE_API_URL=http://localhost:4000/api
VITE_SOCKET_URL=http://localhost:4000
```

Start:

```bash
npm run dev
```

Open:

```text
http://localhost:5173
```

## Backend API used

### Auth
- POST `/api/auth/signup`
- POST `/api/auth/login`
- POST `/api/auth/refresh`
- POST `/api/auth/logout`
- GET `/api/auth/me`

### Users
- GET `/api/users/search?q=...`
- GET `/api/users/:id`

### Conversations
- GET `/api/conversations`
- POST `/api/conversations/direct`
- POST `/api/conversations/group`
- GET `/api/conversations/:id`
- GET `/api/conversations/:id/messages`
- POST `/api/conversations/:id/read`
- PATCH `/api/conversations/:id`
- DELETE `/api/conversations/:id`
- GET `/api/conversations/:id/members`
- POST `/api/conversations/:id/members`
- DELETE `/api/conversations/:id/members/:memberId`
- PATCH `/api/conversations/:id/members/:memberId/role`
- POST `/api/conversations/:id/transfer-ownership`

### Messages
- PATCH `/api/messages/:id`
- DELETE `/api/messages/:id`
- POST `/api/messages/:id/reactions`
- DELETE `/api/messages/:id/reactions?emoji=...`

### Socket events
- `conversation:join`
- `conversation:leave`
- `message:send`
- `message:edit`
- `message:delete`
- `reaction:add`
- `reaction:remove`
- `message:read`
- `typing:start`
- `typing:stop`
- `group:remove-member`

### Socket listeners
- `socket:ready`
- `presence:update`
- `message:new`
- `message:updated`
- `reaction:updated`
- `message:read`
- `typing:update`
- `member:removed`
- `conversation:removed`

## Important

The supplied backend ZIP has several JavaScript-conversion issues that must be fixed before the frontend can work. See the main ChatGPT response for the exact fixes.
