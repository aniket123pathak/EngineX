import axiosInstance from "../utils/axiosInstance";

export const getUserProfile = () => {
  return axiosInstance.get("/users/profile");
};

export const getLeaderboard = () => {
  return axiosInstance.get("/users/leaderboard");
};
