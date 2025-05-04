import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { pollCommits } from "@/lib/github";
import { indexGithubRepo } from "@/lib/github-loader";

export const projectRouter = createTRPCRouter({
  createProject: protectedProcedure
    .input(
      z.object({
        projectName: z.string(),
        githubUrl: z.string(),
        githubToken: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const project = await ctx.db.project.create({
        data: {
          githubUrl: input.githubUrl,
          projectName: input.projectName,
          userToProjects: {
            create: {
              userId: ctx.user.userId!,
            },
          },
        },
      });
      await indexGithubRepo(project.id, input.githubUrl, input.githubToken)
      await pollCommits(project.id);
       
      return project;
    }),
  getProjects: protectedProcedure.query(async ({ ctx }) => {
    const projects = await ctx.db.project.findMany({
      where: {
        userToProjects: {
          some: {
            userId: ctx.user.userId!,
          },
        },
      },
    });

    return projects;
  }),
  getCommits: protectedProcedure
    .input(
      z.object({
        projectId: z.string()        
      }),
    )
    .query(async ({ input, ctx }) => {
      const { projectId } = input;
      await pollCommits(projectId).then().catch(console.error)
      const commits = await ctx.db.commit.findMany({
        where: {
          projectId: projectId,

        },
        orderBy: {
          commitDate: "desc",
        },
      });

      return commits;
    }),
});
