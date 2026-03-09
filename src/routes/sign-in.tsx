import { Navigate } from "react-router"
import { AuthForm } from "~/components/auth-form"
import { LoadingScreen } from "~/components/loading-screen"
import { convexApi } from "~/generated/convex-api"
import { getHomeRedirectTarget } from "~/lib/character-routing"

export default function SignInRoute() {
  const { isAuthenticated, isLoading } = convexApi.auth.useState()
  const appState = convexApi.queries.characters.useAppState()

  if (isLoading || (isAuthenticated && appState === undefined)) {
    return <LoadingScreen />
  }

  if (isAuthenticated && appState) {
    return <Navigate replace to={getHomeRedirectTarget(appState)} />
  }

  return <AuthForm />
}
