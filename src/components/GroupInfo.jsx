import { useEffect, useState } from "react";
import { X, UserPlus, Shield, ShieldOff, UserMinus, Crown, Trash2 } from "lucide-react";
import { conversationsApi, usersApi } from "../lib/api";
import Avatar from "./Avatar";

export default function GroupInfo({ conversation, currentUser, onClose, onChanged, onRemoved }) {
  const [members, setMembers] = useState(conversation.members || []);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [busy, setBusy] = useState(false);
  // The conversation list returns the signed-in user's role as `role`;
  // the detail endpoint returns it as `currentRole`.
  const role = conversation.currentRole || conversation.role;
  const canManage = role === "OWNER" || role === "ADMIN";

  useEffect(() => {
    setMembers(conversation.members || []);
  }, [conversation]);

  useEffect(() => {
    let active = true;
    conversationsApi.get(conversation.id)
      .then((data) => {
        if (active) setMembers(data.conversation.members || []);
      })
      .catch(() => {});
    return () => { active = false; };
  }, [conversation.id]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!search.trim()) {
        setResults([]);
        return;
      }
      try {
        const data = await usersApi.search(search.trim());
        setResults(data.users || []);
      } catch {
        setResults([]);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);

  async function add(userId) {
    await conversationsApi.addMembers(conversation.id, [userId]);
    const data = await conversationsApi.members(conversation.id);
    setMembers(data.members);
    setSearch("");
    setResults([]);
    onChanged();
  }

  async function remove(memberId) {
    if (!confirm("Remove this member?")) return;
    await conversationsApi.removeMember(conversation.id, memberId);
    setMembers((m) => m.filter((x) => x.id !== memberId && x.user_id !== memberId));
    onChanged();
  }

  async function toggleRole(member) {
    const memberId = member.id || member.user_id;
    const next = member.role === "ADMIN" ? "MEMBER" : "ADMIN";
    await conversationsApi.setRole(conversation.id, memberId, next);
    const data = await conversationsApi.members(conversation.id);
    setMembers(data.members);
    onChanged();
  }

  async function transfer(memberId) {
    if (!confirm("Transfer ownership to this member?")) return;
    await conversationsApi.transferOwnership(conversation.id, memberId);
    onChanged();
  }

  async function deleteGroup() {
    if (!confirm("Delete this group and its messages?")) return;
    await conversationsApi.deleteGroup(conversation.id);
    onRemoved(conversation.id);
    onClose();
  }

  return (
    <aside className="absolute inset-y-0 right-0 z-30 flex w-full max-w-sm flex-col border-l border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900 md:relative md:w-80">
      <div className="flex items-center justify-between border-b border-slate-200 p-4 dark:border-slate-800">
        <div>
          <h2 className="font-bold">Group info</h2>
          <p className="text-xs text-slate-500">{members.length} members</p>
        </div>
        <button onClick={onClose}><X /></button>
      </div>

      <div className="border-b border-slate-200 p-4 dark:border-slate-800">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          disabled={!canManage}
          className="w-full rounded-xl border border-slate-200 bg-transparent px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:border-slate-700"
          placeholder={canManage ? "Add members..." : "Only admins can add"}
        />
        {results.length > 0 && (
          <div className="mt-2 rounded-xl border border-slate-200 p-1 dark:border-slate-700">
            {results.slice(0, 6).map((user) => (
              <button key={user.id} onClick={() => add(user.id)} className="flex w-full items-center gap-2 rounded-lg p-2 text-left hover:bg-slate-100 dark:hover:bg-slate-800">
                <Avatar name={user.name} src={user.avatarUrl || user.avatar_url} size="sm" />
                <span className="text-sm">{user.name}</span>
                <UserPlus className="ml-auto" size={15} />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        {members.map((member) => {
          const id = member.id || member.user_id;
          const name = member.name || member.email || id;
          return (
            <div key={id} className="mb-2 flex items-center gap-3 rounded-xl p-2">
              <Avatar name={name} src={member.avatarUrl || member.avatar_url} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{name}</p>
                <p className="text-[11px] uppercase text-slate-400">{member.role}</p>
              </div>
              {member.role === "OWNER" && <Crown size={15} className="text-amber-500" />}
              {role === "OWNER" && member.role !== "OWNER" && (
                <>
                  <button title="Toggle admin" onClick={() => toggleRole(member)} className="rounded-lg p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800">
                    {member.role === "ADMIN" ? <ShieldOff size={15} /> : <Shield size={15} />}
                  </button>
                  <button title="Transfer ownership" onClick={() => transfer(id)} className="rounded-lg p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800">
                    <Crown size={15} />
                  </button>
                </>
              )}
              {canManage && member.role !== "OWNER" && id !== currentUser.id && (
                <button title="Remove" onClick={() => remove(id)} className="rounded-lg p-1.5 text-red-500 hover:bg-red-50">
                  <UserMinus size={15} />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {role === "OWNER" && (
        <div className="border-t border-slate-200 p-4 dark:border-slate-800">
          <button onClick={deleteGroup} className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 dark:bg-red-950/30">
            <Trash2 size={16} /> Delete group
          </button>
        </div>
      )}
    </aside>
  );
}
