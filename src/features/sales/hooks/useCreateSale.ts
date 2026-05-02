import { useMutation } from "@tanstack/react-query"
import { submitSale } from "../services/products-service"
import type { SubmitSalePayload, SubmitSaleResponse } from "../types/sales"


export const useCreateSale = () => {
    return useMutation<SubmitSaleResponse, Error, SubmitSalePayload>({
        mutationFn: submitSale,
        retry: 3,
    })
}
