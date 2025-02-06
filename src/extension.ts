import { exec } from "child_process";
import * as vscode from "vscode";
import axios from "axios"
import { BASE_URL, MODEL_NAME, SYSTEM_PROMPT, INSTALL_PROGRESS_TITLE, ERROR_MESSAGES, OLLAMA_GPU_OPTIONS, MODEL_SIZE } from "./constants";
export function activate(context: vscode.ExtensionContext) {
  console.log(
    'Congratulations, your extension "commentrescueai" is now active!'
  );

const aicomment = vscode.commands.registerCommand(
  "commentrescueai.addComment",
  async () => {
      const originalEditor = vscode.window.activeTextEditor;
      if (!originalEditor) return;

      const originalDoc = originalEditor.document;
      const originalUri = originalDoc.uri;
      const code = originalDoc.getText();

      try {
          await axios.get(`${BASE_URL}/api/tags`);

          const start = Date.now();
          vscode.window.showInformationMessage("CommentRescueAI: Commenting started, have coffee ☕");

          const response = await axios.post(
              `${BASE_URL}/api/generate`,
              {
                  model: MODEL_NAME,
                  prompt: code,
                  system: SYSTEM_PROMPT,
                  stream: false,
                  options: OLLAMA_GPU_OPTIONS
              }
          );

          const end = Date.now();
          const elapsedMs = end - start;
          const minutes = Math.floor(elapsedMs / 60000);
          const seconds = ((elapsedMs % 60000) / 1000).toFixed(0);
          vscode.window.showInformationMessage(
              `CommentRescueAI: Commenting completed, time: ${minutes}m ${seconds}s`
          );

          let newCode = response.data.response
              .replaceAll("```", "")
              .replace("python", "");

          // Ensure we're editing the original document
          const updatedDoc = await vscode.workspace.openTextDocument(originalUri);
          const edit = new vscode.WorkspaceEdit();
          edit.replace(
              originalUri,
              new vscode.Range(0, 0, updatedDoc.lineCount, 0),
              newCode
          );

          await vscode.workspace.applyEdit(edit);
          await updatedDoc.save();

      } catch (error) {
          if (error instanceof Error) {
              vscode.window.showErrorMessage(ERROR_MESSAGES.ollamaError(error.message));
          } else {
              vscode.window.showErrorMessage(ERROR_MESSAGES.unknownError);
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
          title: INSTALL_PROGRESS_TITLE(MODEL_NAME, MODEL_SIZE),
          cancellable: false,
        },
        async (progress) => {
          return new Promise((resolve, reject) => {
            // Execute "ollama pull" command
            const process = exec(
              `ollama pull ${MODEL_NAME}`,
              (error, stdout, stderr) => {
                if (error) {
                  vscode.window.showErrorMessage(
                    `CommentRescueAI: Failed to install model: ${error.message}`
                  );
                  reject(error);
                } else {
                  vscode.window.showInformationMessage(
                    `CommentRescueAI: Successfully installed ${MODEL_NAME}!`
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

  context.subscriptions.push(aicomment, ollamaSetup);
}

export function deactivate() {}
