import { db } from "@/server/db";
import { Octokit } from "octokit";
import { summariseCommitByAI } from "./gemni";
import axios from "axios";


export const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

type commit = {
  commitHash: string;
  commitMessage: string;
  commitAuthorName: string;
  commitAuthorAvatar: string;
  commitDate: string;
};

type Issue = {
  issueNumber: number;
  issueTitle: string;
  issueState: string;
  issueAuthor: string;
  createdAt: string;
  url: string;
};

/**
 * Retrieves a list of commit hashes and associated information from a GitHub repository.
 *
 * @param githubUrl The URL of the GitHub repository.  Must be in the format 'owner/repo' or a full GitHub URL.
 * @returns A promise that resolves to an array of commit objects, sorted by commit date in descending order.
 * @throws Error if the provided GitHub URL is invalid.
 */
export const getCommitHashes = async (githubUrl: string): Promise<commit[]> => {
  const [owner, repo] = githubUrl.split("/").slice(-2);
  if (!owner || !repo) {
    throw new Error("not valid github url");
  }
  const { data } = await octokit.rest.repos.listCommits({
    owner,
    repo,
  });
  const commits: commit[] = data.map((commit) => ({
    commitHash: commit.sha as string,
    commitMessage: commit.commit.message,
    commitAuthorName: commit.commit.author?.name || "unknown",
    commitAuthorAvatar: commit.author?.avatar_url || "",
    commitDate: commit.commit.author?.date || "",
  }));

  commits.sort(
    (a, b) =>
      new Date(b.commitDate).getTime() - new Date(a.commitDate).getTime(),
  );

  return commits;
};

/**
 * Fetches the GitHub URL and token associated with a given project ID from the database.
 * @param projectID The unique identifier of the project.
 * @returns An object containing the project data, the GitHub URL, and the GitHub token (if available).
 * @throws Error if no GitHub URL is found for the given project ID.
 */
async function fetchProjectGithubUrl(projectID: string) {
   
const project = await db.project.findFirst({
    where: {
        id: projectID,
    },
    select: {
        githubUrl: true,
        githubToken: true,
    },
});
    
  return {
    project,
    githubURL: project?.githubUrl,
    githubToken: project?.githubToken || "",
  };
}

/**
 * Filters a list of commits to identify those that have not yet been processed and stored in the database.
 *
 * @param projectId - The ID of the project to which the commits belong. This is used to query the database for existing commits.
 * @param commitHashes - An array of commit objects, each containing a `commitHash` property. This is the list of commits to filter.
 * @returns A promise that resolves to an array of commit objects that have not yet been processed and stored in the database.
 */
async function filterUnProccesedCommits(
  projectId: string,
  commitHashes: commit[],
) {
  const processedCommits = await db.commit.findMany({
    where: { projectId },
    select: { commitHash: true },
  });
  const processedHashesSet = new Set(processedCommits.map((c) => c.commitHash));
  const unprocessedCommits = commitHashes.filter(
    (commit) => !processedHashesSet.has(commit.commitHash),
  );

  return unprocessedCommits;
}

/**
 * @param githubURL - The URL of the GitHub repository.
 * @param commitHash - The hash of the commit to summarise.
 * @param githubToken - The GitHub token to use for authentication.
 * @returns A promise that resolves to the summary of the commit.
 *
 * @description This function takes a GitHub URL, a commit hash, and a GitHub token, and returns a summary of the commit.
 * It fetches the commit data from the GitHub API, and then uses the `summariseCommitByAI` function to generate the summary.
 */
async function summariseCommit(
  githubURL: string,
  commitHash: string,
  githubToken: string,
) {
  console.log("inside summarise commit block mg");
  const [owner, repo] = githubURL.split("/").slice(-2);
  const data = await axios.get(
    `https://api.github.com/repos/${owner}/${repo}/commits/${commitHash}`,
    {
      headers: {
        Accept: "application/vnd.github.v3.diff",
        Authorization: `token ${githubToken}`,
      },
    },
  );

  console.log(data.data);
  return await summariseCommitByAI(data.data);
}

/**
 * Polls for new commits from a GitHub repository, summarizes them, and saves them to the database.
 *
 * This function fetches the GitHub URL and token for a given project, retrieves the commit hashes,
 * filters out the commits that have already been processed, generates summaries for the new commits,
 * and saves the summaries to the database.
 *
 * @param projectId - The ID of the project to poll commits for.
 * @returns A promise that resolves to the result of creating the commits in the database.
 */

export const pollCommits = async (projectId: string) => {
  console.log("entered poll commits");

  const { project, githubURL, githubToken } =
    await fetchProjectGithubUrl(projectId);
  console.log("Fetched project and GitHub URL:", {
    project,
    githubURL,
    githubToken,
  });
  if (!githubURL) {
    throw new Error("No GitHub URL found for the project.");
  }
  
  const commitHashes = await getCommitHashes(githubURL);
  console.log("Fetched commit hashes:", commitHashes);

  const unprocessedCommits = await filterUnProccesedCommits(
    projectId,
    commitHashes,
  );
  console.log("Filtered unprocessed commits:", unprocessedCommits);

  const summaryList = [];

  for (const commit of unprocessedCommits) {
    console.log("Summarizing commit:", commit.commitHash);
    await new Promise((resolve) => setTimeout(resolve, 5000));
    const summary = await summariseCommit(
      githubURL,
      commit.commitHash,
      githubToken,
    );
    console.log("Generated summary for commit:", commit.commitHash, summary);

    summaryList.push({
      ...commit,
      summary,
      status: "fulfilled",
    });
  }

  console.log("Summary list after Promise.all:", summaryList);

  const fulfilledCommits = summaryList.filter(
    (commit) => commit.status === "fulfilled",
  );
  console.log("Filtered fulfilled commits:", fulfilledCommits);

  const commit = await db.commit.createMany({
    data: fulfilledCommits.map((commit, index) => {
      console.log("Mapping commit to database format:", commit);

      return {
        projectId: projectId,
        commitHash: commit.commitHash,
        commitMessage: commit.commitMessage,
        commitAuthorName: commit.commitAuthorName,
        commitAuthorAvatar: commit.commitAuthorAvatar,
        commitDate: commit.commitDate,
        summary: commit.summary,
      };
    }),
  });

  console.log("Database commit creation result:", commit);

  return commit;
};

// export const getOpenIssues = async (githubUrl: string): Promise<Issue[]> => {
//     const [owner, repo] = githubUrl.split('/').slice(-2)
//     const { data } = await octokit.rest.issues.listForRepo({
//       owner: 'docker',
//       repo: 'genai-stack',
//       state: 'open',
//     });

//     const openIssues: Issue[] = data.map(issue => ({
//       issueNumber: issue.number,
//       issueTitle: issue.title,
//       issueState: issue.state,
//       issueAuthor: issue.user?.login || 'unknown',
//       createdAt: issue.created_at,
//       url: issue.html_url,
//     }));

//     openIssues.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

//     return openIssues;
//   };
