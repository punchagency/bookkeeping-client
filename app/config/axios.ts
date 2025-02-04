import axios from "axios";

export const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

const getAccessToken = () => localStorage.getItem("accessToken");
const setAuthHeader = (token: string | null) => {
  if (token) {
    axiosInstance.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete axiosInstance.defaults.headers.common["Authorization"];
  }
};

axiosInstance.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const response = await axios.post("/api/auth/reset-token");

      if (response.status == 200) {
        window.location.href = "/auth/login";
      } else {
        window.location.href = "/auth/logout";
      }
    }
    return Promise.reject(error);
  }
);

export const loginUser = (token: string) => {
  localStorage.setItem("accessToken", token);
  setAuthHeader(token);
};

export const logoutUser = () => {
  localStorage.removeItem("accessToken");
  setAuthHeader(null);
};
