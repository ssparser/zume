import { GithubRepoLoader } from "@langchain/community/document_loaders/web/github";
import { Document } from "@langchain/core/documents";
import { generateAIEmbedding, summariseCode } from "./gemni";
import { db } from "@/server/db";
import { create } from "domain";

type FileMap = Map<string, Set<string>>;


export async function githubLoader(githubUrl: string, githubToken: string) {
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
    await new Promise((resolve) => setTimeout(resolve, 5000)); //  5s delay

    const summary = await summariseCode(doc);

    await new Promise((resolve) => setTimeout(resolve, 5000)); //  5s delay

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


export const indexGithubRepo2 = async (projectId: string,
  githubURL: string,
  githubToken: string,
  fileMap: FileMap,
) => {
  let newOrModifiesFiles : string[] = []
  let deletedFiles : string[] = []
  for (const [key, value] of fileMap.entries()){
    if (key === "newOrModifiedFiles"){
      newOrModifiesFiles.push(...value)
    } else if (key === "deletedFiles"){
      deletedFiles.push(...value)
    }
  }
  console.log("Indexing GitHub repo...");
  console.log("Target filenames:", newOrModifiesFiles);
  const docs = await githubLoader(githubURL, githubToken);
  const filteredDocs = docs.filter(doc =>
    newOrModifiesFiles.some(filename => doc.metadata.source.endsWith(filename))
  );
  const allEmbeddings = await generateEmbeddings(filteredDocs);

  await Promise.allSettled(
    allEmbeddings.map(async (embedding, index) => {
      console.log(`Processing ${index + 1} of ${allEmbeddings.length}`);
  
      if (!embedding) return;
  
      const sourceCodeEmbeddings = await (db as any).sourceCodeEmbedding.upsert({
        where: {
          projectId_filename: {
            projectId: projectId,
            filename: embedding.fileName,
          },
        },
        update: {
          summary: embedding.summary,
          sourceCode: embedding.sourceCode,
        },
        create: { 
          summary: embedding.summary,
          sourceCode: embedding.sourceCode,
          filename: embedding.fileName,
          projectId: projectId,
        }
      });
  
      await db.$executeRaw`
        UPDATE "SourceCodeEmbedding"
        SET "summaryEmbedding" = ${embedding.embeddings}::vector
        WHERE "id" = ${sourceCodeEmbeddings.id}
      `;
    })
  );

  await Promise.allSettled(
    deletedFiles.map(async (filename) => {
      console.log(`Deleting file: ${filename}`);
      await (db as any).sourceCodeEmbedding.deleteMany({
        where: {
          projectId: projectId,
          filename: filename,
        },
      });
    }
  ));
}  

export const indexGithubRepo = async (
  projectId: string,
  githubURL: string,
  githubToken: string,
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
