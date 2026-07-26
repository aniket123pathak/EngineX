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
 * @param {string} containerName - The unique name of the container to allow force-killing
 * @returns {Promise<Object>} - Resolves with the container status and raw string output
 */
const runSingleTestCase = (dockerCommand, inputData, timeLimit, containerName) => {
    return new Promise((resolve) => {
        let isFinished = false;

        // ⏱️ THE STOPWATCH (For TLE)
        const timer = setTimeout(() => {
            if (isFinished) return;
            isFinished = true;
            exec(`docker rm -f ${containerName}`, () => {}); 
            resolve({ status: "EXECUTION_ERROR", output: "TIME_LIMIT_EXCEEDED" });
        }, timeLimit);

        // 🐳 DOCKER EXECUTION
        const childProcess = exec(dockerCommand, (error, stdout, stderr) => {
            if (isFinished) return; 
            isFinished = true;
            clearTimeout(timer);

            // 1. Memory Limit Exceeded (Docker OOM Killer Exit Code 137)
            if (error && error.code === 137) {
                return resolve({ status: "EXECUTION_ERROR", output: "MEMORY_LIMIT_EXCEEDED" });
            }

            // 2. Catch C++ memory allocation exceptions as MLE
            if (stderr && stderr.includes("bad_alloc")) {
                return resolve({ status: "EXECUTION_ERROR", output: "MEMORY_LIMIT_EXCEEDED" });
            }

            // 3. Compilation Errors (g++ uses "error:" for syntax issues)
            if (stderr && stderr.toLowerCase().includes("error:")) {
                return resolve({ status: "COMPILATION_ERROR", output: stderr.trim() });
            }

            // 4. True Runtime Errors (Segfaults, div by zero, etc.)
            if (stderr) {
                return resolve({ status: "RUNTIME_ERROR", output: stderr.trim() });
            }

            // 5. Other Docker/System Errors
            if (error) {
                return resolve({ status: "SYSTEM_ERROR", output: error.message });
            }
            
            // 6. Clean Execution
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

export const evaluateSubmission = async (problemSlug, userCode, language = "python", timeLimit = 1200, memoryLimit = 256) => {
    
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

            // Generate a unique name
            const containerName = `enginex-${submissionId}-${testCaseNumber}`;

            // Add --name ${containerName} to the command
            const dockerCommand = `docker run --name ${containerName} -i --rm --network none --memory="${memoryLimit}m" --memory-swap="${memoryLimit}m" -v "${tempWorkspacePath}:/app" -w /app ${config.image} sh -c "${config.runCommand}"`;
            
            const result = await runSingleTestCase(dockerCommand, inputData, timeLimit, containerName);

            let verdict = "ACCEPTED";
            const cleanedOutput = result.output.replace(/\r/g, "").trim();
            
            // FIX 2: Map the new COMPILATION_ERROR status
            if (result.status === "COMPILATION_ERROR") {
                verdict = "COMPILATION_ERROR";
                overallStatus = "COMPILATION_ERROR";
            } else if (result.status === "RUNTIME_ERROR") {
                verdict = "RUNTIME_ERROR";
                overallStatus = "RUNTIME_ERROR";
            } else if (result.status === "EXECUTION_ERROR") {
                verdict = result.output; // This will be TLE or MLE
                overallStatus = verdict;
            } else if (result.status === "SYSTEM_ERROR") {
                verdict = "SYSTEM_ERROR";
                overallStatus = "SYSTEM_ERROR";
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