// src/utils/codeRunner.js

// ============================================================================
// MODULE IMPORTS (Node.js Built-in & External Libraries)
// ============================================================================

// 'fs' (File System) is a native Node.js module used to interact with your computer's hard drive.
// We use it to create folders, write code files, read test cases, and clean up afterwards.
import fs from "fs";

// 'path' is a native Node.js module that safely handles cross-platform file paths.
// Windows uses backslashes (\) and Mac/Linux use forward slashes (/). 'path' ensures it works everywhere.
import path from "path";

// 'exec' from 'child_process' allows Node.js to open a hidden terminal/shell instance 
// on your host machine and programmatically execute raw CLI commands (like 'docker run').
import { exec } from "child_process";

// 'uuid' is an external library that generates universally unique identifiers (e.g., '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed').
// We use version 4 (randomly generated) to create unique folder names for every single submission.
import { v4 as uuidv4 } from "uuid";


// ============================================================================
// HELPER FUNCTION: ASYNCHRONOUS PROCESS EXECUTION
// ============================================================================

/**
 * Executes a single test case inside a secure Docker container via STDIN.
 * * CONCEPT: Node's 'exec' function natively uses an old-school asynchronous callback mechanism.
 * We wrap it inside a JavaScript 'Promise' so we can use modern 'await' syntax up in the main loop.
 * * @param {string} dockerCommand - The exact shell command to spin up the container
 * @param {string} inputData - The raw text payload containing the hidden test case input
 * @returns {Promise<Object>} - Resolves with the container status and raw string output
 */
const runSingleTestCase = (dockerCommand, inputData) => {
    return new Promise((resolve, reject) => {
        // 'exec' spawns a shell and begins executing the docker command string.
        // It returns a handle to the running process, which we store in 'childProcess'.
        const childProcess = exec(dockerCommand, (error, stdout, stderr) => {
            
            // CASE 1: Runtime Error inside the user's code (e.g., Python SyntaxError, IndexError).
            // 'stderr' (Standard Error) captures internal application crashes.
            if (stderr) {
                // We resolve instead of reject because a user crashing their own code is a valid runtime result.
                resolve({ status: "RUNTIME_ERROR", output: stderr.trim() });
                return; // Stop execution of this callback
            }

            // CASE 2: External System/Docker failure (e.g., Docker service is down, or container exceeded memory limits).
            // 'error' captures shell failures, system interrupts, or non-zero exit codes from Docker itself.
            if (error) {
                resolve({ status: "EXECUTION_ERROR", output: error.message });
                return;
            }

            // CASE 3: Clean Execution.
            // 'stdout' (Standard Output) captures anything the user's script sent to the screen via 'print()'.
            // '.trim()' strips trailing newlines (\n) or extra spaces that could break comparisons.
            resolve({ status: "SUCCESS", output: stdout.trim() });
        });

        // PUSHING DATA VIA STDIN (Standard Input Pipe)
        // If this test case requires input, we must push it into the container before it finishes booting.
        if (inputData) {
            // Write the test case text directly into the running process's standard keyboard input stream
            childProcess.stdin.write(inputData);
            // Close the stream. This signals an 'EOF' (End of File) to Python, letting it know no more text is coming.
            childProcess.stdin.end();
        }
    });
};


// ============================================================================
// CORE ENGINE: CODEFORCES-STYLE SEQUENTIAL EVALUATION
// ============================================================================

/**
 * Core Evaluation Engine (Codeforces File-System Style)
 * * @param {string} problemSlug - The folder name of the target problem (e.g., "two_sum")
 * @param {string} userCode - The raw multi-line string containing the user's uploaded code
 * @returns {Promise<Object>} - The ultimate structural evaluation payload (Verdict, counts, breakdowns)
 */
