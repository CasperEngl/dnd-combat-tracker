import { Navigate } from "react-router"
import { LoadingScreen } from "~/components/loading-screen"
import { convexApi } from "~/generated/convex-api"
import { getHomeRedirectTarget } from "~/lib/character-routing"

export default function HomeRoute() {
  const { isAuthenticated, isLoading } = convexApi.auth.useState()
  const appState = convexApi.queries.characters.useAppState()

  if (isLoading || appState === undefined) {
    return <LoadingScreen />
  }

  if (!isAuthenticated) {
    return <Navigate replace to="/sign-in" />
  }

  return <Navigate replace to={getHomeRedirectTarget(appState)} />
}
