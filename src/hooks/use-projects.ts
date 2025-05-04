import { api } from '@/trpc/react';
import { useSessionStorage } from 'usehooks-ts';

export function useProject()
{
    const {data: projects} = api.project.getProjects.useQuery()
    const [projectId, setProjectId] = useSessionStorage('zume-projectId', '');
    const project = projects?.find(project => project.id === projectId)

    return {project, projects, projectId, setProjectId}
}
