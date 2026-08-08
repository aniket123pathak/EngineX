import axiosInstance from "../utils/axiosInstance";

export const getContests = () => {
  return axiosInstance.get("/contests");
};

export const createContest = (payload) => {
  return axiosInstance.post("/contests", payload);
};

export const getContestById = (id) => {
  return axiosInstance.get(`/contests/${id}`);
};

export const registerContest = (id, payload) => {
  return axiosInstance.post(`/contests/${id}/register`, payload);
};

export const addProblemToContest = (id, payload) => {
  return axiosInstance.post(`/contests/${id}/problems`, payload);
};

export const removeProblemFromContest = (id, problemId) => {
  return axiosInstance.delete(`/contests/${id}/problems/${problemId}`);
};
