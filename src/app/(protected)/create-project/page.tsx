"use client";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type DefaultValues } from "react-hook-form";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import { useRefetch } from "@/hooks/use-refetch";

export const formSchema = z.object({
  githubUrl: z.string().url("Enter a valid repository URL."),
  projectName: z.string().min(3, "Project name must be at least 3 characters."),
  githubToken: z.string().optional(),
});

const page = () => {
  type formData = z.infer<typeof formSchema>;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const createProject = api.project.createProject.useMutation();
  const refetch = useRefetch()

  const defaultValues: DefaultValues<formData> = {
    githubUrl: "",
    projectName: "",
    githubToken: "",
  };

  const form = useForm<formData>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultValues,
  });
  const { reset } = form;
  const onSubmit = (data: formData) => {
    setIsSubmitting(true);

    createProject.mutate(
      {
        githubUrl: data.githubUrl,
        projectName: data.projectName,
        githubToken: data.githubToken,
      },
      {
        onSuccess: () => {
          toast("New Project as been created", {
            action: {
              label: "X",
              onClick: () => console.log("X"),
            },
          });
          refetch()
          reset(defaultValues);
        },
        onError: () => {
          toast.error("Cannot create project", {
            action: {
              label: "X",
              onClick: () => console.log("X"),
            },
          });
        },
      },
    );
    setIsSubmitting(false);
  };

  return (
    <div className="flex h-full items-center justify-center gap-12">
      <div>
        <h1 className="text-2xl font-semibold">Link your GitHub Repo</h1>
        <p className="text-muted-foreground text-sm">Enter URL of your repo</p>

        <div className="h-4" />

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="w-full space-y-6"
          >
            <FormField
              control={form.control}
              name="githubUrl"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>Github URL</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your github URL" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="projectName"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>Project Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your project name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="githubToken"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>GitHub Token</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter your GitHub token (optional)"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="cursor-pointer">
              {isSubmitting ? "Creating..." : "Create Project"}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default page;
