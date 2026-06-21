// src/utils/codeRunner.js

import fs from "fs";
import path from "path";
import { exec } from "child_process";
import { v4 as uuidv4 } from "uuid";
// ============================================================================
// LANGUAGE CONFIGURATION MAP
// ============================================================================

const LANGUAGE_CONFIG = {
    python: {
        extension: "py",
        image: "python:3.9-alpine",
        // Python runs the script directly
        runCommand: "python solution.py" 
    },
    javascript: {
        extension: "js",
        image: "node:18-alpine",
        // Node runs the script directly
        runCommand: "node solution.js" 
    },
    cpp: {
        extension: "cpp",
        image: "gcc:11", 
        // C++ is compiled language. We must compile it first, then execute the binary.
        runCommand: "g++ solution.cpp -o program && ./program" 
    }
};

// ============================================================================
// HELPER FUNCTION: ASYNCHRONOUS PROCESS EXECUTION
// ============================================================================

/**
 * Executes a single test case inside a secure Docker container via STDIN.
 * @param {string} dockerCommand - The exact shell command to spin up the container
 * @param {string} inputData - The raw text payload containing the hidden test case input
 * @param {number} timeLimit - The max execution time in milliseconds
 * @returns {Promise<Object>} - Resolves with the container status and raw string output
 */
// FIX 1: Added timeLimit parameter to the function signature
const runSingleTestCase = (dockerCommand, inputData, timeLimit) => {
    return new Promise((resolve, reject) => {
        
        // FIX 2: Replaced hardcoded 3000 with dynamic timeLimit
        const childProcess = exec(dockerCommand, { timeout: timeLimit }, (error, stdout, stderr) => {
            
            // FIX 3: Detect if Node.js forcefully killed Docker because of the time limit
            if (error && error.killed) {
                resolve({ status: "EXECUTION_ERROR", output: "TIME_LIMIT_EXCEEDED" });
                return;
            }

            // Runtime Error inside the user's code
            if (stderr) {
                resolve({ status: "RUNTIME_ERROR", output: stderr.trim() });
                return; 
            }

            // External System/Docker failure (Out of Memory, etc.)
            if (error) {
                resolve({ status: "EXECUTION_ERROR", output: error.message });
                return;
            }

            // Clean Execution
            resolve({ status: "SUCCESS", output: stdout.trim() });
        });

        if (inputData) {
            childProcess.stdin.write(inputData);
            childProcess.stdin.end();
        }
    });
};


// ============================================================================
// CORE ENGINE: CODEFORCES-STYLE SEQUENTIAL EVALUATION
// ============================================================================

// Add 'language' to the parameters
export const evaluateSubmission = async (problemSlug, userCode, language = "python", timeLimit = 3000, memoryLimit = 256) => {
    
    // 1. Fetch the correct configuration for the requested language
    const config = LANGUAGE_CONFIG[language];
    if (!config) {
        return { verdict: "SYSTEM_ERROR", message: `Language '${language}' is not supported.` };
    }

    const submissionId = uuidv4();
    const tempWorkspacePath = path.resolve("temp_workspace", submissionId);
    const problemWorkspacePath = path.resolve("problems", problemSlug);

    if (!fs.existsSync(path.resolve("temp_workspace"))) {
        fs.mkdirSync(path.resolve("temp_workspace"));
    }
    fs.mkdirSync(tempWorkspacePath);

    // 2. Use the dynamic file extension (e.g., solution.cpp or solution.js)
    const userCodeFileName = `solution.${config.extension}`;
    fs.writeFileSync(path.join(tempWorkspacePath, userCodeFileName), userCode);

    const testResults = [];
    let overallStatus = "ACCEPTED"; 

    try {
        const allFiles = fs.readdirSync(problemWorkspacePath);
        const inputFiles = allFiles
            .filter(file => file.endsWith(".in"))
            .sort((a, b) => parseInt(a) - parseInt(b)); 

        for (const inFile of inputFiles) {
            const testCaseNumber = inFile.split(".")[0]; 
            const outFile = `${testCaseNumber}.out`;

            const inputData = fs.readFileSync(path.join(problemWorkspacePath, inFile), "utf-8");
            const expectedOutput = fs.readFileSync(path.join(problemWorkspacePath, outFile), "utf-8").replace(/\r/g, "").trim();

            // 3. THE MAGIC LINE: Dynamically inject the Image and the Run Command
            // Notice we use `sh -c "${config.runCommand}"` so Docker handles the && operator for C++ perfectly.
            const dockerCommand = `docker run -i --rm --network none --memory="${memoryLimit}m" -v "${tempWorkspacePath}:/app" -w /app ${config.image} sh -c "${config.runCommand}"`;
            
            const result = await runSingleTestCase(dockerCommand, inputData, timeLimit);

            // ... (The rest of your exact grading logic stays completely the same)
            let verdict = "ACCEPTED";
            const cleanedOutput = result.output.replace(/\r/g, "").trim();
            
            if (result.status === "RUNTIME_ERROR") {
                verdict = "RUNTIME_ERROR";
                overallStatus = "RUNTIME_ERROR";
            } else if (result.status === "EXECUTION_ERROR") {
                verdict = result.output === "TIME_LIMIT_EXCEEDED" ? "TIME_LIMIT_EXCEEDED" : "MEMORY_LIMIT_EXCEEDED"; 
                overallStatus = verdict;
            } else if (cleanedOutput !== expectedOutput) {
                verdict = "WRONG_ANSWER";
                if (overallStatus === "ACCEPTED") overallStatus = "WRONG_ANSWER";
            }

            testResults.push({
                testCase: testCaseNumber,
                verdict,
                expected: expectedOutput,
                got: cleanedOutput
            });

            if (verdict !== "ACCEPTED") break;
        }

        return { verdict: overallStatus, testCasesChecked: testResults.length, details: testResults };

    } catch (error) {
        return { verdict: "SYSTEM_ERROR", message: error.message };
    } finally {
        if (fs.existsSync(tempWorkspacePath)) {
            fs.rmSync(tempWorkspacePath, { recursive: true, force: true });
        }
    }
};