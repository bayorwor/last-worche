// The backend answers with JSON, or with CSV for a download. Anything else means the request went to the wrong
// place. The mobile app and many web hosts answer unknown paths with index.html and status 200, which would
// otherwise look like success and crash the page that reads the data.
const API_CONTENT_TYPES = ['application/json', 'text/csv']

export function assertApiResponse(contentType: unknown) {
  if (typeof contentType !== 'string' || !API_CONTENT_TYPES.some((type) => contentType.includes(type))) {
    throw new Error(`Expected an answer from the API, but received ${String(contentType)}.`)
  }
}
