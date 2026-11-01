// Hands a file from the server to the browser's own download.
export function downloadFile(content: Blob, fileName: string) {
  const address = URL.createObjectURL(content)
  const link = document.createElement('a')
  link.href = address
  link.download = fileName
  link.click()
  URL.revokeObjectURL(address)
}
