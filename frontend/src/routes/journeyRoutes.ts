/**
 * Journey routing — the one place that decides where a user is allowed to be.
 *
 * Both the auth screen's post-login redirect and the route guard read from
 * here, so there is a single answer to "where does this person belong right
 * now?" and no way for the two to disagree.
 */
import type { OnboardingStatus } from '@/types';

export const JOURNEY_PATHS = {
  /** Chapter 1 + 2: the question game. Doubles as the details editor once the
   *  journey is complete (reached from Home, never by redirect). */
  questions: '/onboarding',
  birthday: '/journey/birthday',
  memories: '/journey/memories',
  dashboard: '/home',
} as const;

/** Paths that exist only while the journey is running. */
export const JOURNEY_ONLY_PATHS: readonly string[] = [
  JOURNEY_PATHS.birthday,
  JOURNEY_PATHS.memories,
];

/** True while the user still owes the journey a step. */
export function isJourneyActive(status: OnboardingStatus): boolean {
  return status !== 'completed';
}

/** The single screen this stage of the journey belongs on. */
export function routeForStatus(status: OnboardingStatus): string {
  switch (status) {
    case 'not_started':
      return JOURNEY_PATHS.questions;
    case 'questions_completed':
      return JOURNEY_PATHS.birthday;
    case 'birthday_completed':
    case 'memories_completed':
      // Both stages live on the memories screen: 'birthday_completed' opens the
      // introduction, 'memories_completed' resumes at the timeline.
      return JOURNEY_PATHS.memories;
    case 'completed':
    default:
      return JOURNEY_PATHS.dashboard;
  }
}

/** Journey screens render full-bleed — no bottom dock over them. */
export function isFullscreenPath(pathname: string): boolean {
  return pathname === '/birthday' || pathname.startsWith('/journey/');
}

/**
 * Where should this user be sent, given where they are? Returns null when the
 * current path is allowed.
 *
 *  - Mid-journey: the current stage's screen is the only reachable page.
 *  - Journey finished: the journey-only screens are closed off, so a returning
 *    user can never stumble back into the surprise. Everything else is open,
 *    including /onboarding, which is now the details editor Home links to.
 */
export function resolveJourneyRedirect(
  status: OnboardingStatus,
  pathname: string,
): string | null {
  if (!isJourneyActive(status)) {
    return JOURNEY_ONLY_PATHS.includes(pathname) ? JOURNEY_PATHS.dashboard : null;
  }

  const target = routeForStatus(status);
  return pathname === target ? null : target;
}
