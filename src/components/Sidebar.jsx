import { useMemo, useState } from "react";
import {
  LogOut, MessageCirclePlus, UsersRound, Search, Settings, Moon, Sun
} from "lucide-react";
import Avatar from "./Avatar";
import SearchModal from "./SearchModal";
import NewGroupModal from "./NewGroupModal";
import { conversationTitle, conversationAvatar, formatTime } from "../lib/helpers";

export default function Sidebar({
  user,
  conversations,
  selectedId,
  onSelect,
  onAddConversation,
  onLogout,
  presence,
  dark,
  onToggleDark,
}) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [groupOpen, setGroupOpen] = useState(false);

  const sorted = useMemo(
    () => [...conversations].sort((a, b) => {
      const da = new Date(a.last_message_at || a.updated_at || 0).getTime();
      const db = new Date(b.last_message_at || b.updated_at || 0).getTime();
      return db - da;
    }),
    [conversations]
  );

  return (
    <>
      <aside className="flex h-full w-full flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 md:w-80">
        <div className="flex items-center justify-between border-b border-slate-200 p-4 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <Avatar name={user.name} src={user.avatarUrl} online />
            <div className="min-w-0">
              <p className="truncate font-semibold">{user.name}</p>
              <p className="truncate text-xs text-slate-500">Online</p>
            </div>
          </div>
          <div className="flex gap-1">
            <button title="Theme" onClick={onToggleDark} className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800">
              {dark ? <Sun size={17} /> : <Moon size={17} />}
            </button>
            <button title="Logout" onClick={onLogout} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
              <LogOut size={17} />
            </button>
          </div>
        </div>

        <div className="flex gap-2 p-3">
          <button onClick={() => setSearchOpen(true)} className="flex flex-1 items-center gap-2 rounded-xl bg-slate-100 px-3 py-2.5 text-sm text-slate-500 dark:bg-slate-800">
            <Search size={17} /> Search users
          </button>
          <button title="New group" onClick={() => setGroupOpen(true)} className="rounded-xl bg-indigo-600 p-2.5 text-white">
            <UsersRound size={18} />
          </button>
        </div>

        <div className="px-4 pb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
          Conversations
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-3">
          {sorted.length === 0 && (
            <div className="px-4 py-10 text-center text-sm text-slate-500">
              <MessageCirclePlus className="mx-auto mb-2" />
              Start a conversation.
            </div>
          )}
          {sorted.map((conversation) => {
            const title = conversationTitle(conversation, user.id);
            const avatar = conversationAvatar(conversation, user.id);
            const otherId = conversation.other_user?.id || conversation.otherUser?.id;
            const online = otherId ? presence[otherId]?.online : false;
            return (
              <button
                key={conversation.id}
                onClick={() => onSelect(conversation.id)}
                className={`mb-1 flex w-full items-center gap-3 rounded-xl p-3 text-left ${
                  selectedId === conversation.id
                    ? "bg-indigo-50 dark:bg-indigo-950/50"
                    : "hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                <Avatar name={title} src={avatar} online={online} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate font-semibold">{title}</p>
                    {conversation.last_message_at && (
                      <span className="shrink-0 text-[11px] text-slate-400">
                        {formatTime(conversation.last_message_at)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="truncate text-xs text-slate-500">
                      {conversation.last_message_content || "No messages yet"}
                    </p>
                    {Number(conversation.unread_count) > 0 && (
                      <span className="ml-auto grid h-5 min-w-5 place-items-center rounded-full bg-indigo-600 px-1.5 text-[10px] font-bold text-white">
                        {conversation.unread_count}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </aside>

      {searchOpen && (
        <SearchModal
          onClose={() => setSearchOpen(false)}
          onConversation={onAddConversation}
        />
      )}
      {groupOpen && (
        <NewGroupModal
          onClose={() => setGroupOpen(false)}
          onCreated={onAddConversation}
        />
      )}
    </>
  );
}
