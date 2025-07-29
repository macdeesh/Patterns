const { Octokit } = require("@octokit/rest");

exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  let userData;
  try {
    const body = JSON.parse(event.body);
    userData = body.userData;

    if (!userData || typeof userData !== "object") {
      return { statusCode: 400, body: "Invalid user data" };
    }
  } catch (err) {
    return { statusCode: 400, body: "Invalid JSON" };
  }

  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  const REPO_OWNER = "macdeesh";
  const REPO_NAME = "Patterns";
  const FILE_PATH = "data/answers.json";
  const BRANCH = "main";

  const octokit = new Octokit({ auth: GITHUB_TOKEN });

  try {
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

    data.push(userData);

    const updatedContent = Buffer.from(JSON.stringify(data, null, 2)).toString("base64");
    const timestamp = new Date().toISOString();

    await octokit.repos.createOrUpdateFileContents({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      path: FILE_PATH,
      message: `Add new answer at ${timestamp}`,
      content: updatedContent,
      sha: sha || undefined,
      branch: BRANCH,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true }),
    };
  } catch (error) {
    console.error("GitHub error:", error.response?.data || error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to save answer" }),
    };
  }
};
