import { useState } from "react";
import { X } from "lucide-react";
import { conversationsApi } from "../lib/api";

export default function NewGroupModal({ onClose, onCreated }) {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const data = await conversationsApi.createGroup(name.trim());
      onCreated(data.conversation);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4">
      <form onSubmit={submit} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-bold">Create group</h2>
          <button type="button" onClick={onClose}><X /></button>
        </div>
        <input
          required
          minLength={1}
          maxLength={100}
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800"
          placeholder="Group name"
        />
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        <button
          disabled={busy}
          className="mt-5 w-full rounded-xl bg-indigo-600 px-4 py-3 font-semibold text-white disabled:opacity-50"
        >
          {busy ? "Creating..." : "Create group"}
        </button>
      </form>
    </div>
  );
}
