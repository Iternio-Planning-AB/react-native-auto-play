const { Octokit } = require('@octokit/rest');
const core = require('@actions/core');
const github = require('@actions/github');
const { ignoredRegex, filterDiffByIgnoredFiles, getLineNumber } = require('./utils');

// Token limit for OpenAI API (approximation)
const MAX_TOKEN_LIMIT = 200000; // Adjust based on your model's context window
// Estimating 1 token ~= 3 characters for code (more conservative than the 4:1 ratio for English text)
const TOKEN_ESTIMATION_RATIO = 3.5;

// Function to estimate token count from text
const estimateTokenCount = (text) => {
  return Math.ceil(text.length / TOKEN_ESTIMATION_RATIO);
};

// Get GitHub context and inputs
const context = github.context;
const owner = context.repo.owner;
const repo = context.repo.repo;

const PR_NUMBER = process.env.PR_NUMBER;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const AZURE_OPEN_AI_SECRET = process.env.AZURE_OPEN_AI_SECRET;
const AZURE_OPEN_AI_URL = process.env.AZURE_OPEN_AI_URL;
const AZURE_OPEN_AI_DEPLOYMENT = process.env.AZURE_OPEN_AI_DEPLOYMENT;

const octokit = new Octokit({
  auth: GITHUB_TOKEN,
});

const getPullRequestDiff = async () => {
  // Get PR details
  const { data: pr } = await octokit.pulls.get({
    owner,
    repo,
    pull_number: PR_NUMBER,
  });

  // Get diff using Octokit's request method with diff media type
  const diffResponse = await octokit.request(`GET /repos/${owner}/${repo}/pulls/${PR_NUMBER}`, {
    mediaType: {
      format: 'diff',
    },
  });

  return {
    diff: diffResponse.data || '',
    title: pr.title,
    description: pr.body || '',
    commit: pr.head.sha,
  };
};

const SYSTEM_PROMPT = {
  role: 'system',
  content: `You are an experienced software developer specializing in React Native development for iOS, Android, and web platforms. You also maintain Android Auto, Android Automotive, and CarPlay implementations for an EV route planner and navigation app.

Your task is to review code changes and provide feedback in a specific JSON format. Always respond with valid JSON only - no markdown, no explanations outside the JSON.`,
};

