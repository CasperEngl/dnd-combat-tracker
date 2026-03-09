import { renderToReadableStream } from "react-dom/server"
import type { EntryContext } from "react-router"
import { ServerRouter } from "react-router"

export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  context: EntryContext,
) {
  responseHeaders.set("Content-Type", "text/html")

  const markup = await renderToReadableStream(
    <ServerRouter context={context} url={request.url} />,
  )

  return new Response(markup, {
    status: responseStatusCode,
    headers: responseHeaders,
  })
}
