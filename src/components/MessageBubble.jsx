import { useState } from "react";
import { MoreHorizontal, Pencil, Trash2, SmilePlus, Check, CheckCheck } from "lucide-react";
import { messagesApi } from "../lib/api";
import { formatTime } from "../lib/helpers";

const EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🔥"];

export default function MessageBubble({
  message,
  own,
  currentUserId,
  conversation,
  onUpdated,
  readByUserIds = [],
}) {
  const [menu, setMenu] = useState(false);
  const [editing, setEditing] = useState(false);
  const [content, setContent] = useState(message.content || "");
  const [busy, setBusy] = useState(false);

  async function saveEdit() {
    if (!content.trim()) return;
    setBusy(true);
    try {
      const data = await messagesApi.edit(message.id, content.trim());
      onUpdated(data.message);
      setEditing(false);
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    try {
      const data = await messagesApi.remove(message.id);
      onUpdated(data.message);
      setMenu(false);
    } finally {
      setBusy(false);
    }
  }

  async function react(emoji) {
    const mine = (message.reactions || []).some(
      (r) => r.userId === currentUserId && r.emoji === emoji
    );
    const data = mine
      ? await messagesApi.removeReaction(message.id, emoji)
      : await messagesApi.addReaction(message.id, emoji);
    onUpdated(data.message);
  }

  const deleted = Boolean(message.deleted_at);

  return (
    <div className={`group flex ${own ? "justify-end" : "justify-start"}`}>
      <div className={`relative max-w-[82%] md:max-w-[70%] ${own ? "items-end" : "items-start"} flex flex-col`}>
        {!own && conversation?.type === "GROUP" && (
          <span className="mb-1 px-1 text-[11px] font-semibold text-slate-500">
            {message.sender_name}
          </span>
        )}

        {editing ? (
          <div className="w-72 rounded-2xl border border-indigo-300 bg-white p-2 shadow dark:bg-slate-800">
            <textarea
              autoFocus
              rows={3}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full resize-none bg-transparent p-2 outline-none"
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setEditing(false)} className="px-3 py-1.5 text-sm">Cancel</button>
              <button disabled={busy} onClick={saveEdit} className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm text-white">
                Save
              </button>
            </div>
          </div>
        ) : (
          <div className={`rounded-2xl px-4 py-2.5 ${
            own
              ? "rounded-br-md bg-indigo-600 text-white"
              : "rounded-bl-md bg-white text-slate-800 shadow-sm dark:bg-slate-800 dark:text-slate-100"
          }`}>
            {deleted ? (
              <span className="italic opacity-60">Message deleted</span>
            ) : (
              <>
                <p className="whitespace-pre-wrap break-words text-sm">{message.content}</p>
                <div className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${
                  own ? "text-indigo-100" : "text-slate-400"
                }`}>
                  {message.edited_at && <span>edited</span>}
                  <span>{formatTime(message.created_at)}</span>
                  {own && (readByUserIds.length > 0 ? <CheckCheck size={13} /> : <Check size={13} />)}
                </div>
              </>
            )}
          </div>
        )}

        {(message.reactions || []).length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {Array.from(
              new Map((message.reactions || []).map((r) => [r.emoji, r])).keys()
            ).map((emoji) => (
              <button
                key={emoji}
                onClick={() => react(emoji)}
                className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-xs shadow-sm dark:border-slate-700 dark:bg-slate-800"
              >
                {emoji} {(message.reactions || []).filter((r) => r.emoji === emoji).length}
              </button>
            ))}
          </div>
        )}

        {!deleted && (
          <div className="absolute -top-8 right-0 hidden items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-lg group-hover:flex dark:border-slate-700 dark:bg-slate-900">
            <div className="flex">
              {EMOJIS.map((emoji) => (
                <button key={emoji} onClick={() => react(emoji)} className="p-1.5 text-sm hover:bg-slate-100 dark:hover:bg-slate-800">
                  {emoji}
                </button>
              ))}
            </div>
            {own && (
              <>
                <button onClick={() => setEditing(true)} className="rounded-lg p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800">
                  <Pencil size={14} />
                </button>
                <button onClick={remove} disabled={busy} className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30">
                  <Trash2 size={14} />
                </button>
              </>
            )}
            <button onClick={() => setMenu(!menu)} className="rounded-lg p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800">
              <MoreHorizontal size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
