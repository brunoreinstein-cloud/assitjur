import { useQuery } from '@tanstack/react-query'
import { explorarTestemunhas, ExplorarResponse } from '@/lib/explorarDados'

export function useExplorarDados(page = 1, pageSize = 10) {
  return useQuery<ExplorarResponse>({
    queryKey: ['explorar-dados', page, pageSize],
    queryFn: () => explorarTestemunhas(page, pageSize)
  })
}

