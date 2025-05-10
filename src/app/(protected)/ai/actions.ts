"use server";

import { generateAIEmbedding } from "@/lib/gemni";
import { db } from "@/server/db";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { streamText, generateText } from "ai";
import { createStreamableValue } from "ai/rsc";

const model = createGoogleGenerativeAI({
  apiKey: process.env.AI_KEY!,
});

export async function askQuestion(question: string, projectId: string) {
  const stream = createStreamableValue();
  const quesVector = await generateAIEmbedding(question);
  const vectorQuery = `[${quesVector.join(",")}]`;
  const res = (await db.$queryRaw`
  SELECT "filename", "sourceCode", "summary",
    1 - ("summaryEmbedding" <=> ${vectorQuery}::vector) AS similarity
  FROM "SourceCodeEmbedding"
  WHERE 1 - ("summaryEmbedding" <=> ${vectorQuery}::vector) > .2
    AND "projectId" = ${projectId}
  ORDER BY similarity DESC
  LIMIT 10;
`) as { filename: string; sourceCode: string; summary: string }[];
  let context = "";
  for (const doc of res) {
    context += `source: ${doc.filename}\n code content: ${doc.sourceCode}\n summary: ${doc.summary} `;
  }

  (async () => {
    const { textStream } = await streamText({
      model: model("gemini-1.5-flash"),
      
      prompt: `You are a ai code assistant who answers questions about the codebase. Your target audience is a technical intern who is looking to understand the codebase.
            AI assistant is a brand new, powerful, human-like artificial intelligence.
            The traits of AI include expert knowledge, helpfulness, cleverness, and articulateness.
            Al is a well-behaved and well-mannered individual.
            Al is always friendly, kind, and inspiring, and he is eager to provide vivid and thoughtful responses to the user.
            AI has the sum of all knowledge in their brain, and is able to accurately answer nearly any question about any topic in conversation.
            The AI assistant will primarily base its answers on the CONTEXT BLOCK, and may use basic reasoning (e.g., based on file extensions or filenames) when explicitly allowed (e.g., to identify programming language).
            If the question is asking about code or a specific file, AI will provide the detailed answer, giving step by step instructions, including code snippets.
            START CONTEXT BLOCK
            ${context}
            END OF CONTEXT BLOCK
            START QUESTION ${question}
            END OF QUESTION
            + The AI assistant should base its answers on the CONTEXT BLOCK when possible,
            + but may generate new code or explanations based on general programming knowledge
            + if the context is not sufficient to answer the question.

            If the context does not provide an answer to the question, the assistant will respond with "I'm sorry, but I don't know." It will not apologize for any prior responses, 
            but will simply incorporate any new information going forward without referencing past errors. The assistant is not allowed to invent or assume anything beyond the content of the context, 
            ensuring factual accuracy tied directly to what is provided. All responses will be formatted in markdown syntax and will include detailed, complete answers written in full paragraphs, 
            incorporating code snippets where relevant is important always explain with code examples most of the time from code from codebase. This approach guarantees transparency, precision, and reliability in responses.
            **output format**:
            the output must be in markdown format, and the code snippets must be in code blocks.
            the code snippets must be in the same language as the codebase.
            donot give uncessary spacing in the markdown output.
            add spacing on top of the output and bottom of the output at start and at the end.
            `,
    });
    for await (const delta of textStream) {
      stream.update(delta);
    }
    stream.done();
  })();
  return {
    output: stream.value,
    files: res,
  };
}

