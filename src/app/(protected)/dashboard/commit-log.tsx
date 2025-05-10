"use client";
import { useProject } from "@/hooks/use-projects";
import { cn } from "@/lib/utils";
import { api } from "@/trpc/react";
import Image from "next/image";
import Link from "next/link";
import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import FormattedDate from "@/components/formatted-date-props";
import { SquareArrowOutUpRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const CommitLog = () => {
  const { projectId, project } = useProject();
  console.log("projectId", projectId);
  console.log("project", project);
  if (projectId === '') {
    return <ul>No project selected, select a project form the list of available projects or create a new Project</ul>;
  }
  const { data: commits, isLoading } = api.project.getCommits.useQuery({ projectId });
  function robustTrim(str: string) {
    return str.replace(/^[\s\u00A0\t]+|[\s\u00A0\t]+$/g, "");
  }

  return  (
    <ul className="space-y-5">
      {isLoading ? (
        Array.from({ length: 4 }).map((_, i) => (
          <li key={i} className="relative flex gap-x-4">
            <div className="flex w-full translate-x-1 flex-row gap-4">
              <div className="relative mt-4 flex flex-col items-center">
                <Skeleton className="h-[30px] w-[30px] rounded-full" />
                <div className="bg-primary absolute top-8 h-full w-px" />
              </div>
              <Card className="w-full border-2">
                <CardHeader>
                  <CardTitle>
                    <Skeleton className="h-4 w-3/4" />
                  </CardTitle>
                  <CardDescription>
                    <Skeleton className="h-3 w-1/2" />
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-5/6" />
                  <Skeleton className="h-3 w-4/6" />
                </CardContent>
              </Card>
            </div>
          </li>
        ))
      ) : (
        commits?.map((commit, index) => (
          <li key={commit.id} className="relative flex gap-x-4">
            <div className={cn("flex w-full justify-start")}>
              <div className="flex w-full translate-x-1 flex-row gap-4">
                <div className="relative mt-4 flex flex-col items-center">
                  <Image
                    src={
                      commit.commitAuthorAvatar
                        ? commit.commitAuthorAvatar
                        : "/images/default-user.jpg"
                    }
                    alt="avatar"
                    height={30}
                    width={30}
                    className="z-10 rounded-full"
                  />
                  {index !== commits.length - 1 && (
                    <div className="bg-primary absolute top-8 h-full w-px" />
                  )}
                </div>
                <Card className="w-full border-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {commit.commitMessage}{" "}
                      <span className="inline-block">
                        <Link
                          href={`${project?.githubUrl}/commit/${commit.commitHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <SquareArrowOutUpRight className="size-4" />
                        </Link>
                      </span>
                    </CardTitle>
                    <CardDescription>
                      {commit.commitAuthorName} -{" "}
                      <FormattedDate date={commit.commitDate} />
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {commit.summary ? (
                      commit.summary.split("*").map((item, index) => {
                        const trimmedItem = robustTrim(item);
                        if (trimmedItem) {
                          return (
                            <pre key={index} className="whitespace-pre-wrap">
                              - {trimmedItem}.
                            </pre>
                          );
                        }
                        return null;
                      })
                    ) : (
                      <li>No summary available.</li>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </li>
        ))
      )}
    </ul>
  );
  
};

export default CommitLog;
