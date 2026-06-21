import axiosInstance from "../utils/axiosInstance";

/**
 * Submit code for a problem to be evaluated.
 * @param {{ problemId: string, language: string, code: string }} payload
 * @returns {Promise<import("axios").AxiosResponse>}
 */
export const submitCode = (payload) => {
  return axiosInstance.post("/submissions/submit", payload);
};
