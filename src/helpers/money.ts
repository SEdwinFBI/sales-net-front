function formatCurrency(value: number) {
    return new Intl.NumberFormat('es-GT', {
        style: 'currency',
        currency: 'GTQ',
    }).format(value)
}

function formatNumber(value: number) {
    return new Intl.NumberFormat('es-GT').format(value)
}

export {
    formatCurrency,
    formatNumber,
}
