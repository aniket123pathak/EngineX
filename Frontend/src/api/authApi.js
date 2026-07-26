import axiosInstance from "../utils/axiosInstance";

export const registerUser = (payload) => {
  return axiosInstance.post("/users/register", payload);
};

export const loginUser = (payload) => {
  return axiosInstance.post("/users/login", payload);
};
