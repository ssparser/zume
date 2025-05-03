"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import MDEditor from "@uiw/react-md-editor";
import { useProject } from "@/hooks/use-projects";
import React, { useState } from "react";
import { askQuestion } from "./actions";
import { readStreamableValue } from "ai/rsc";
import { useTheme } from "next-themes";

const AskQuestionCard = () => {
  const { project, projectId } = useProject();
  const [question, setQuestion] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [filesRef, setFilesRef] = React.useState<
    { filename: string; sourceCode: string; summary: string }[]
  >([]);
  const { theme } = useTheme();
  const [open, setOpen] = React.useState(false);
  const [ans, setAns] = React.useState("");
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!project?.id){
        return
    }
    setAns('')
    setFilesRef([])
    setLoading(true)
    setOpen(true);
    const {output, files} = await askQuestion(question, projectId)
    setFilesRef(files)
    for await(const delta of readStreamableValue(output)){
        if (delta){
            setAns(ans => ans + delta)
        }
    }
  };
  return (
    <>
 <Dialog open={open} onOpenChange={setOpen}>
  <DialogContent className="sm:max-h-[80vh] sm:max-w-[90vw] overflow-y-auto">
    <DialogHeader>
      <DialogTitle>Answer</DialogTitle>
    </DialogHeader>
    <div data-color-mode={theme}>
    <MDEditor.Markdown
      source={ans}
      className={` !h-full overflow-y-hidden whitespace-pre-wrap `}
      
    />
    </div>
  </DialogContent>
</Dialog>
      <Card className="col-span-5">
        <CardHeader>
          <CardTitle>Ask a question</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <textarea
              placeholder="Which file should i edit for the homepage"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
            />
            <Button type="submit">Ask</Button>
          </form>
        </CardContent>
      </Card>
    </>
  );
};

export default AskQuestionCard;
