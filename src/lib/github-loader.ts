import { GithubRepoLoader } from "@langchain/community/document_loaders/web/github";
import { Document } from "@langchain/core/documents";
import { generateAIEmbedding, summariseCode } from "./gemni";
import { db } from "@/server/db";

export async function githubLoader(githubUrl: string, githubToken?: string) {
  const loader = new GithubRepoLoader(githubUrl, {
    branch: "main",
    accessToken: githubToken || '',
    unknown: "warn",
    maxConcurrency: 5,
    recursive: true,
    ignoreFiles: [
      "pnpm-lock.yaml",
      "yarn.lock",
      "next.config.js",
      "vite.config.js",
      "tsconfig.json",
      "jsconfig.json",
      ".eslintrc.js",
      ".prettierrc",
      ".gitignore",
      "**/*.lock",
    ],
  });
  const docs = await loader.load();
  return docs;
}

export const generateEmbeddings = async (docs: Document[]) => {
   const results = [];

  for (const doc of docs) {
    await new Promise((resolve) => setTimeout(resolve, 5000)); // optional 5s delay

    const summary = await summariseCode(doc);

    await new Promise((resolve) => setTimeout(resolve, 5000)); // optional 5s delay

    const embeddings = await generateAIEmbedding(summary);

    results.push({
      summary,
      embeddings,
      sourceCode: JSON.stringify(doc.pageContent),
      fileName: doc.metadata.source,
    });
  }

  return results;
};


export const indexGithubRepo = async (
  projectId: string,
  githubURL: string,
  githubToken?: string,
) => {
  const docs = await githubLoader(githubURL, githubToken);
  const allEmbeddings = await generateEmbeddings(docs);
  await Promise.allSettled(allEmbeddings.map(async (embedding, index) => {
    console.log(`Processing ${index + 1} of ${allEmbeddings.length}`);

    if (!embedding) {
      return;
    }

    const sourceCodeEmbeddings = await (db as any).sourceCodeEmbedding.create({
          data: {
            summary: embedding.summary,
            sourceCode: embedding.sourceCode,   
            filename: embedding.fileName, 
            projectId: projectId,
          },
        });
        await db.$executeRaw`
        UPDATE "SourceCodeEmbedding"
        SET "summaryEmbedding" = ${embedding.embeddings}::vector
        WHERE "id" = ${sourceCodeEmbeddings.id}
      `;
      
    }));
};
