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
        githubToken: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const project = await ctx.db.project.create({
          data: {
            githubUrl: input.githubUrl,
            projectName: input.projectName,
            githubToken: input.githubToken,
            userToProjects: {
              create: {
                userId: ctx.user.userId!,
              },
            },
          },
        });
        
        try {
          await indexGithubRepo(project.id, input.githubUrl, input.githubToken)
          await pollCommits(project.id);
        } catch (error) {
          console.error("Failed to poll commits:", error);
          try {
            await ctx.db.project.delete({
              where: {
          id: project.id,
              },
            });
            console.log("Successfully deleted project after poll commits failure.");
          } catch (deleteError) {
            console.error("Failed to delete project after poll commits failure:", deleteError);
            // Consider more robust error handling here, such as logging to an error tracking service.
          }
          throw new Error("Failed to poll commits and project creation was rolled back.");
        }

        return project;
      } catch (error) {
        console.error("Failed to create project:", error);
        throw new Error("Failed to create project");
      }
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
      await pollCommits(projectId, true).then().catch(console.error)
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
