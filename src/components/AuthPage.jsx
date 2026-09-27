import { useState } from "react";
import { MessageCircle, Loader2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function AuthPage() {
  const { login, signup } = useAuth();
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (mode === "login") await login(email, password);
      else await signup(name, email, password);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10 dark:bg-slate-950">
      <div className="mx-auto flex min-h-[80vh] max-w-md items-center">
        <form
          onSubmit={submit}
          className="w-full rounded-3xl bg-white p-8 shadow-soft dark:bg-slate-900"
        >
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-indigo-600 text-white">
              <MessageCircle size={28} />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              {mode === "login" ? "Welcome back" : "Create your account"}
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Realtime chat application
            </p>
          </div>

          {mode === "signup" && (
            <label className="mb-4 block">
              <span className="mb-1 block text-sm font-medium">Name</span>
              <input
                required
                minLength={2}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800"
                placeholder="Your name"
              />
            </label>
          )}

          <label className="mb-4 block">
            <span className="mb-1 block text-sm font-medium">Email</span>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800"
              placeholder="you@example.com"
            />
          </label>

          <label className="mb-5 block">
            <span className="mb-1 block text-sm font-medium">Password</span>
            <input
              required
              minLength={8}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800"
              placeholder="At least 8 characters"
            />
          </label>

          {error && (
            <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
              {error}
            </div>
          )}

          <button
            disabled={busy}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {busy && <Loader2 className="animate-spin" size={18} />}
            {mode === "login" ? "Login" : "Sign up"}
          </button>

          <button
            type="button"
            onClick={() => {
              setMode(mode === "login" ? "signup" : "login");
              setError("");
            }}
            className="mt-5 w-full text-sm font-medium text-indigo-600 hover:underline"
          >
            {mode === "login"
              ? "Need an account? Sign up"
              : "Already have an account? Login"}
          </button>
        </form>
      </div>
    </main>
  );
}
