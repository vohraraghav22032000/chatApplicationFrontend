import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Info, Send, Loader2, Wifi, WifiOff } from "lucide-react";
import Avatar from "./Avatar";
import MessageBubble from "./MessageBubble";
import GroupInfo from "./GroupInfo";
import { conversationTitle, conversationAvatar, formatDate } from "../lib/helpers";

export default function ChatWindow({
  conversation,
  messages,
  loading,
  loadingMore,
  hasMore,
  onLoadMore,
  onSend,
  onUpdated,
  onRead,
  onTyping,
  typingUsers,
  online,
  currentUser,
  onBack,
  onGroupChanged,
  onGroupDeleted,
  connected,
}) {
  const [text, setText] = useState("");
  const [showInfo, setShowInfo] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const typingTimer = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, conversation?.id]);

  useEffect(() => {
    const last = messages[messages.length - 1];
    if (last && last.sender_id !== currentUser.id) onRead(last.id);
  }, [messages, currentUser.id, onRead]);

  function submit(e) {
    e.preventDefault();
    if (!text.trim()) return;
    onSend(text.trim());
    setText("");
    onTyping(false);
  }

  function handleInput(e) {
    setText(e.target.value);
    onTyping(true);
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => onTyping(false), 1000);
  }

  if (!conversation) {
    return (
      <section className="hidden flex-1 items-center justify-center bg-slate-50 md:flex dark:bg-slate-950">
        <div className="text-center text-slate-500">
          <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-indigo-100 text-indigo-600">💬</div>
          <p className="font-semibold">Select a conversation</p>
          <p className="mt-1 text-sm">Choose a chat from the sidebar.</p>
        </div>
      </section>
    );
  }

  const title = conversationTitle(conversation, currentUser.id);
  const avatar = conversationAvatar(conversation, currentUser.id);

  return (
    <section className="relative flex min-w-0 flex-1 flex-col bg-slate-100 dark:bg-slate-950">
      <header className="flex min-h-[68px] items-center gap-3 border-b border-slate-200 bg-white px-3 py-3 dark:border-slate-800 dark:bg-slate-900">
        <button className="rounded-lg p-2 md:hidden" onClick={onBack}><ArrowLeft size={19} /></button>
        <Avatar name={title} src={avatar} online={conversation.type === "DIRECT" && online} />
        <div className="min-w-0 flex-1">
          <h2 className="truncate font-bold">{title}</h2>
          <p className="truncate text-xs text-slate-500">
            {conversation.type === "GROUP"
              ? `${conversation.members?.length || 0} members`
              : online ? "Online" : "Offline"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {connected ? <Wifi size={17} className="text-emerald-500" title="Connected" /> : <WifiOff size={17} className="text-red-500" title="Reconnecting" />}
          {conversation.type === "GROUP" && (
            <button onClick={() => setShowInfo(true)} className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800">
              <Info size={18} />
            </button>
          )}
        </div>
      </header>

      {!connected && (
        <div className="bg-amber-100 px-4 py-2 text-center text-xs font-medium text-amber-800">
          Reconnecting… messages will sync automatically.
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4 md:px-6">
        {hasMore && (
          <div className="mb-4 text-center">
            <button
              disabled={loadingMore}
              onClick={onLoadMore}
              className="rounded-full bg-white px-4 py-2 text-xs font-semibold shadow-sm dark:bg-slate-800"
            >
              {loadingMore ? "Loading…" : "Load older messages"}
            </button>
          </div>
        )}

        {loading ? (
          <div className="grid h-full place-items-center"><Loader2 className="animate-spin text-indigo-600" /></div>
        ) : (
          <div className="space-y-3">
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                own={message.sender_id === currentUser.id}
                currentUserId={currentUser.id}
                conversation={conversation}
                onUpdated={onUpdated}
              />
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      <div className="min-h-7 px-4 text-xs text-slate-500">
        {typingUsers.length > 0 && (
          <span>{typingUsers.join(", ")} {typingUsers.length === 1 ? "is" : "are"} typing…</span>
        )}
      </div>

      <form onSubmit={submit} className="border-t border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex max-w-5xl items-end gap-2">
          <textarea
            ref={inputRef}
            value={text}
            onChange={handleInput}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit(e);
              }
            }}
            rows={1}
            className="max-h-32 min-h-11 flex-1 resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800"
            placeholder="Type a message…"
          />
          <button className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-indigo-600 text-white hover:bg-indigo-700">
            <Send size={18} />
          </button>
        </div>
      </form>

      {showInfo && (
        <GroupInfo
          conversation={conversation}
          currentUser={currentUser}
          onClose={() => setShowInfo(false)}
          onChanged={onGroupChanged}
          onRemoved={onGroupDeleted}
        />
      )}
    </section>
  );
}
