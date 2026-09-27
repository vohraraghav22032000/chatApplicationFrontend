export function formatTime(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function formatDate(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export function initials(name = "?") {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((x) => x[0]?.toUpperCase())
    .join("") || "?";
}

export function conversationTitle(conversation, currentUserId) {
  if (!conversation) return "";
  if (conversation.type === "GROUP") return conversation.name || "Group";
  return conversation.other_user?.name || conversation.otherUser?.name || "Direct chat";
}

export function conversationAvatar(conversation, currentUserId) {
  if (!conversation) return null;
  if (conversation.type === "GROUP") return conversation.avatar_url || conversation.avatarUrl;
  return conversation.other_user?.avatarUrl || conversation.otherUser?.avatarUrl;
}

export function mergeMessages(existing, incoming) {
  const map = new Map(existing.map((m) => [m.id, m]));
  for (const m of incoming) map.set(m.id, { ...map.get(m.id), ...m });
  return [...map.values()].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
}
