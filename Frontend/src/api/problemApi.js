import axiosInstance from "../utils/axiosInstance";

export const getAllProblems = () => {
  return axiosInstance.get("/problems");
};

export const getProblemById = (id) => {
  return axiosInstance.get(`/problems/${id}`);
};

export const createProblem = (payload) => {
  return axiosInstance.post("/problems/create", payload);
};

export const deleteProblem = (id) => {
  return axiosInstance.delete(`/problems/${id}`);
};
