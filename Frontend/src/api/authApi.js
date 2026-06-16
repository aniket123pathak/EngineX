import axiosInstance from "../utils/axiosInstance";

/**
 * Register a new user.
 * @param {{ username: string, email: string, password: string }} payload
 * @returns {Promise<import("axios").AxiosResponse>}
 */
export const registerUser = (payload) => {
  return axiosInstance.post("/users/register", payload);
};

/**
 * Log in an existing user.
 * The backend sets HTTP-only cookies (accessToken, refreshToken) on success.
 * @param {{ email?: string, username?: string, password: string }} payload
 * @returns {Promise<import("axios").AxiosResponse>}
 */
export const loginUser = (payload) => {
  return axiosInstance.post("/users/login", payload);
};
