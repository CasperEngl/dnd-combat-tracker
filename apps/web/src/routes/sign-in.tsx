import { hookApi } from "@dnd-combat-tracker/convex/hook-api"
import { Navigate } from "react-router"
import { AuthForm } from "~/components/auth-form"
import { LoadingScreen } from "~/components/loading-screen"
import { getHomeRedirectTarget } from "~/lib/character-routing"

export default function SignInRoute() {
  const { isAuthenticated, isLoading } = hookApi.auth.useState()
  const appState = hookApi.queries.characters.useAppState()

  if (isLoading || (isAuthenticated && appState === undefined)) {
    return <LoadingScreen />
  }

  if (isAuthenticated && appState) {
    return <Navigate replace to={getHomeRedirectTarget(appState)} />
  }

  return <AuthForm />
}
