import { Navigate } from "react-router"
import { LoadingScreen } from "~/components/loading-screen"
import { hookApi } from "~/generated/convex-hook-api"
import { getHomeRedirectTarget } from "~/lib/character-routing"

export default function HomeRoute() {
  const { isAuthenticated, isLoading } = hookApi.auth.useState()
  const appState = hookApi.queries.characters.useAppState()

  if (isLoading || appState === undefined) {
    return <LoadingScreen />
  }

  if (!isAuthenticated) {
    return <Navigate replace to="/sign-in" />
  }

  return <Navigate replace to={getHomeRedirectTarget(appState)} />
}
