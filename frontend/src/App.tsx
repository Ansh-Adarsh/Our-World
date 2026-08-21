import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Landing } from '@/pages/Landing/Landing';
import { Auth } from '@/pages/Auth/Auth';
import { Home } from '@/pages/Home/Home';
import { Onboarding } from '@/pages/Onboarding/Onboarding';
import { Memories } from '@/pages/Memories/Memories';
import { Diary } from '@/pages/Diary/Diary';
import { Events } from '@/pages/Events/Events';
import { Messages } from '@/pages/Messages/Messages';
import { Playlist } from '@/pages/Playlist/Playlist';
import { Gifts } from '@/pages/Gifts/Gifts';
import { Quizzes } from '@/pages/Quizzes/Quizzes';
import { UnderstandingCorner } from '@/pages/Understanding/UnderstandingCorner';
import { MoreMenu } from '@/pages/More/MoreMenu';
import { Settings } from '@/pages/Settings/Settings';
import { BirthdayExperience } from '@/pages/Birthday/BirthdayExperience';
import { BirthdaySurprise } from '@/pages/Journey/BirthdaySurprise';
import { MemoriesIntro } from '@/pages/Journey/MemoriesIntro';
import { AppShell } from '@/components/layout/AppShell';
import { PageTransition } from '@/components/layout/PageTransition';
import { ToastContainer } from '@/components/ui/Toast';
import { useAuthStore } from '@/stores/authStore';
import { Spinner } from '@/components/ui/Spinner';
import { routeForStatus } from '@/routes/journeyRoutes';

function RootRedirect() {
  const { isAuthenticated, isLoading, onboardingStatus } = useAuthStore();
  if (isLoading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Navigate to={routeForStatus(onboardingStatus)} replace />;
}

export function App() {
  const { initialize, isLoading } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-dvh bg-our-world">
        <div className="flex flex-col items-center gap-4">
          <Spinner size="lg" />
          <p
            className="text-[#E98DA3]/50 text-sm tracking-widest uppercase"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
          >
            Our World
          </p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <PageTransition>
        <Routes>
          {/* Public / Entry Routes */}
          <Route path="/" element={<RootRedirect />} />
          <Route path="/login" element={<Auth />} />
          <Route path="/auth" element={<Navigate to="/login" replace />} />
          <Route path="/welcome" element={<Landing />} />

          {/* Protected — AppShell handles auth guard, JourneyGuard the onboarding-journey guard */}
          <Route element={<AppShell />}>
            <Route path="/home" element={<Home />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/memories" element={<Memories />} />
            <Route path="/diary" element={<Diary />} />
            <Route path="/events" element={<Events />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/playlist" element={<Playlist />} />
            <Route path="/gifts" element={<Gifts />} />
            <Route path="/quizzes" element={<Quizzes />} />
            <Route path="/understanding" element={<UnderstandingCorner />} />
            <Route path="/more" element={<MoreMenu />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/birthday" element={<BirthdayExperience />} />

            {/* First-entry journey — reachable only at the matching status */}
            <Route path="/journey/birthday" element={<BirthdaySurprise />} />
            <Route path="/journey/memories" element={<MemoriesIntro />} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </PageTransition>
      <ToastContainer />
    </BrowserRouter>
  );
}
