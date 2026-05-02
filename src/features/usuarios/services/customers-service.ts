import type { Customer } from '../types/customers-types'


export const getCustomers = async () => {
    try {
        return new Promise<Customer[]>(
            (resolve) => setTimeout(() => resolve(import('../mocks/customers').then((module) => module.mockCustomers)), 500)
        )
    } catch {
        throw new Error('Error al obtener los clientes')
    }

}