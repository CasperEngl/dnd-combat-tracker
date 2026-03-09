import { toast } from "sonner"

const queuedClientToastsStorageKey = "queuedClientToasts"
const queuedClientToastEventName = "queued-client-toast"

type ToastStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">

type ClientToastBridgeOptions = {
  storage?: ToastStorage | null
  dispatchQueueEvent?: () => void
}

const getDefaultStorage = () => {
  if (typeof window === "undefined") {
    return null
  }

  return window.sessionStorage
}

const getQueuedMessages = (storage: ToastStorage | null) => {
  if (!storage) {
    return [] as string[]
  }

  const raw = storage.getItem(queuedClientToastsStorageKey)

  if (!raw) {
    return [] as string[]
  }

  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed)
      ? parsed.filter((entry): entry is string => typeof entry === "string")
      : []
  } catch {
    return [] as string[]
  }
}

const setQueuedMessages = (
  storage: ToastStorage | null,
  messages: string[],
) => {
  if (!storage) {
    return
  }

  if (messages.length === 0) {
    storage.removeItem(queuedClientToastsStorageKey)
    return
  }

  storage.setItem(queuedClientToastsStorageKey, JSON.stringify(messages))
}

const defaultDispatchQueueEvent = () => {
  if (typeof window === "undefined") {
    return
  }

  window.dispatchEvent(new Event(queuedClientToastEventName))
}

const defaultNotifyInfo = (message: string) => {
  toast.info(message)
}

export const queueClientLoaderInfoToast = (
  message: string,
  options: ClientToastBridgeOptions = {},
) => {
  const storage = options.storage ?? getDefaultStorage()
  const dispatchQueueEvent =
    options.dispatchQueueEvent ?? defaultDispatchQueueEvent
  const existingMessages = getQueuedMessages(storage)
  const lastQueuedMessage = existingMessages[existingMessages.length - 1]

  if (lastQueuedMessage === message) {
    dispatchQueueEvent()
    return
  }

  setQueuedMessages(storage, [...existingMessages, message])
  dispatchQueueEvent()
}

export const flushQueuedClientLoaderToasts = (
  options: {
    storage?: ToastStorage | null
    notifyInfo?: (message: string) => void
  } = {},
) => {
  const storage = options.storage ?? getDefaultStorage()
  const notifyInfo = options.notifyInfo ?? defaultNotifyInfo
  const messages = getQueuedMessages(storage)

  if (messages.length === 0) {
    return
  }

  setQueuedMessages(storage, [])

  for (const message of messages) {
    notifyInfo(message)
  }
}

export const getQueuedClientToastEventName = () => queuedClientToastEventName
