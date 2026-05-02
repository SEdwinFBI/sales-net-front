import { queryKeys } from "@/lib/query-keys"
import { useQuery } from "@tanstack/react-query"
import { getProducts } from "../services/products-service"
import type { Product } from "../types/sales"

export const useProduct = () => {
    const { data, isLoading, isError } = useQuery<Product[]>(
        {
            queryKey: queryKeys.sales.list(),
            queryFn: getProducts,
            staleTime: 1000 * 60 * 15, // 15 min
        }
    )
    return {
        data: data ?? [],
        isLoading,
        isError
    }
}