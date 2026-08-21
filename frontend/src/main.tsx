import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { App } from './App.tsx'

import { useAuthStore } from './stores/authStore'

if (import.meta.env.DEV) {
  (window as any).__useAuthStore = useAuthStore;
  (window as any).__setDevAuth = (status: any = 'completed') => {
    useAuthStore.setState({
      isAuthenticated: true,
      isLoading: false,
      user: {
        id: 'mock-user-id',
        email: 'alex@ourworld.love',
        profile: {
          id: 'mock-user-id',
          display_name: 'Alex & Maya',
          avatar_url: null,
          onboarding_status: status,
          onboarding_step: 0,
          created_at: '2026-01-01',
          updated_at: '2026-01-01',
        },
      },
      couple: {
        id: 'mock-couple-id',
        couple_name: "Alex & Maya's Sanctuary",
        partner_name: 'Maya',
        partner_birthday: '2001-08-25',
        anniversary_date: '2023-02-14',
        partner_1_id: 'mock-user-id',
        partner_2_id: 'mock-partner-id',
        created_at: '2023-02-14',
        updated_at: '2026-01-01',
      },
      onboardingStatus: status,
    });
  };
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
