const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

export function token() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("pop_token");
}

export async function api(path: string, options: RequestInit = {}) {
  const t = token();
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(t ? { Authorization: `Bearer ${t}` } : {}),
      ...(options.headers || {}),
    },
    cache: "no-store",
  });

  const data = await res.json().catch(() => ({ message: "Unexpected server response" }));
  if (!res.ok) {
    let msg = data.message || "Request failed";
    if (typeof msg === "string" && (msg.trim().startsWith("[") || msg.trim().startsWith("{"))) {
      try {
        const parsed = JSON.parse(msg);
        if (Array.isArray(parsed)) {
          msg = parsed
            .map((item: any) => {
              const field = Array.isArray(item.path) && item.path.length
                ? `${item.path.join(".")}: `
                : "";
              return `${field}${item.message || "Invalid input"}`;
            })
            .join(". ");
        } else if (parsed.message) {
          msg = parsed.message;
        }
      } catch {
        // Keep original string if parsing fails
      }
    }
    throw new Error(msg);
  }
  return data;
}
