import axiosInstance from "../utils/axiosInstance";

export const getAllProblems = () => {
  return axiosInstance.get("/problems");
};

export const getProblemById = (id) => {
  return axiosInstance.get(`/problems/${id}`);
};

/**
 * @param {Object} payload
 * @param {string} payload.title
 * @param {string} payload.description
 * @param {string} payload.difficulty
 * @param {number} payload.timeLimit
 * @param {number} payload.memoryLimit
 * @param {Array}  payload.testCases
 * @param {boolean} payload.isPrivate
 */
export const createProblem = (payload) => {
  return axiosInstance.post("/problems/create", payload);
};

export const deleteProblem = (id) => {
  return axiosInstance.delete(`/problems/${id}`);
};
