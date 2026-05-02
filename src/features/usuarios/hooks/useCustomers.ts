import { queryKeys } from "@/lib/query-keys"
import { useQuery } from "@tanstack/react-query"
import { getCustomers } from "../services/customers-service"
import type { Customer } from "../types/customers-types"

export const useCustomers = () => {
    const { data, isLoading, isError } = useQuery<Customer[]>(
        {
            queryKey: queryKeys.customers.list(),
            queryFn: getCustomers,
            staleTime: 1000 * 60 * 15,
        }
    )

    return {
        data: data ?? [],
        isLoading,
        isError
    }
}
