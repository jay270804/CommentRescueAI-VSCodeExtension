import { exec } from "child_process";
import * as vscode from "vscode";
import axios, { options } from "axios"

export function activate(context: vscode.ExtensionContext) {
  console.log(
    'Congratulations, your extension "commentrescueai" is now active!'
  );

//   const modelName = "deepseek-r1:8b";
  const modelName = "llama3.2";
//   const modelName = "codellama:7b";

//   const systemPrompt = `
// 		You are an expert code documentation specialist. Your task is to enhance the given code with comprehensive documentation while preserving its exact functionality.

// 		Requirements for documentation:
// 		1. Add detailed docstrings for all functions and classes following Google style format
// 		2. Include type hints where applicable
// 		3. Add strategic inline comments to explain:
// 		- Complex algorithms or business logic
// 		- Non-obvious design decisions
// 		- Performance implications
// 		- Edge cases and limitations
// 		- Input validation assumptions

// 		Guidelines:
// 		- Keep comments professional and concise
// 		- Avoid stating the obvious (e.g., "increment counter" for i++)
// 		- Focus on WHY rather than WHAT for complex logic
// 		- Document any important assumptions about inputs
// 		- Note any potential pitfalls or limitations
// 		- For public APIs, include usage examples in docstrings

// 		Important:
// 		- Do not modify any functional code
// 		- Only add or enhance comments and docstrings
// 		- Preserve all existing whitespace and formatting
// 		- Return only the documented code without any additional text
// 		- Do not wrap the response in any markdown code blocks
// 		- Do not include any explanations or thinking process in the output

// 		Example of expected output format:
// 		from typing import List...
// 		[rest of the enhanced code]
// 	`;

// const systemPrompt = `
// You are a code documentation expert. Your task is to:
// 1. Add comprehensive docstrings following Google format
// 2. Add strategic inline comments explaining complex logic:
//  		- Non-obvious design decisions
//  		- Performance implications
//  		- Edge cases and limitations
//  		- Input validation assumptions
// 3. Preserve exact code functionality and formatting
// 4. Return only the enhanced code with comments and docstrings added by you.

// Rules:
// - Add inline comments for non-obvious logic
// - Keep comments concise but informative
// - Explain WHY not WHAT in comments
// - Don't skip edge cases and important logic
// - Don't write any unit tests or extra code
// - Do not wrap the response in any markdown code blocks
// - Do not include any explanations or thinking process in the output
// - Do not send \`\`\`python ... \`\`\` in response
// `
const systemPrompt = `
You are a code documentation expert. Enhance Python code by:

Adding docstrings in Google format (include Args, Returns, Raises, edge cases, and assumptions).
Adding inline comments only for non-obvious logic (explain WHY, not WHAT).
Preserving exact code functionality and formatting.
Returning only the enhanced code with comments/docstrings.
Rules:
 - Inline comments for complex logic, design decisions, performance, edge cases, or assumptions.
 - Avoid commenting on simple or self-explanatory code.
 - No extra code, unit tests, or explanations.
 - Do not wrap output in markdown blocks.
 - Do not send \`\`\`python ... \`\`\` in response.

Example of expected output format:
from typing import List...
[rest of the enhanced code]
`

const disposable = vscode.commands.registerCommand(
    "commentrescueai.helloWorld",
    () => {
      vscode.window.showInformationMessage("Hello World from CommentRescueAI!");
    }
  );

  const aicomment = vscode.commands.registerCommand(
    "commentrescueai.addComment",
    async () => {

        const editor = vscode.window.activeTextEditor;
        if (!editor) return;

        const code = editor.document.getText();
        // const prompt = `[SYSTEM PROMPT]\n\n${code}`;
        const prompt = `${code}`;

        try {
          // Check if Ollama is running
          await axios.get("http://localhost:11434/api/tags");

          // Generate comments
		  const start = new Date().getTime();
		  vscode.window.showInformationMessage("CommentRescueAI: Commenting started, have coffee")
          const response = await axios.post(
			  "http://localhost:11434/api/generate",
			  {
				  model: modelName,
				  prompt: prompt,
				  system: systemPrompt,
				  stream: false,
				  options: {
					  num_gpu: 1,
					  numa: true,
					  tenssort: true,
					  cuda: true
					}
				}
			);
		let elapsed = (new Date().getTime() - start)/60000;
		vscode.window.showInformationMessage(`CommentRescueAI: Commenting completed, time: ${elapsed}`)

          var newCode = response.data.response;
			newCode = newCode.replace("```","")
			newCode = newCode.replace("python","")
          editor.edit((editBuilder) => {
            editBuilder.replace(
              new vscode.Range(0, 0, editor.document.lineCount, 0),
              newCode
            );
          });
        } catch (error) {
			if (error instanceof Error){
				vscode.window.showErrorMessage(`Ollama error: ${error.message}`);
			}
			else{
				vscode.window.showErrorMessage(`Unknown Error Occured`);
			}
        }
    }
);

  async function checkOllamaInstalled(): Promise<boolean> {
    try {
      await new Promise((resolve, reject) => {
        exec("ollama --version", (error) => {
          error ? reject(error) : resolve(true);
        });
      });
      return true;
    } catch (error) {
      vscode.window.showErrorMessage(
        "Ollama not found. Install it first from https://ollama.ai/",
        { modal: true }
      );
      return false;
    }
  }

  const ollamaSetup = vscode.commands.registerCommand(
    "commentrescueai.installModel",
    async () => {
      vscode.window.showInformationMessage(
        "CommentRescueAI: Checking Ollama installation."
      );
      if (!(await checkOllamaInstalled())) return;
      vscode.window.showInformationMessage("CommentRescueAI: Ollama found!");

      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: `Installing ${modelName} (3.8GB) via Ollama... Grab a coffee`,
          cancellable: false,
        },
        async (progress) => {
          return new Promise((resolve, reject) => {
            // Execute "ollama pull" command
            const process = exec(
              `ollama pull ${modelName}`,
              (error, stdout, stderr) => {
                if (error) {
                  vscode.window.showErrorMessage(
                    `CommentRescueAI: Failed to install model: ${error.message}`
                  );
                  reject(error);
                } else {
                  vscode.window.showInformationMessage(
                    `CommentRescueAI: Successfully installed ${modelName}!`
                  );
                  resolve(stdout);
                }
              }
            );

            // Stream output to VS Code output channel
            const outputChannel = vscode.window.createOutputChannel(
              "CodeCommentAI Ollama"
            );
            process.stdout?.on("data", (data) => outputChannel.append(data));
            process.stderr?.on("data", (data) => outputChannel.append(data));
          });
        }
      );
    }
  );

  context.subscriptions.push(disposable, aicomment, ollamaSetup);
}

export function deactivate() {}
