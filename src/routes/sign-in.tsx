import { Navigate } from "react-router"
import { AuthForm } from "~/components/auth-form"
import { LoadingScreen } from "~/components/loading-screen"
import { useAppState, useAuthState } from "~/context/app-services-context"
import { getHomeRedirectTarget } from "~/lib/character-routing"

export default function SignInRoute() {
  const { isAuthenticated, isLoading } = useAuthState()
  const appState = useAppState()

  if (isLoading || (isAuthenticated && appState === undefined)) {
    return <LoadingScreen />
  }

  if (isAuthenticated && appState) {
    return <Navigate replace to={getHomeRedirectTarget(appState)} />
  }

  return <AuthForm />
}
