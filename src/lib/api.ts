import { API_BASE_URL } from "../config";

type ApiOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: any;
  token?: string | null;
};

export async function api<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const { method = "GET", body, token } = options;

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const contentType = res.headers.get("content-type") || "";
  const payload = contentType.includes("application/json")
    ? await res.json()
    : await res.text();

  
  if (!res.ok) {
    const message =
      typeof payload === "object" && payload?.message
        ? payload.message
        : "Request failed";

    const err: any = new Error(message);

 
    if (typeof payload === "object" && payload) {
      err.statusCode = payload.statusCode ?? res.status;
      err.status = payload.status ?? "error";
      err.data = payload.data ?? null;
      err.raw = payload;
    } else {
      err.statusCode = res.status;
      err.status = "error";
      err.data = null;
      err.raw = payload;
    }

    throw err;
  }


  if (
    typeof payload === "object" &&
    payload !== null &&
    "statusCode" in payload &&
    "status" in payload &&
    "message" in payload
  ) {
    const tl: any = payload;


    if (tl.data && typeof tl.data === "object") {
      return {
        ...tl.data,
        ok: tl.status === "success",
        message: tl.message,
        statusCode: tl.statusCode,
        status: tl.status,
      } as T;
    }

    return {
      ok: tl.status === "success",
      message: tl.message,
      statusCode: tl.statusCode,
      status: tl.status,
      data: tl.data ?? null,
    } as T;
  }

  // Old backend response format
  return payload as T;
}