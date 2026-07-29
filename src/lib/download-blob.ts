/** Dispara la descarga de un blob en el navegador creando un <a download> temporal. */
export function triggerBlobDownload(data: BlobPart, filename: string, type = 'application/pdf') {
  const blob = new Blob([data], { type })
  const blobUrl = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = blobUrl
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(blobUrl)
}
