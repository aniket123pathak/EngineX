
import { Submission } from "../models/submission.model.js";
import { evaluateSubmission } from "../utils/codeRunner.js";
const queue = [];
let isProcessing = false;
export const addJobToQueue = (jobData) => {
    queue.push(jobData);
    console.log(`📥 Job added. Queue length is now: ${queue.length}`);
    if (!isProcessing) {
        processQueue();
    }
};
const processQueue = async () => {
    if (queue.length === 0) {
        isProcessing = false;
        console.log("💤 Queue empty. Worker going to sleep.");
        return;
    }
    isProcessing = true;
    const job = queue.shift(); 
    const { submissionId, problemId, code, language, timeLimit, memoryLimit } = job;
    console.log(`\n⚙️ [WORKER] Processing submission ${submissionId}`);
    try {
        const evaluation = await evaluateSubmission(
            problemId.toString(), 
            code, 
            language, 
            timeLimit, 
            memoryLimit
        );
        await Submission.findByIdAndUpdate(submissionId, {
            status: evaluation.verdict,
            testCasesPassed: evaluation.testCasesChecked || 0
        });
        console.log(`✅ [WORKER] Finished submission ${submissionId} | Verdict: ${evaluation.verdict}`);
    } catch (error) {
        console.error(`❌ [WORKER] Error on submission ${submissionId}:`, error);
        await Submission.findByIdAndUpdate(submissionId, { status: "SYSTEM_ERROR" });
    }
    processQueue();
};