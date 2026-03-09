import { Navigate } from "react-router"
import { LoadingScreen } from "~/components/loading-screen"
import { useAppState, useAuthState } from "~/context/app-services-context"
import { getHomeRedirectTarget } from "~/lib/character-routing"

export default function HomeRoute() {
  const { isAuthenticated, isLoading } = useAuthState()
  const appState = useAppState()

  if (isLoading || appState === undefined) {
    return <LoadingScreen />
  }

  if (!isAuthenticated) {
    return <Navigate replace to="/sign-in" />
  }

  return <Navigate replace to={getHomeRedirectTarget(appState)} />
}
