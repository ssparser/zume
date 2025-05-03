import { db } from '@/server/db';
import { error } from 'console';
import { Split } from 'lucide-react';
import { headers } from 'next/headers';
import {Octokit} from 'octokit'
import { summariseCommitByAI } from './gemni';
import axios from 'axios';

export const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN

})


type commit = {
    commitHash: string;
    commitMessage: string;
    commitAuthorName: string;
    commitAuthorAvatar: string;
    commitDate: string;
}

type Issue = {
    issueNumber: number;
    issueTitle: string;
    issueState: string;
    issueAuthor: string;
    createdAt: string;
    url: string;
  };

export const getCommitHashes = async (githubUrl: string) : Promise<commit[]> => {
    const [owner, repo] = githubUrl.split('/').slice(-2)
    if (!owner || !repo){
        throw new Error('not valid github url');
    }
    const {data} = await octokit.rest.repos.listCommits({
        owner,
        repo
    })
    const commits: commit[] = data.map(commit => ({
        commitHash: commit.sha as string,
        commitMessage: commit.commit.message,
        commitAuthorName: commit.commit.author?.name || 'unknown',
        commitAuthorAvatar: commit.author?.avatar_url || '',
        commitDate: commit.commit.author?.date || '',
      }));
    
      commits.sort((a, b) => new Date(b.commitDate).getTime() - new Date(a.commitDate).getTime());
    
    return commits
}

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


async function fetchProjectGithubUrl(projectID: string) {
    const project = await db.project.findUnique({
        where: {id: projectID},
        select: {
            githubUrl: true
        }
    })
    if (!project?.githubUrl)
    {
        throw new Error("no github url")
    }
    return {project, githubURL: project?.githubUrl}
}

async function filterUnProccesedCommits(projectId: string, commitHashes: commit[])
{
    const processedCommits = await db.commit.findMany({
        where: {projectId},
        select: { commitHash: true }
    })
    const processedHashesSet = new Set(processedCommits.map(c => c.commitHash));
    const unprocessedCommits = commitHashes.filter(commit => 
        !processedHashesSet.has(commit.commitHash)
      );
    
    return unprocessedCommits;

}

async function summariseCommit(githubURL: string, commitHash: string)
{
    console.log('inside summarise commit block mg')
    const data = await axios.get(`${githubURL}/commit/${commitHash}.diff`, {
        headers:{
            Accept: 'application/vnd.github.v3.diff'
        }
    })
    console.log(data.data)
    return await summariseCommitByAI(data.data)
}

// const githubURL = 'https://github.com/docker/genai-stack';
// const commitHashes = ['73a42da4161401e3787f896d15f5fc96053a24a7'];

// const processCommits = async () => {
//     for (let commitHash of commitHashes) {
//         console.log(`Summarizing commit: ${commitHash}`);
//         const summary = await summariseCommit(githubURL, commitHash);
//         console.log(`Summary for commit ${commitHash}:`, summary);
//     }
// };

// processCommits();

// export const pollCommits = async(projectId: string) => {
//     console.log('entered poll commits')
//     const {project, githubURL} = await fetchProjectGithubUrl(projectId)
//     const commitHashes = await getCommitHashes(githubURL)
//     const unprocessedCommits = await filterUnProccesedCommits(projectId, commitHashes)
//      const summaryList = await Promise.all(
//         unprocessedCommits.map(async (commit) => {
//             const summary = await summariseCommit(githubURL, commit.commitHash);
            
//             return {
//                 ...commit,
//                 summary,  
//                 status: 'fulfilled',  
//             };
//         })
//     );

//     const fulfilledCommits = summaryList.filter(commit => commit.status === 'fulfilled');
//     const commit = await db.commit.createMany({
//         data: fulfilledCommits.map((commit, index) => {
//             return {
//                 projectId: projectId,
//                 commitHash: commit.commitHash,  
//                 commitMessage: commit.commitMessage,  
//                 commitAuthorName: commit.commitAuthorName,
//                 commitAuthorAvatar: commit.commitAuthorAvatar,
//                 commitDate: commit.commitDate,
//                 summary: commit.summary
//             }
//         })
//     });
//     return commit
// }

export const pollCommits = async (projectId: string) => {
    console.log('entered poll commits');  // Log when the function is entered
    
    const { project, githubURL } = await fetchProjectGithubUrl(projectId);
    console.log('Fetched project and GitHub URL:', { project, githubURL });  // Log the fetched project and URL
    
    const commitHashes = await getCommitHashes(githubURL);
    console.log('Fetched commit hashes:', commitHashes);  // Log the commit hashes
    
    const unprocessedCommits = await filterUnProccesedCommits(projectId, commitHashes);
    console.log('Filtered unprocessed commits:', unprocessedCommits);  // Log unprocessed commits
    
    const summaryList = [];

    for (const commit of unprocessedCommits) {
        console.log('Summarizing commit:', commit.commitHash);
        await new Promise(resolve => setTimeout(resolve, 5000));  // 10 second delay between each
        const summary = await summariseCommit(githubURL, commit.commitHash);
        console.log('Generated summary for commit:', commit.commitHash, summary);

        summaryList.push({
            ...commit,
            summary,
            status: 'fulfilled',
        });
    }
    
    console.log('Summary list after Promise.all:', summaryList);  // Log the summary list after processing all commits
    
    const fulfilledCommits = summaryList.filter(commit => commit.status === 'fulfilled');
    console.log('Filtered fulfilled commits:', fulfilledCommits);  // Log the fulfilled commits
    
    const commit = await db.commit.createMany({
        data: fulfilledCommits.map((commit, index) => {
            console.log('Mapping commit to database format:', commit);  // Log each commit being mapped to database format
            
            return {
                projectId: projectId,
                commitHash: commit.commitHash,
                commitMessage: commit.commitMessage,
                commitAuthorName: commit.commitAuthorName,
                commitAuthorAvatar: commit.commitAuthorAvatar,
                commitDate: commit.commitDate,
                summary: commit.summary
            };
        })
    });

    console.log('Database commit creation result:', commit);  // Log the result of creating commits in the database
    
    return commit;
};

