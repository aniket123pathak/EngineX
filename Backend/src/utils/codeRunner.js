
import fs from "fs";
import path from "path";
import { exec } from "child_process";
import { v4 as uuidv4 } from "uuid";
const LANGUAGE_CONFIG = {
    python: {
        extension: "py",
        image: "python:3.9-alpine",
        runCommand: "python solution.py" 
    },
    javascript: {
        extension: "js",
        image: "node:18-alpine",
        runCommand: "node solution.js" 
    },
    cpp: {
        extension: "cpp",
        image: "gcc:11", 
        runCommand: "g++ solution.cpp -o program && ./program" 
    }
};
const runSingleTestCase = (dockerCommand, inputData, timeLimit, containerName) => {
    return new Promise((resolve) => {
        let isFinished = false;
        const timer = setTimeout(() => {
            if (isFinished) return;
            isFinished = true;
            exec(`docker rm -f ${containerName}`, () => {}); 
            resolve({ status: "EXECUTION_ERROR", output: "TIME_LIMIT_EXCEEDED" });
        }, timeLimit);
        const childProcess = exec(dockerCommand, (error, stdout, stderr) => {
            if (isFinished) return; 
            isFinished = true;
            clearTimeout(timer);
            if (error && error.code === 137) {
                return resolve({ status: "EXECUTION_ERROR", output: "MEMORY_LIMIT_EXCEEDED" });
            }
            if (stderr && stderr.includes("bad_alloc")) {
                return resolve({ status: "EXECUTION_ERROR", output: "MEMORY_LIMIT_EXCEEDED" });
            }
            if (stderr && stderr.toLowerCase().includes("error:")) {
                return resolve({ status: "COMPILATION_ERROR", output: stderr.trim() });
            }
            if (stderr) {
                return resolve({ status: "RUNTIME_ERROR", output: stderr.trim() });
            }
            if (error) {
                return resolve({ status: "SYSTEM_ERROR", output: error.message });
            }
            resolve({ status: "SUCCESS", output: stdout.trim() });
        });
        if (inputData) {
            childProcess.stdin.write(inputData);
            childProcess.stdin.end();
        }
    });
};
export const evaluateSubmission = async (problemSlug, userCode, language = "python", timeLimit = 1200, memoryLimit = 256) => {
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
            const containerName = `enginex-${submissionId}-${testCaseNumber}`;
            const dockerCommand = `docker run --name ${containerName} -i --rm --network none --memory="${memoryLimit}m" --memory-swap="${memoryLimit}m" -v "${tempWorkspacePath}:/app" -w /app ${config.image} sh -c "${config.runCommand}"`;
            const result = await runSingleTestCase(dockerCommand, inputData, timeLimit, containerName);
            let verdict = "ACCEPTED";
            const cleanedOutput = result.output.replace(/\r/g, "").trim();
            if (result.status === "COMPILATION_ERROR") {
                verdict = "COMPILATION_ERROR";
                overallStatus = "COMPILATION_ERROR";
            } else if (result.status === "RUNTIME_ERROR") {
                verdict = "RUNTIME_ERROR";
                overallStatus = "RUNTIME_ERROR";
            } else if (result.status === "EXECUTION_ERROR") {
                verdict = result.output; 
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