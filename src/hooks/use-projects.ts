import { api } from '@/trpc/react';
import { useLocalStorage } from 'usehooks-ts';

export function useProject()
{
    const {data: projects} = api.project.getProjects.useQuery()
    const [projectId, setProjectId] = useLocalStorage('zume-projectId', ' ')
    const project = projects?.find(project => project.id === projectId)
    return {project, projects, projectId, setProjectId}
}
