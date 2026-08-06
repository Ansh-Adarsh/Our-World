import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Landing } from '@/pages/Landing/Landing';
import { Auth } from '@/pages/Auth/Auth';
import { Home } from '@/pages/Home/Home';
import { Onboarding } from '@/pages/Onboarding/Onboarding';
import { Memories } from '@/pages/Memories/Memories';
import { Diary } from '@/pages/Diary/Diary';
import { MessagesStub, EventsStub, PlaylistStub, GiftsStub } from '@/pages/Stubs/StubPages';
import { AppShell } from '@/components/layout/AppShell';
import { PageTransition } from '@/components/layout/PageTransition';
import { useAuthStore } from '@/stores/authStore';
import { Spinner } from '@/components/ui/Spinner';

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
          {/* Public */}
          <Route path="/" element={<Landing />} />
          <Route path="/auth" element={<Auth />} />

          {/* Protected — AppShell handles auth guard */}
          <Route element={<AppShell />}>
            <Route path="/home" element={<Home />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/memories" element={<Memories />} />
            <Route path="/diary" element={<Diary />} />
            <Route path="/messages" element={<MessagesStub />} />
            <Route path="/events" element={<EventsStub />} />
            <Route path="/playlist" element={<PlaylistStub />} />
            <Route path="/gifts" element={<GiftsStub />} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </PageTransition>
    </BrowserRouter>
  );
}
