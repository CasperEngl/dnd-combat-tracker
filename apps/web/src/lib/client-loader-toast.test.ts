import { describe, expect, spyOn, test } from "bun:test"
import { toast } from "sonner"
import {
  flushQueuedClientLoaderToasts,
  queueClientLoaderInfoToast,
} from "~/lib/client-loader-toast"

const buildStorage = () => {
  const values = new Map<string, string>()

  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value)
    },
    removeItem: (key: string) => {
      values.delete(key)
    },
  }
}

describe("client loader toast", () => {
  test("uses sonner by default when flushing queued toasts", () => {
    const toastInfo = spyOn(toast, "info")
    const storage = buildStorage()

    queueClientLoaderInfoToast("default-notify", {
      storage,
      dispatchQueueEvent: () => {},
    })

    flushQueuedClientLoaderToasts({ storage })

    expect(toastInfo).toHaveBeenCalledWith("default-notify")
    toastInfo.mockRestore()
  })

  test("queues messages in storage", () => {
    const storage = buildStorage()

    queueClientLoaderInfoToast("hello", {
      storage,
      dispatchQueueEvent: () => {},
    })

    expect(storage.getItem("queuedClientToasts")).toBe(
      JSON.stringify(["hello"]),
    )
  })

  test("queues and flushes when toaster is not mounted", () => {
    const messages: string[] = []
    const storage = buildStorage()

    queueClientLoaderInfoToast("queued", {
      storage,
      dispatchQueueEvent: () => {},
    })

    expect(messages).toEqual([])

    flushQueuedClientLoaderToasts({
      storage,
      notifyInfo: (message) => {
        messages.push(message)
      },
    })

    expect(messages).toEqual(["queued"])
  })
})
