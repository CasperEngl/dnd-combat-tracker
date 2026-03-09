import { ConvexAuthProvider } from "@convex-dev/auth/react"
import { ConvexReactClient } from "convex/react"
import type { ReactNode } from "react"
import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router"
import { Toaster } from "sonner"
import type { Route } from "./+types/root"
import { ClientLoaderToastBridge } from "./components/client-loader-toast-bridge"
import { LoadingScreen } from "./components/loading-screen"
import "./index.css"

const convexUrl = import.meta.env.VITE_CONVEX_URL

if (!convexUrl) {
  throw new Error("VITE_CONVEX_URL is missing. Run Convex setup first.")
}

const convex = new ConvexReactClient(convexUrl)

export function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta content="width=device-width, initial-scale=1" name="viewport" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  )
}

export default function App() {
  return (
    <ConvexAuthProvider client={convex}>
      <Toaster position="top-center" richColors />
      <ClientLoaderToastBridge />
      <Outlet />
    </ConvexAuthProvider>
  )
}

export function HydrateFallback() {
  return <LoadingScreen detail="Loading your character tracker." />
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Something went wrong"
  let detail = "The character tracker hit an unexpected error."

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "Page not found" : "Route error"
    detail = error.statusText || detail
  } else if (error instanceof Error) {
    detail = error.message
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-warm-950 px-4 text-warm-100">
      <div className="max-w-lg rounded-2xl border border-warm-700 bg-warm-900 px-5 py-4 text-center">
        <p className="text-[10px] font-mono font-semibold uppercase tracking-[0.25em] text-amber-400">
          Error
        </p>
        <h1 className="mt-2 text-2xl font-bold text-warm-50">{message}</h1>
        <p className="mt-2 text-sm text-warm-300">{detail}</p>
      </div>
    </main>
  )
}
