import Cookies from "js-cookie";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";

export interface ApiError {
  message: string;
}

export interface WebsiteTick {
  id: string;
  response_time_ms: number;
  status: "Up" | "Down" | "Unknow";
  createdAt: string;
  regionId: string;
  region?: {
    id: string;
    name: string;
  };
}

export interface Website {
  id: string;
  url: string;
  userId: string;
  timeAdded: string;
  ticks?: WebsiteTick[];
}

export interface WebsiteStatusResponse extends Website {
  ticks: WebsiteTick[];
}

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("betteruptime_token") || Cookies.get("auth_token") || null;
}

export function setStoredToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) {
    localStorage.setItem("betteruptime_token", token);
    Cookies.set("auth_token", token, { expires: 7, path: "/" });
  } else {
    localStorage.removeItem("betteruptime_token");
    Cookies.remove("auth_token", { path: "/" });
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");

  if (token) {
    headers.set("Authorization", token);
  }

  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let errorMsg = `Request failed with status ${res.status}`;
    try {
      const errData = await res.json();
      errorMsg = errData.message || errorMsg;
    } catch {
      const errText = await res.text();
      if (errText) errorMsg = errText;
    }
    throw new Error(errorMsg);
  }

  return res.json() as Promise<T>;
}

export const authApi = {
  signup: (username: string, password: string) =>
    request<{ id: string }>("/user/signup", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),
  signin: (username: string, password: string) =>
    request<{ jwt: string }>("/user/signin", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),
};

export const websiteApi = {
  list: () =>
    request<{ websites: Website[] }>("/website/websites"),
  create: (url: string) =>
    request<{ id: string }>("/website", {
      method: "POST",
      body: JSON.stringify({ url }),
    }),
  getStatus: (websiteId: string) =>
    request<WebsiteStatusResponse>(`/website/status/${websiteId}`),
  delete: (websiteId: string) =>
    request<{ message: string }>(`/website/${websiteId}`, {
      method: "DELETE",
    }),
};
