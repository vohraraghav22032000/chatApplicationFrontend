import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "./context/AuthContext";
import { conversationsApi, setAccessToken } from "./lib/api";
import { createSocket } from "./lib/socket";
import { mergeMessages } from "./lib/helpers";
import AuthPage from "./components/AuthPage";
import Sidebar from "./components/Sidebar";
import ChatWindow from "./components/ChatWindow";

function newClientMessageId() {
  if (crypto?.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export default function App() {
  const { user, booting, logout } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [messagesByConversation, setMessagesByConversation] = useState({});
  const [cursorByConversation, setCursorByConversation] = useState({});
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [connected, setConnected] = useState(false);
  const [presence, setPresence] = useState({});
  const [typing, setTyping] = useState({});
  const [dark, setDark] = useState(() => localStorage.getItem("chat-theme") === "dark");
  const socketRef = useRef(null);
  const joinedRef = useRef(new Set());

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("chat-theme", dark ? "dark" : "light");
  }, [dark]);

  const selected = useMemo(
    () => conversations.find((c) => c.id === selectedId) || null,
    [conversations, selectedId]
  );

  const messages = messagesByConversation[selectedId] || [];

  const refreshConversations = useCallback(async () => {
    const data = await conversationsApi.list();
    setConversations(data.conversations || []);
  }, []);

  const openConversation = useCallback(async (conversationId) => {
    setSelectedId(conversationId);
    if (!messagesByConversation[conversationId]) {
      setLoading(true);
      try {
        const data = await conversationsApi.messages(conversationId, null, 30);
        setMessagesByConversation((prev) => ({
          ...prev,
          [conversationId]: data.messages || [],
        }));
        setCursorByConversation((prev) => ({
          ...prev,
          [conversationId]: data.nextCursor || null,
        }));
      } finally {
        setLoading(false);
      }
    }

    const socket = socketRef.current;
    if (socket?.connected && !joinedRef.current.has(conversationId)) {
      socket.emit("conversation:join", conversationId, () => {});
      joinedRef.current.add(conversationId);
    }
  }, [messagesByConversation]);

  useEffect(() => {
    if (!user) return;
    let active = true;
    refreshConversations().catch(console.error);

    const timer = setInterval(() => refreshConversations().catch(() => {}), 30000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [user, refreshConversations]);

  useEffect(() => {
    if (!user) return;

    let cancelled = false;
    let socket;

    async function connect() {
      // Access token is held by the API layer. The refresh endpoint has already
      // populated it before this component is rendered.
      const tokenModule = await import("./lib/api");
      const token = tokenModule.getAccessToken();
      if (!token || cancelled) return;

      socket = createSocket(token);
      socketRef.current = socket;

      socket.on("connect", () => {
        setConnected(true);
        joinedRef.current.forEach((id) => {
          socket.emit("conversation:join", id, () => {});
        });
      });

      socket.on("disconnect", () => setConnected(false));

      socket.on("connect_error", (err) => {
        setConnected(false);
        if (/unauthorized/i.test(err.message || "")) {
          setAccessToken(null);
        }
      });

      socket.on("socket:ready", () => setConnected(true));

      socket.on("presence:update", (payload) => {
        setPresence((prev) => ({
          ...prev,
          [payload.userId]: {
            online: Boolean(payload.online),
            lastSeenAt: payload.lastSeenAt,
          },
        }));
      });

      socket.on("message:new", (message) => {
        setMessagesByConversation((prev) => ({
          ...prev,
          [message.conversation_id]: mergeMessages(prev[message.conversation_id] || [], [message]),
        }));
        refreshConversations().catch(() => {});
      });

      socket.on("message:updated", (message) => {
        setMessagesByConversation((prev) => ({
          ...prev,
          [message.conversation_id]: mergeMessages(prev[message.conversation_id] || [], [message]),
        }));
        refreshConversations().catch(() => {});
      });

      socket.on("reaction:updated", (message) => {
        setMessagesByConversation((prev) => ({
          ...prev,
          [message.conversation_id]: mergeMessages(prev[message.conversation_id] || [], [message]),
        }));
      });

      socket.on("typing:update", (payload) => {
        setTyping((prev) => {
          const current = { ...(prev[payload.conversationId] || {}) };
          if (payload.typing) current[payload.userId] = payload.name;
          else delete current[payload.userId];
          return { ...prev, [payload.conversationId]: current };
        });
      });

      socket.on("member:removed", (payload) => {
        if (payload.userId === user.id) {
          joinedRef.current.delete(payload.conversationId);
          if (selectedId === payload.conversationId) setSelectedId(null);
          refreshConversations().catch(() => {});
        }
      });

      socket.on("conversation:removed", (payload) => {
        joinedRef.current.delete(payload.conversationId);
        if (selectedId === payload.conversationId) setSelectedId(null);
        refreshConversations().catch(() => {});
      });

      socket.on("message:read", (payload) => {
        // Kept as a hook for live receipt UI; the current backend does not
        // return a full "seen by" list, so no guessed data is displayed.
      });
    }

    connect();

    return () => {
      cancelled = true;
      socket?.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [user, refreshConversations, selectedId]);

  // Rejoin selected conversation after a socket reconnect.
  useEffect(() => {
    if (!connected || !selectedId || !socketRef.current) return;
    if (!joinedRef.current.has(selectedId)) {
      socketRef.current.emit("conversation:join", selectedId, () => {});
      joinedRef.current.add(selectedId);
    }
  }, [connected, selectedId]);

  async function loadMore() {
    if (!selectedId || loadingMore || !cursorByConversation[selectedId]) return;
    setLoadingMore(true);
    try {
      const data = await conversationsApi.messages(
        selectedId,
        cursorByConversation[selectedId],
        30
      );
      setMessagesByConversation((prev) => ({
        ...prev,
        [selectedId]: mergeMessages(data.messages || [], prev[selectedId] || []),
      }));
      setCursorByConversation((prev) => ({
        ...prev,
        [selectedId]: data.nextCursor || null,
      }));
    } finally {
      setLoadingMore(false);
    }
  }

  function sendMessage(content) {
    if (!selectedId || !socketRef.current?.connected) return;
    const payload = {
      conversationId: selectedId,
      clientMessageId: newClientMessageId(),
      content,
    };
    socketRef.current.emit("message:send", payload, (result) => {
      if (!result?.ok && result?.error) {
        console.error(result.error);
      }
    });
  }

  function sendTyping(isTyping) {
    if (!selectedId || !socketRef.current?.connected) return;
    socketRef.current.emit(
      isTyping ? "typing:start" : "typing:stop",
      selectedId,
      () => {}
    );
  }

  const markRead = useCallback((messageId) => {
    if (!selectedId || !messageId) return;
    socketRef.current?.emit(
      "message:read",
      { conversationId: selectedId, messageId },
      () => {}
    );
  }, [selectedId]);

  function updateMessage(message) {
    setMessagesByConversation((prev) => ({
      ...prev,
      [message.conversation_id]: mergeMessages(prev[message.conversation_id] || [], [message]),
    }));
  }

  async function handleConversationAdded(conversation) {
    await refreshConversations();
    setSelectedId(conversation.id);
    await openConversation(conversation.id);
  }

  async function handleGroupChanged() {
    await refreshConversations();
    if (selectedId) {
      const data = await conversationsApi.get(selectedId);
      setConversations((prev) => prev.map((c) => c.id === selectedId ? { ...c, ...data.conversation } : c));
    }
  }

  function handleGroupDeleted(id) {
    setConversations((prev) => prev.filter((c) => c.id !== id));
    setSelectedId(null);
  }

  if (booting) {
    return <div className="grid h-full min-h-screen place-items-center bg-slate-100 dark:bg-slate-950">Loading…</div>;
  }

  if (!user) return <AuthPage />;

  const typingUsers = Object.values(typing[selectedId] || {});
  const otherUserId = selected?.other_user?.id || selected?.otherUser?.id;

  return (
    <main className="h-screen overflow-hidden bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="flex h-full">
        <div className={`${selectedId ? "hidden md:flex" : "flex"} w-full md:w-80`}>
          <Sidebar
            user={user}
            conversations={conversations}
            selectedId={selectedId}
            onSelect={openConversation}
            onAddConversation={handleConversationAdded}
            onLogout={logout}
            presence={presence}
            dark={dark}
            onToggleDark={() => setDark((v) => !v)}
          />
        </div>
        <div className={`${selectedId ? "flex" : "hidden md:flex"} min-w-0 flex-1`}>
          <ChatWindow
            conversation={selected}
            messages={messages}
            loading={loading}
            loadingMore={loadingMore}
            hasMore={Boolean(cursorByConversation[selectedId])}
            onLoadMore={loadMore}
            onSend={sendMessage}
            onUpdated={updateMessage}
            onRead={markRead}
            onTyping={sendTyping}
            typingUsers={typingUsers}
            online={Boolean(otherUserId && presence[otherUserId]?.online)}
            currentUser={user}
            onBack={() => setSelectedId(null)}
            onGroupChanged={handleGroupChanged}
            onGroupDeleted={handleGroupDeleted}
            connected={connected}
          />
        </div>
      </div>
    </main>
  );
}
