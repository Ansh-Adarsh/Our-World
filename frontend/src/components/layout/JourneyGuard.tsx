/**
 * JourneyGuard — decides whether the person in front of us is allowed on this
 * route yet, using only the persisted `profiles.onboarding_status`.
 *
 * It sits inside AppShell (which has already established that someone is signed
 * in) and wraps the whole protected tree, so every protected route is covered by
 * construction rather than by remembering to list it:
 *
 *   • mid-journey → sent to the step their status says they are on, from
 *     wherever they typed. /home, /memories, /diary and the rest stay closed.
 *   • journey finished → the journey-only routes disappear; everything else is
 *     theirs, including /onboarding as the plain details editor Home links to.
 *
 * The redirect is declarative (<Navigate>) rather than an effect, so a protected
 * page never renders for a frame before being replaced.
 */
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { resolveJourneyRedirect } from '@/routes/journeyRoutes';

interface JourneyGuardProps {
  children: React.ReactNode;
}

export function JourneyGuard({ children }: JourneyGuardProps) {
  const { onboardingStatus, isAuthenticated, isLoading } = useAuthStore();
  const location = useLocation();

  // Nothing to decide until the session and profile have been read. The store
  // starts everyone as 'completed', so an unresolved session can never flash the
  // journey at a returning user.
  if (isLoading || !isAuthenticated) return <>{children}</>;

  const target = resolveJourneyRedirect(onboardingStatus, location.pathname);
  if (target) return <Navigate to={target} replace />;

  return <>{children}</>;
}
