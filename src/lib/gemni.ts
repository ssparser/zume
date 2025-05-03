import { GoogleGenerativeAI } from "@google/generative-ai";
import { Document } from "@langchain/core/documents";


const genAI = new GoogleGenerativeAI(
    process.env.AI_KEY!,
  );
const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash'
})
const embeddingModel = genAI.getGenerativeModel({
  model: 'text-embedding-004'
})


export const summariseCommitByAI = async (diff: string) => {
    const response = await model.generateContent([
      `You are an expert programmer helping to summarize Git diffs.
  
  Here's a reminder about Git diff format:
  * For each file, metadata lines appear like:
     * diff --git a/path/file.js b/path/file.js
     * index abc123..def456 100644
     * --- a/path/file.js
     * +++ b/path/file.js 
  This means the file \`path/file.js\` was modified.
  
  * Line changes:
     * Lines starting with \`+\` were **added**.
     * Lines starting with \`-\` were **deleted**.
     * Lines starting with neither \`+\` nor \`-\` are **context** and should be used for understanding.
  
  Guidelines for writing the summary:
  * divide the summary into short and consise points and start each point with * and start the new point in new line example{
    * line 1
    * line 2
    * line 3}
  * Format your response EXACTLY as a list of bullet points with a single blank line between the intro and the bullet points.
  * Be specific about line numbers: mention the exact lines that were modified (e.g., "Line 42: Renamed variable").
  * For each change, identify what was deleted and what was added in its place.
  * Mention **what changed**, **where** (filename and line number), and if obvious, **why**.
  * If only a small number of files were changed, mention the filenames in square brackets at the end of each point.
  
  Example format:
  - Changed function name from 'getData' to 'fetchData' on line 23 [\`src/utils.js\`]
  - Removed deprecated API call on lines 45-48 and replaced with new endpoint [\`api/client.js\`]
  - Added null check before accessing user.preferences on line 127 [\`components/UserProfile.js\`]
  
  Now, please summarize the following Git diff:
  
  ${diff}`
    ]);
    
    return response.response.text();
  };


export async function summariseCode(doc: Document){
  console.log('inside code summarise ai')
  const code = doc.pageContent.slice(0, 10000);
  const AIResponse = await model.generateContent([
    `
      You are a kind and knowledgeable Senior Software Engineer onboarding new interns. Your task is to explain the importance of the source of the document, which is "${doc.metadata.source}", and give a concise explanation of the following code: ${code}.
      Make sure your explanation is clear, easy to understand, and keeps it within 100 words. Your goal is to make the interns feel confident and informed about the project's structure and code.
    `
  ])
  
  return AIResponse.response.text();
}

export async function generateAIEmbedding(summary: string){
  const AIResponse = await embeddingModel.embedContent(summary)
  console.log(AIResponse,'embeddings')
  return AIResponse.embedding?.values
}
