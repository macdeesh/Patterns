const { Octokit } = require("@octokit/rest");

exports.handler = async function (event) {
  const password = event.queryStringParameters.password;
  if (password !== "karim") {
    return { statusCode: 401, body: "Unauthorized" };
  }

  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  const REPO_OWNER = "macdeesh";
  const REPO_NAME = "Patterns";
  const FILE_PATH = "data/answers.json";
  const BRANCH = "main";

  const octokit = new Octokit({ auth: GITHUB_TOKEN });

  try {
    const { data: file } = await octokit.repos.getContent({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      path: FILE_PATH,
      ref: BRANCH,
    });

    await octokit.repos.deleteFile({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      path: FILE_PATH,
      message: "Erase saved answers",
      sha: file.sha,
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
      body: JSON.stringify({ error: "Failed to delete answers" }),
    };
  }
};
