"use client";
import { useProject } from "@/hooks/use-projects";
import { useUser } from "@clerk/nextjs";
import { ExternalLink, Github } from "lucide-react";
import Link from "next/link";
import React from "react";
import CommitLog from "./commit-log";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AskQuestionCard from "./ask-question-card";

const page = () => {
  const { user } = useUser();
  const { project } = useProject();

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-y-4">
        <div className="bg-primary flex w-fit flex-row items-center gap-2 rounded-md px-4 py-3">
          <Github className="size-5 text-white" />
          <p className="text-white">
            This project is linked to{" "}
            <Link
              href={project?.githubUrl ?? ""}
              className="inline-flex items-center gap-0.5 text-white/80 hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              {project?.githubUrl}
              <ExternalLink className="size-4 cursor-pointer" />
            </Link>
          </p>
        </div>
       
      </div>
      <div className="flex flex-row ">
      <AskQuestionCard/>

      </div>
      <Tabs defaultValue="commits" className="w-full">
      <TabsList className=" flex flex-row w-[400px] gap-2 ">
        <TabsTrigger value="commits" className="cursor-pointer">Commits</TabsTrigger>
        <TabsTrigger value="password" className="cursor-pointer">Password</TabsTrigger>
      </TabsList>
      <TabsContent value="commits"> <CommitLog/>
      </TabsContent>
      </Tabs>
    </div>
  );
};

export default page;
