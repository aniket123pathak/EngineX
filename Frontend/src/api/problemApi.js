import axiosInstance from "../utils/axiosInstance";

/**
 * Fetch all problems (summary list).
 * @returns {Promise<import("axios").AxiosResponse>}
 */
export const getAllProblems = () => {
  return axiosInstance.get("/problems");
};

/**
 * Fetch a single problem by ID (full details + test cases).
 * @param {string} id
 * @returns {Promise<import("axios").AxiosResponse>}
 */
export const getProblemById = (id) => {
  return axiosInstance.get(`/problems/${id}`);
};

/**
 * Create a new problem (Admin only).
 * @param {Object} payload
 * @returns {Promise<import("axios").AxiosResponse>}
 */
export const createProblem = (payload) => {
  return axiosInstance.post("/problems/create", payload);
};
