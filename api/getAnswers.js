const { Octokit } = require("@octokit/rest");

exports.handler = async function (event) {
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: ""
    };
  }

  if (event.httpMethod !== "GET") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  const password = event.queryStringParameters?.password;
  console.log('Received password:', password); // Debug

  if (password !== "karim") {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: "Unauthorized" }),
    };
  }

  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  console.log('GITHUB_TOKEN set:', !!GITHUB_TOKEN); // Debug

  if (!GITHUB_TOKEN) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "GITHUB_TOKEN is missing in environment" }),
    };
  }

  const REPO_OWNER = "macdeesh";
  const REPO_NAME = "Patterns";
  const FILE_PATH = "data/answers.json";
  const BRANCH = "main";

  const octokit = new Octokit({ auth: GITHUB_TOKEN });

  try {
    console.log(`Reading ${FILE_PATH} from ${REPO_OWNER}/${REPO_NAME}@${BRANCH}`);
    
    const {  file } = await octokit.repos.getContent({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      path: FILE_PATH,
      ref: BRANCH,
    });

    const content = Buffer.from(file.content, "base64").toString("utf-8");
    console.log('File content loaded:', content);

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: content,
    };
  } catch (error) {
    console.error('GitHub error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Failed to fetch answers",
        details: error.message,
        status: error.status
      }),
    };
  }
};