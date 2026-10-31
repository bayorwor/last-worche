// The backend always answers with JSON. Anything else means the request went to the wrong place. The
// mobile app and many web hosts answer unknown paths with index.html and status 200, which would
// otherwise look like success and crash the page that reads the data.
export function assertJsonResponse(contentType: unknown) {
  if (typeof contentType !== 'string' || !contentType.includes('application/json')) {
    throw new Error(`Expected a JSON answer from the API, but received ${String(contentType)}.`)
  }
}
