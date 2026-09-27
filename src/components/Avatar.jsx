import { initials } from "../lib/helpers";

export default function Avatar({ name, src, size = "md", online = false }) {
  const sizes = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-12 w-12 text-base",
  };

  return (
    <div className="relative shrink-0">
      {src ? (
        <img
          src={src}
          alt=""
          className={`${sizes[size]} rounded-full object-cover bg-slate-200`}
        />
      ) : (
        <div
          className={`${sizes[size]} grid place-items-center rounded-full bg-indigo-600 font-semibold text-white`}
        >
          {initials(name)}
        </div>
      )}
      {online && (
        <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-emerald-500 dark:border-slate-900" />
      )}
    </div>
  );
}
