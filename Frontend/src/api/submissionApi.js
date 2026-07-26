import axiosInstance from "../utils/axiosInstance";

export const submitCode = (payload) => {
  return axiosInstance.post("/submissions/submit", payload);
};

export const getSubmissionById = (submissionId) => {
  return axiosInstance.get(`/submissions/${submissionId}`);
};
