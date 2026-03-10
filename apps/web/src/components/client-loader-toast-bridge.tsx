import { useEffect } from "react"
import { toast } from "sonner"
import {
  flushQueuedClientLoaderToasts,
  getQueuedClientToastEventName,
} from "~/lib/client-loader-toast"

export function ClientLoaderToastBridge() {
  useEffect(() => {
    const flushToasts = () => {
      flushQueuedClientLoaderToasts({
        notifyInfo: (message) => {
          toast.info(message)
        },
      })
    }

    flushToasts()

    window.addEventListener(getQueuedClientToastEventName(), flushToasts)

    return () => {
      window.removeEventListener(getQueuedClientToastEventName(), flushToasts)
    }
  }, [])

  return null
}