export const evaluateSubmission = async (problemSlug, userCode) => {
    // 1. ARCHITECTING UNIQUE ISOLATION PATHS
    // Create a unique hash identifier for this specific grading thread.
    const submissionId = uuidv4();
    
    // 'path.resolve' computes the absolute physical path on your server's drive.
    // e.g., '/Users/aniket/backend/temp_workspace/a1b2c3d4...'
    const tempWorkspacePath = path.resolve("temp_workspace", submissionId);
    
    // Points directly to where the secret problem master sheets live.
    // e.g., '/Users/aniket/backend/problems/two_sum'
    const problemWorkspacePath = path.resolve("problems", problemSlug);

    // 2. ENFORCING DIRECTORY PREREQUISITES
    // Check if the master parent 'temp_workspace' directory exists. If it doesn't, create it.
    if (!fs.existsSync(path.resolve("temp_workspace"))) {
        fs.mkdirSync(path.resolve("temp_workspace"));
    }
    
    // Initialize the isolated sandboxed directory for this single evaluation event.
    // This stops User B's files from overwriting User A's files if they click submit at the exact same millisecond.
    fs.mkdirSync(tempWorkspacePath);

    // Define the uniform script filename inside the workspace.
    const userCodeFileName = "solution.py";
    
    // Physically write the user's untrusted text string onto the server's disk as an executable file.
    fs.writeFileSync(path.join(tempWorkspacePath, userCodeFileName), userCode);

    // Initialize arrays and state machine track-pads to record the run data.
    const testResults = [];
    let overallStatus = "ACCEPTED"; // Innocent until proven guilty baseline

    try {
        // 3. SCANNING AND SORTING FILE-BASED TEST CASES
        // Read every single filename inside the specific problem's folder.
        const allFiles = fs.readdirSync(problemWorkspacePath);
        
        // Filter out everything except files ending in '.in', and sort them alphabetically/numerically.
        // This guarantees test cases run in chronological sequence: '1.in', '2.in', '3.in'...
        const inputFiles = allFiles.filter(file => file.endsWith(".in")).sort();

        // 4. THE GRADIENT RUN LOOP
        // Iterate through each input test case file sequentially.
        for (const inFile of inputFiles) {
            // Split string at '.' and take first element. Extracts the identifier "1" out of "1.in"
            const testCaseNumber = inFile.split(".")[0]; 
            // Compute the matching expected output filename based on that identifier (e.g., "1.out")
            const outFile = `${testCaseNumber}.out`;

            // Read the raw content of the input test case file from disk using UTF-8 text encoding.
            const inputData = fs.readFileSync(path.join(problemWorkspacePath, inFile), "utf-8");
            
            // Read the expected correct answer file from disk and trim whitespaces.
            const expectedOutput = fs.readFileSync(path.join(problemWorkspacePath, outFile), "utf-8").trim();

            // 5. CONSTRUCTING THE DOCKER SANDBOX BARRIER (FAANG Security Architecture)
            // -i: Interactive mode (leaves STDIN open so 'runSingleTestCase' can pipe input data).
            // --rm: Self-destruct flag. Erases the container container-layer file layout instantly upon process exit.
            // --network none: Cuts off internal virtual network interface. Completely blocks internet access.
            // --memory="128m": Hard-caps container RAM at 128 Megabytes via Linux cgroups. Kills process if it breaks this threshold.
            // -v: Bind-mounts the temporary user folder into the container at path '/app'.
            // -w /app: Forces the container's shell terminal context to jump inside the '/app' folder on startup.
            // python:3.9-alpine: The lightweight base OS image containing the Python run environment.
            // python solution.py: The final executable binary command executed within the Linux container core.
            const dockerCommand = `docker run -i --rm --network none --memory="128m" -v "${tempWorkspacePath}:/app" -w /app python:3.9-alpine python ${userCodeFileName}`;

            // Trigger the execution helper and await the container response.
            const result = await runSingleTestCase(dockerCommand, inputData);

            let verdict = "ACCEPTED";
            
            // 6. VERDICT DETERMINATION ENGINE
            if (result.status === "RUNTIME_ERROR") {
                verdict = "RUNTIME_ERROR";
                overallStatus = "RUNTIME_ERROR";
            } else if (result.status === "EXECUTION_ERROR") {
                // If Docker exits with an unhandled error state, it usually means it hit a limit (like RAM).
                // In synchronous execution contexts, this safely maps directly to a Resource/Time constraint error.
                verdict = "TIME_LIMIT_EXCEEDED"; 
                overallStatus = "TIME_LIMIT_EXCEEDED";
            } else if (result.output !== expectedOutput) {
                // The sandbox ran clean, but the text outputs did not match down to the character.
                verdict = "WRONG_ANSWER";
                // Only modify overall status if we haven't already hit a fatal error in a previous test step.
                if (overallStatus === "ACCEPTED") overallStatus = "WRONG_ANSWER";
            }

            // Log individual metrics for this specific test case sequence index.
            testResults.push({
                testCase: testCaseNumber,
                verdict,
                expected: expectedOutput,
                got: result.output
            });

            // FAST-FAILURE PERFORMANCE OPTIMIZATION
            // If a code submission fails test case #2, there is zero business value in running it against the remaining cases.
            // We break out of the loop immediately, saving massive amounts of system CPU cycles.
            if (verdict !== "ACCEPTED") {
                break;
            }
        }

        // Return a clean evaluation object back to the caller.
        return {
            verdict: overallStatus,
            testCasesChecked: testResults.length,
            details: testResults
        };

    } catch (error) {
        // Catch unexpected global file failures, system faults, or disk authorization bugs.
        return {
            verdict: "SYSTEM_ERROR",
            message: error.message
        };
    } finally {
        // 7. CRITICAL CLEANUP STEP (The Garbage Collector)
        // The 'finally' block is mathematically guaranteed to run even if the try block throws an error or breaks early.
        // If we do not clean up, the server's hard drive will fill up with thousands of user code files within hours.
        if (fs.existsSync(tempWorkspacePath)) {
            // Recursive: true forces deletion of files inside the directory before removing the directory itself.
            // Force: true suppresses errors if the directory is already mysteriously missing.
            fs.rmSync(tempWorkspacePath, { recursive: true, force: true });
        }
    }
};