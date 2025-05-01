import { useMutation, useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

/**
 * Custom hook for creating API requests with React Query
 * Provides a standardized way to fetch and mutate data with error handling
 */
export const useApi = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  /**
   * Create a query for fetching data from the API
   */
  const createQuery = <TData>(
    queryKey: string | string[],
    options?: {
      onSuccess?: (data: TData) => void;
      onError?: (error: Error) => void;
      enabled?: boolean;
      keepPreviousData?: boolean;
      staleTime?: number;
    }
  ) => {
    const key = Array.isArray(queryKey) ? queryKey : [queryKey];

    const queryOptions: UseQueryOptions<TData, Error> = {
      queryKey: key,
      enabled: options?.enabled !== false,
      staleTime: options?.staleTime,
    };

    return useQuery<TData, Error>({
      ...queryOptions,
      onError: (error: Error) => {
        // Default error handling
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });

        // Custom error handling if provided
        if (options?.onError) {
          options.onError(error);
        }
      },
      onSuccess: (data: TData) => {
        if (options?.onSuccess) {
          options.onSuccess(data);
        }
      },
    });
  };

  /**
   * Create a mutation for modifying data on the API
   */
  const createMutation = <TVariables, TData>(
    method: 'POST' | 'PUT' | 'DELETE',
    url: string,
    options?: {
      onSuccess?: (data: TData) => void;
      onError?: (error: Error) => void;
      invalidateQueries?: string | string[];
      successMessage?: string;
    }
  ) => {
    return useMutation<TData, Error, TVariables>({
      mutationFn: async (variables: TVariables) => {
        const response = await apiRequest(method, url, variables);
        return await response.json();
      },
      onSuccess: (data: TData) => {
        // Show success message if provided
        if (options?.successMessage) {
          toast({
            title: 'Success',
            description: options.successMessage,
          });
        }

        // Invalidate queries if specified
        if (options?.invalidateQueries) {
          const queries = Array.isArray(options.invalidateQueries)
            ? options.invalidateQueries
            : [options.invalidateQueries];

          queries.forEach((query) => {
            queryClient.invalidateQueries({ queryKey: [query] });
          });
        }

        // Custom success callback
        if (options?.onSuccess) {
          options.onSuccess(data);
        }
      },
      onError: (error: Error) => {
        // Default error handling
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });

        // Custom error handling
        if (options?.onError) {
          options.onError(error);
        }
      },
    });
  };

  return {
    createQuery,
    createMutation,
  };
};
