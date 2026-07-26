import axiosInstance from "../utils/axiosInstance";

export const getUserProfile = () => {
  return axiosInstance.get("/users/profile");
};
