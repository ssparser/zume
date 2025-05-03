import { useQueryClient } from '@tanstack/react-query'

export function useRefetch() {
    const queryClient = useQueryClient()
    return async() => {
        await queryClient.refetchQueries({
            type: 'active'
        })
    }
 
}
