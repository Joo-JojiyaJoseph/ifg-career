/**
 * Reads a file into a base64 data URL that also carries its name: "data:image/png;name=logo.png;base64,…".
 * Forms send files this way instead of as file parts, so uploads do not depend on PHP's temporary upload
 * folder (the API's InlineUploads middleware turns them back into normal uploads).
 *
 * @param {File} file
 * @returns {Promise<string>}
 */
export function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const url = String(reader.result)
      const comma = url.indexOf(',')
      const type = file.type || 'application/octet-stream'
      resolve(`data:${type};name=${encodeURIComponent(file.name)};base64,${url.slice(comma + 1)}`)
    }
    reader.onerror = () => reject(reader.error ?? new Error('Could not read the file.'))
    reader.readAsDataURL(file)
  })
}
