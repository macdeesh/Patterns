const { Octokit } = require("@octokit/rest");

exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const { userData } = JSON.parse(event.body);
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  const REPO_OWNER = "macdeesh";
  const REPO_NAME = "Patterns";
  const FILE_PATH = "data/answers.json";
  const BRANCH = "main";

  const octokit = new Octokit({ auth: GITHUB_TOKEN });

  try {
    // Get current file contents and SHA
    let currentContent = "";
    let sha = null;

    try {
      const { data: file } = await octokit.repos.getContent({
        owner: REPO_OWNER,
        repo: REPO_NAME,
        path: FILE_PATH,
        ref: BRANCH,
      });

      currentContent = Buffer.from(file.content, "base64").toString("utf-8");
      sha = file.sha;
    } catch (error) {
      if (error.status !== 404) throw error;
    }

    let data = [];
    if (currentContent) {
      data = JSON.parse(currentContent);
    }

    data.push(userData); // append new entry

    const updatedContent = Buffer.from(JSON.stringify(data, null, 2)).toString("base64");

    await octokit.repos.createOrUpdateFileContents({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      path: FILE_PATH,
      message: "Add new answer",
      content: updatedContent,
      sha: sha || undefined,
      branch: BRANCH,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true }),
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to save answer" }),
    };
  }
};
