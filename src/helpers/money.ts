function formatCurrency(value: number) {
    return new Intl.NumberFormat('es-GT', {
        style: 'currency',
        currency: 'GTQ',
    }).format(value)
}

export {
    formatCurrency
}