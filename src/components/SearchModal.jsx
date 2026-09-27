import { useEffect, useState } from "react";
import { Search, X, Loader2 } from "lucide-react";
import { usersApi, conversationsApi } from "../lib/api";
import Avatar from "./Avatar";

export default function SearchModal({ onClose, onConversation }) {
  const [q, setQ] = useState("");
  const [users, setUsers] = useState([]);
  const [busy, setBusy] = useState(false);
  const [starting, setStarting] = useState("");

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!q.trim()) {
        setUsers([]);
        return;
      }
      setBusy(true);
      try {
        const data = await usersApi.search(q.trim());
        setUsers(data.users || []);
      } catch {
        setUsers([]);
      } finally {
        setBusy(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [q]);

  async function startChat(userId) {
    setStarting(userId);
    try {
      const data = await conversationsApi.createDirect(userId);
      onConversation(data.conversation);
      onClose();
    } finally {
      setStarting("");
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl dark:bg-slate-900">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">Find a user</h2>
          <button onClick={onClose} className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800">
            <X size={18} />
          </button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-3 text-slate-400" size={18} />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800"
            placeholder="Search by name or email..."
          />
        </div>
        <div className="mt-4 max-h-80 overflow-y-auto">
          {busy && <Loader2 className="mx-auto animate-spin text-indigo-600" />}
          {!busy && q && users.length === 0 && (
            <p className="py-8 text-center text-sm text-slate-500">No users found.</p>
          )}
          {users.map((user) => (
            <button
              key={user.id}
              onClick={() => startChat(user.id)}
              disabled={starting === user.id}
              className="flex w-full items-center gap-3 rounded-xl p-3 text-left hover:bg-slate-50 disabled:opacity-50 dark:hover:bg-slate-800"
            >
              <Avatar name={user.name} src={user.avatarUrl || user.avatar_url} />
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{user.name}</p>
                <p className="truncate text-sm text-slate-500">{user.email}</p>
              </div>
              {starting === user.id && <Loader2 size={18} className="animate-spin" />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
