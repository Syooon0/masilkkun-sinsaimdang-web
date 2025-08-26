// src/api/baseApi.js
import axios from "axios";

const baseApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true, // refresh 토큰이 httpOnly 쿠키에 있을 경우 필요
});

// 요청 인터셉터: 저장소에서 accessToken 읽어서 헤더에 실어주기
baseApi.interceptors.request.use((config) => {
  // sessionStorage 우선으로 토큰 확인
  const token =
    sessionStorage.getItem("accessToken") ||
    localStorage.getItem("accessToken");

  if (token) {
    // JWT 토큰 기본 검증 (점으로 구분된 3부분)
    const isValidJWT = token.split(".").length === 3;

    if (isValidJWT) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      localStorage.removeItem("accessToken");
      sessionStorage.removeItem("accessToken");
      console.warn("Invalid JWT token removed");
    }
  }

  return config;
});

// 응답 인터셉터: 401이면 한 번만 /auth/refresh 시도 후 재시도
let isRefreshing = false;
let pendingQueue = [];

function processQueue(err, token = null) {
  pendingQueue.forEach((p) => (err ? p.reject(err) : p.resolve(token)));
  pendingQueue = [];
}

baseApi.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;

    // 이미 한 번 리트라이했으면 포기
    if (error?.response?.status !== 401 || original._retry) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      // refresh 중이면 줄 세워서 끝나면 재요청
      return new Promise((resolve, reject) => {
        pendingQueue.push({
          resolve: (token) => {
            original.headers.Authorization = `Bearer ${token}`;
            resolve(baseApi(original));
          },
          reject,
        });
      });
    }

    original._retry = true;
    isRefreshing = true;

    try {
      // 서버는 httpOnly 쿠키의 refresh 토큰으로 새 accessToken을 내려주는 것으로 가정
      const { data } = await axios.post(
        `${import.meta.env.VITE_API_URL}/auth/refresh`,
        {},
        { withCredentials: true }
      );

      const newAccess = data?.accessToken;
      if (!newAccess) throw new Error("No accessToken in refresh response");

      // 저장소에 기존 정책 유지: localStorage 우선 존재하면 localStorage에, 아니면 sessionStorage에 갱신
      if (localStorage.getItem("accessToken") !== null) {
        localStorage.setItem("accessToken", newAccess);
      } else {
        sessionStorage.setItem("accessToken", newAccess);
      }

      processQueue(null, newAccess);
      original.headers.Authorization = `Bearer ${newAccess}`;
      return baseApi(original);
    } catch (e) {
      processQueue(e, null);
      // 완전 로그아웃
      localStorage.removeItem("accessToken");
      sessionStorage.removeItem("accessToken");
      return Promise.reject(e);
    } finally {
      isRefreshing = false;
    }
  }
);

export default baseApi;