const getUserPrompt = (title, description, diff) => {
  return {
    role: 'user',
    content: `Review the code changes in the diff below. Follow these rules strictly:

## What to Review
1. Major bugs and logic errors
2. Security vulnerabilities
3. Thread-safety issues
4. Best-practice violations (only significant ones)
5. Typos in code (variable names, strings) - not in comments or descriptions

## What NOT to Review
1. Test files (*.test.ts) - use them only as context
2. Minor style issues or nitpicks
3. Issues that linters or TypeScript would catch
4. Positive feedback - only report problems
5. Missing documentation or comments - EXCEPT the stale-documentation cases listed below

## Stale Documentation (always report these)
These are the one documentation exception. Report each as an issue on the changed source
line, saying which file needs updating and why.

1. Public API, installation or host-app setup changed, but packages/react-native-autoplay/README.md
   was not updated. That README is the only documentation consumers get. Watch for renames
   or changes to: the getRootViewForAutoplay AppDelegate method, any *SceneDelegate class
   name (they are referenced by string from the consumer's Info.plist), any
   ReactNativeAutoPlay_* Gradle property or its default, entitlements, URL schemes, the
   ProGuard rule, setIconFont, or any exported symbol in src/index.ts.
2. An architectural rule or invariant changed, but AGENTS.md was not updated. AGENTS.md is
   the agent instruction file. Its "Agent etiquette" section states hard rules (NitroModules
   only, committed nitrogen/generated/ output, tag-derived version, both platform branches
   of an action config) and its "Common tasks" section has step lists for adding a native
   method and adding a template. If the diff changes any of those, the rule or step list is
   now wrong.
3. A rule changed in one place but not its mirrors. The hard rules are duplicated, by
   necessity, into .github/copilot-instructions.md and .cursor/rules/project.mdc (neither
   tool reads AGENTS.md), and each docs/agents/<topic>.md is summarised by
   .skills/<name>/SKILL.md. If a PR edits one of these, flag any sibling left behind.
4. Behaviour described in docs/agents/*.md changed but the doc did not. Those files document
   non-obvious behaviour and silent failure modes; a diff that changes one makes the doc
   actively misleading.
5. A new template was added without both when-branches in AndroidAutoScreen.kt, or without
   an export from src/index.ts. This compiles and fails at runtime.
6. AGENTS.md grew past ~16 KB. Tools truncate it there, so anything past the limit is
   invisible. New task-specific content belongs in docs/agents/.

## PR Description
Report it as an issue if the PR description is long prose, a walkthrough of the diff, or a
per-file account. Descriptions should be short and high level - a few bullets on what
changed and why, with one bullet per feature or fix. This applies to AI-written PRs too.
Do not report this if the description is already brief, or if the author states they were
asked for more detail.

Also report it if the PR was opened by a tool but its description does not end with a line
naming both the tool and the model, e.g.
"Generated with Claude Code (Claude Opus 5)" or "Generated with Cursor (GPT-5)".
A footer naming only the tool, with no model, still counts as missing. Only raise this when
the PR is clearly tool-authored.

## Output Format
Respond with ONLY a JSON object in this exact structure:
{
  "summary": "Brief 1-2 sentence summary of findings, or 'No significant issues found.' if none",
  "issues": [
    {
      "filePath": "full/path/to/file.ts",
      "lineContent": "exact line content copied from the diff",
      "comment": "Brief explanation of the issue"
    }
  ]
}

## lineContent Rules (IMPORTANT for line matching)
The lineContent field is used to find the exact line number in the file. Follow these rules:
1. Copy the line EXACTLY as it appears in the diff (including leading whitespace/indentation)
2. Prefer a SINGLE line when possible - this gives the most precise match
3. For multi-line issues, include just enough lines to uniquely identify the location
4. Do NOT paraphrase, summarize, or modify the line content

## GitHub Suggestions
When you can propose a concrete code fix (typos, simple bugs, improvements), use GitHub's suggestion syntax in the comment field:
\`\`\`suggestion
corrected code here
\`\`\`

IMPORTANT: Preserve the EXACT indentation from the original line in your suggestion. The suggestion replaces the entire line, so wrong indentation will break the code.

Example for a typo fix (notice the 2-space indent is preserved):
{
  "filePath": "src/utils.ts",
  "lineContent": "  const nubmer = 42;",
  "comment": "Typo in variable name:\n\`\`\`suggestion\n  const number = 42;\n\`\`\`"
}

Only use suggestions when you have a specific fix. For general issues without a clear fix, just explain the problem.

If there are no issues, return: {"summary": "No significant issues found.", "issues": []}

${title ? `## PR Title\n${title}\n\n` : ''}${description ? `## PR Description\n${description}\n\n` : ''}## Diff
${diff}`,
  };
};

// Handle both quoted and unquoted paths in git diff headers
// Use ^ with multiline flag to only match actual diff headers at start of lines,
// not strings inside file contents that happen to look like diff headers
const pathRegex = /^diff --git "?a\/(.+?)"? "?b\/(.+?)"?\n(?!deleted file mode)/gm;

const getTouchedFilesContent = async (diff, commit) => {
  const files = [];
  let match;
  while ((match = pathRegex.exec(diff)) !== null) {
    // Strip any remaining quotes from the path
    const path = match[2].replace(/^"|"$/g, '');
    if (ignoredRegex.test(path)) {
      continue;
    }
    files.push(path);
  }

  const fileContents = await Promise.all(
    files.map(async (path) => {
      try {
        const { data } = await octokit.repos.getContent({
          owner,
          repo,
          path,
          ref: commit,
        });

        // GitHub API returns content as base64 encoded string
        let content = null;
        if (data.type === 'file' && data.encoding === 'base64') {
          content = Buffer.from(data.content, 'base64').toString('utf-8');
        } else if (data.type === 'file' && typeof data.content === 'string') {
          content = data.content;
        }

        return { path, content };
      } catch (err) {
        console.error(`Failed to get content for ${path}`, err);
        return { path, content: null };
      }
    })
  );

  return fileContents.filter((file) => file.content !== null);
};

const createPrompt = async (title, description, diff, fileContents) => {
  // Check basic token count for system prompt and diff
  const systemPromptTokens = estimateTokenCount(SYSTEM_PROMPT.content);
  const userPromptTokens = estimateTokenCount(getUserPrompt(title, description, diff).content);
  const baseTokenCount = systemPromptTokens + userPromptTokens;

  console.log(`Base token count (system prompt + user prompt with diff): ${baseTokenCount}`);

  // Check if we can include file contents without exceeding token limit
  let includeFileContents = true;
  let fileContentTokens = 0;

  // Calculate total tokens if we include all file contents
  fileContents.forEach((file) => {
    const filePrompt = `Additional context of the source code of the changed file ${file.path}:\n${file.content}`;
    fileContentTokens += estimateTokenCount(filePrompt);
  });

  console.log(`File contents would add approximately ${fileContentTokens} tokens`);

  // Check if including file contents would exceed token limit
  if (baseTokenCount + fileContentTokens > MAX_TOKEN_LIMIT) {
    console.log(
      `WARNING: Total token count (${
        baseTokenCount + fileContentTokens
      }) would exceed limit (${MAX_TOKEN_LIMIT}). Excluding file contents.`
    );
    includeFileContents = false;
  }

  const messages = [SYSTEM_PROMPT, getUserPrompt(title, description, diff)];

  // Add file contents only if not exceeding token limit
  if (includeFileContents) {
    messages.push(
      ...fileContents.map((file) => ({
        role: 'system',
        content: `Additional context of the source code of the changed file ${file.path}:\n${file.content}`,
      }))
    );
  } else {
    messages.push({
      role: 'system',
      content:
        'File contents were excluded due to token limit constraints. Review will be based only on the diff.',
    });
  }

  // Note: o3-mini and other reasoning models don't support temperature/top_p
  // They are inherently more deterministic. Use reasoning_effort if needed.
  const prompt = { messages };
  console.log('Got diff, requesting review now...');

  return prompt;
};

const axios = require('axios');

const requestReview = async () => {
  const { diff, title, description, commit } = await getPullRequestDiff();
  const filteredDiff = filterDiffByIgnoredFiles(diff);
  const fileContents = await getTouchedFilesContent(filteredDiff, commit);

  const prompt = await createPrompt(title, description, filteredDiff, fileContents);

  // Construct Azure OpenAI URL from secrets
  const openAiUrl = `${AZURE_OPEN_AI_URL}/openai/deployments/${AZURE_OPEN_AI_DEPLOYMENT}/chat/completions?api-version=2024-12-01-preview`;

  const config = {
    method: 'post',
    maxBodyLength: Number.POSITIVE_INFINITY,
    url: openAiUrl,
    headers: {
      'api-key': AZURE_OPEN_AI_SECRET,
      'Content-Type': 'application/json',
    },
    data: JSON.stringify(prompt),
  };

  return new Promise((resolve, reject) => {
    axios
      .request(config)
      .then((response) => {
        const review = response.data.choices[0].message.content;
        console.log('OpenAI Usage statistics', response.data.usage);

        try {
          const json = JSON.parse(review);
          resolve({ review: json, fileContents });
        } catch (error) {
          console.error('Failed to JSON.parse review', review);
          reject(error);
        }
      })
      .catch((error) => {
        reject(error);
      });
  });
};

const deleteCommentsByUser = async (username) => {
  try {
    // Step 1: List all review comments (inline comments) on the pull request
    const reviewCommentsResponse = await octokit.pulls.listReviewComments({
      owner,
      repo,
      pull_number: PR_NUMBER,
    });

    // Step 2: List all issue comments (general comments) on the pull request
    const issueCommentsResponse = await octokit.issues.listComments({
      owner,
      repo,
      issue_number: PR_NUMBER,
    });

    const reviewComments = reviewCommentsResponse.data || [];
    const issueComments = issueCommentsResponse.data || [];

    // Step 3: Filter comments by the specific user
    const userReviewComments = reviewComments.filter((comment) => comment.user.login === username);
    const userIssueComments = issueComments.filter((comment) => comment.user.login === username);

    // Step 4: Delete each review comment made by that user
    await Promise.allSettled(
      userReviewComments.map((comment) =>
        octokit.pulls.deleteReviewComment({
          owner,
          repo,
          comment_id: comment.id,
        })
      )
    );

    // Step 5: Delete each issue comment made by that user
    await Promise.allSettled(
      userIssueComments.map((comment) =>
        octokit.issues.deleteComment({
          owner,
          repo,
          comment_id: comment.id,
        })
      )
    );

    const totalDeleted = userReviewComments.length + userIssueComments.length;
    if (totalDeleted > 0) {
      console.log(
        `Deleted ${totalDeleted} comments by user ${username} (${userReviewComments.length} review comments, ${userIssueComments.length} issue comments)`
      );
    }
  } catch (error) {
    console.error('Failed to delete comments by user', error);
  }
};

const getReviewAndSendToGitHub = async () => {
  return requestReview()
    .then(async ({ review, fileContents }) => {
      // log review for debugging purposes
      console.log('Review:\n', review);

      // Get PR details to get the base and head commits for inline comments
      const { data: pr } = await octokit.pulls.get({
        owner,
        repo,
        pull_number: PR_NUMBER,
      });

      review.issues?.forEach((element) => {
        const filePath = element.filePath;
        const fileContent = fileContents.find((file) => file.path === filePath);
        if (fileContent) {
          try {
            const lineNumber = getLineNumber(fileContent.content, element.lineContent);
            if (lineNumber === -1) {
              // Line not found in file - attach the code to the comment
              element.comment = `${element.comment}\n${filePath}:\n\`\`\`\n${element.lineContent}\n\`\`\``;
            }
            element.lineNumber = lineNumber;
          } catch (error) {
            console.error(
              `Failed to get line number for:\n${element.lineContent}\nError:\n`,
              error
            );
          }
        }
      });

      // Delete previous comments by the bot
      await deleteCommentsByUser('github-actions[bot]');

      console.log('Creating comments...');

      try {
        if (review.issues?.length) {
          // Group comments by file for batch processing
          const commentsByFile = {};
          review.issues.forEach(({ filePath, lineNumber, comment }) => {
            if (!commentsByFile[filePath]) {
              commentsByFile[filePath] = [];
            }
            commentsByFile[filePath].push({ lineNumber, comment });
          });

          // Create inline comments for each file
          for (const [filePath, comments] of Object.entries(commentsByFile)) {
            for (const { lineNumber, comment } of comments) {
              if (lineNumber === -1) {
                // Create a general comment on the PR
                await octokit.issues.createComment({
                  owner,
                  repo,
                  issue_number: PR_NUMBER,
                  body: comment,
                });
              } else {
                // Create an inline review comment
                // GitHub requires side: 'RIGHT' for comments on the PR branch
                try {
                  await octokit.pulls.createReviewComment({
                    owner,
                    repo,
                    pull_number: PR_NUMBER,
                    body: comment,
                    commit_id: pr.head.sha,
                    path: filePath,
                    line: lineNumber,
                    side: 'RIGHT',
                  });
                } catch (error) {
                  console.error(
                    `Failed to create inline comment for ${filePath}:${lineNumber}`,
                    error
                  );
                  // Fallback to general comment if inline fails
                  await octokit.issues.createComment({
                    owner,
                    repo,
                    issue_number: PR_NUMBER,
                    body: `${filePath}:${lineNumber}\n\n${comment}`,
                  });
                }
              }
            }
          }
        }

        // Create summary comment
        await octokit.issues.createComment({
          owner,
          repo,
          issue_number: PR_NUMBER,
          body: review.summary,
        });
      } catch (error) {
        console.error('failed to create comment', error);
        core.setFailed(`Failed to create comments: ${error.message}`);
      }
    })
    .catch((error) => {
      console.error('failed to query review', error.message);
      core.setFailed(`Failed to get review: ${error.message}`);
      return;
    });
};

// Main execution
if (require.main === module) {
  getReviewAndSendToGitHub();
}

module.exports = { getReviewAndSendToGitHub };
