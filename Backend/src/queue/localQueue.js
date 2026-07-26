// src/queue/localQueue.js
import { Submission } from "../models/submission.model.js";
import { evaluateSubmission } from "../utils/codeRunner.js";

// 1. The pure Data Structure (Array)
const queue = [];

// 2. A flag to track if our single "Checkout Lane" is currently busy
let isProcessing = false;

/**
 * Adds a new job to the back of the line.
 */
export const addJobToQueue = (jobData) => {
    queue.push(jobData);
    console.log(`📥 Job added. Queue length is now: ${queue.length}`);
    
    // THE MAGIC: If the worker is asleep (not processing), wake it up!
    if (!isProcessing) {
        processQueue();
    }
};

/**
 * The Worker Loop: Pulls one job, finishes it, then calls itself again.
 */
const processQueue = async () => {
    // Base Case: If the line is empty, the worker goes to sleep.
    if (queue.length === 0) {
        isProcessing = false;
        console.log("💤 Queue empty. Worker going to sleep.");
        return;
    }

    // Lock the worker so new submissions just wait in the array
    isProcessing = true;
    
    // Pull the oldest job from the front of the array (FIFO)
    const job = queue.shift(); 
    const { submissionId, problemId, code, language, timeLimit, memoryLimit } = job;
    
    console.log(`\n⚙️ [WORKER] Processing submission ${submissionId}`);

    try {
        // Run Docker (Wait for it to completely finish)
        const evaluation = await evaluateSubmission(
            problemId.toString(), 
            code, 
            language, 
            timeLimit, 
            memoryLimit
        );

        // Update Database
        await Submission.findByIdAndUpdate(submissionId, {
            status: evaluation.verdict,
            testCasesPassed: evaluation.testCasesChecked || 0
        });
        
        console.log(`✅ [WORKER] Finished submission ${submissionId} | Verdict: ${evaluation.verdict}`);

    } catch (error) {
        console.error(`❌ [WORKER] Error on submission ${submissionId}:`, error);
        await Submission.findByIdAndUpdate(submissionId, { status: "SYSTEM_ERROR" });
    }

    // 🔁 RECURSION: We finished this job, now immediately process the next one!
    processQueue();
};