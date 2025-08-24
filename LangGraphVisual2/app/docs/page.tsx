import { headers } from "next/headers"
import { redirect } from "next/navigation"

export default async function DocsIndexRedirect() {
  const accept = (await headers()).get("accept-language")?.toLowerCase() ?? ""
  const preferred = accept.includes("ko") ? "ko" : "en"
  redirect(`/docs/${preferred}`)
}
