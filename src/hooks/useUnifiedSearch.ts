import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useDebounce } from "./useDebounce";
import type { SearchResponse, SearchScope } from "@/types/search";

export function useUnifiedSearch(
  query: string,
  scope: SearchScope = "all",
  enabled = true,
) {
  const debouncedQuery = useDebounce(query, 250);

  return useQuery({
    queryKey: ["unified-search", debouncedQuery, scope],
    queryFn: async (): Promise<SearchResponse> => {
      if (!debouncedQuery || debouncedQuery.length < 2) {
        return {
          query: debouncedQuery,
          parsed: debouncedQuery,
          filters: {},
          scope,
          results: [],
          total: 0,
        };
      }

      const { data, error } = await supabase.functions.invoke("search", {
        body: { q: debouncedQuery, scope, limit: 20 },
      });

      if (error) throw error;
      return data;
    },
    enabled: enabled && debouncedQuery.length >= 2,
    staleTime: 30000, // 30 segundos
  });
}
