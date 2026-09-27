const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:4000/api").replace(/\/$/, "");

let accessToken = null;
let refreshPromise = null;

export function setAccessToken(token) {
  accessToken = token || null;
}

export function getAccessToken() {
  return accessToken;
}

async function parseResponse(response) {
  if (response.status === 204) return null;
  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { message: text };
  }
  if (!response.ok) {
    const message =
      data?.error?.message ||
      data?.message ||
      `Request failed (${response.status})`;
    const error = new Error(message);
    error.status = response.status;
    error.payload = data;
    throw error;
  }
  return data;
}

async function rawRequest(path, options = {}, retry = true) {
  const headers = new Headers(options.headers || {});
  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    credentials: "include",
  });

  if (response.status === 401 && retry && path !== "/auth/refresh") {
    try {
      await refreshAccessToken();
      return rawRequest(path, options, false);
    } catch {
      setAccessToken(null);
    }
  }

  return parseResponse(response);
}

export async function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      credentials: "include",
    })
      .then(parseResponse)
      .then((data) => {
        setAccessToken(data.accessToken);
        return data;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

export async function api(path, options = {}) {
  return rawRequest(path, options, true);
}

export const authApi = {
  signup: (body) =>
    api("/auth/signup", { method: "POST", body: JSON.stringify(body) }),
  login: (body) =>
    api("/auth/login", { method: "POST", body: JSON.stringify(body) }),
  refresh: refreshAccessToken,
  logout: () => api("/auth/logout", { method: "POST" }),
  me: () => api("/auth/me"),
};

export const usersApi = {
  search: (q) => api(`/users/search?q=${encodeURIComponent(q)}`),
  get: (id) => api(`/users/${id}`),
};

export const conversationsApi = {
  list: () => api("/conversations"),
  get: (id) => api(`/conversations/${id}`),
  createDirect: (userId) =>
    api("/conversations/direct", {
      method: "POST",
      body: JSON.stringify({ userId }),
    }),
  createGroup: (name, avatarUrl = null) =>
    api("/conversations/group", {
      method: "POST",
      body: JSON.stringify({ name, avatarUrl }),
    }),
  messages: (id, cursor, limit = 30) => {
    const params = new URLSearchParams({ limit: String(limit) });
    if (cursor) params.set("cursor", cursor);
    return api(`/conversations/${id}/messages?${params}`);
  },
  markRead: (id, messageId) =>
    api(`/conversations/${id}/read`, {
      method: "POST",
      body: JSON.stringify({ messageId }),
    }),
  updateGroup: (id, body) =>
    api(`/conversations/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  deleteGroup: (id) => api(`/conversations/${id}`, { method: "DELETE" }),
  members: (id) => api(`/conversations/${id}/members`),
  addMembers: (id, userIds) =>
    api(`/conversations/${id}/members`, {
      method: "POST",
      body: JSON.stringify({ userIds }),
    }),
  removeMember: (id, memberId) =>
    api(`/conversations/${id}/members/${memberId}`, { method: "DELETE" }),
  setRole: (id, memberId, role) =>
    api(`/conversations/${id}/members/${memberId}/role`, {
      method: "PATCH",
      body: JSON.stringify({ role }),
    }),
  transferOwnership: (id, userId) =>
    api(`/conversations/${id}/transfer-ownership`, {
      method: "POST",
      body: JSON.stringify({ userId }),
    }),
};

export const messagesApi = {
  edit: (id, content) =>
    api(`/messages/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ content }),
    }),
  remove: (id) => api(`/messages/${id}`, { method: "DELETE" }),
  addReaction: (id, emoji) =>
    api(`/messages/${id}/reactions`, {
      method: "POST",
      body: JSON.stringify({ emoji }),
    }),
  removeReaction: (id, emoji) =>
    api(`/messages/${id}/reactions?emoji=${encodeURIComponent(emoji)}`, {
      method: "DELETE",
    }),
};
