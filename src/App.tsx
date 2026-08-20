import React, { Suspense, lazy, useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { Navbar, NavTab } from './components/Navbar';
import { LoadingScreen } from './components/LoadingScreen';
import { LoginView } from './views/LoginView';
const DashboardView = lazy(() => import('./views/DashboardView').then(m => ({ default: m.DashboardView })));
const PlayersView = lazy(() => import('./views/PlayersView').then(m => ({ default: m.PlayersView })));
const PlayerProfileView = lazy(() => import('./views/PlayerProfileView').then(m => ({ default: m.PlayerProfileView })));
import { AddEditPlayerModal } from './views/AddEditPlayerModal';
const PaymentsView = lazy(() => import('./views/PaymentsView').then(m => ({ default: m.PaymentsView })));
const AttendanceView = lazy(() => import('./views/AttendanceView').then(m => ({ default: m.AttendanceView })));
const FinancialReportsView = lazy(() => import('./views/FinancialReportsView').then(m => ({ default: m.FinancialReportsView })));
const CoachesView = lazy(() => import('./views/CoachesView').then(m => ({ default: m.CoachesView })));
const ActivityLogsView = lazy(() => import('./views/ActivityLogsView').then(m => ({ default: m.ActivityLogsView })));
const SettingsView = lazy(() => import('./views/SettingsView').then(m => ({ default: m.SettingsView })));
import { Footer } from './components/Footer';
import { Player } from './types';

const MainApp: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [isInitialBoot, setIsInitialBoot] = useState(true);
  const [currentTab, setCurrentTab] = useState<NavTab>(() => {
    const saved = localStorage.getItem('ifc_active_tab');
    if (saved && ['dashboard', 'players', 'player-profile', 'payments', 'financial', 'coaches', 'attendance', 'activity-logs', 'settings'].includes(saved)) {
      return saved as NavTab;
    }
    return 'dashboard';
  });
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(() => {
    return localStorage.getItem('ifc_active_player_id') || null;
  });

  // Player Add/Edit Modal
  const [isPlayerModalOpen, setIsPlayerModalOpen] = useState(false);
  const [playerToEdit, setPlayerToEdit] = useState<Player | null>(null);

  React.useEffect(() => {
    localStorage.setItem('ifc_active_tab', currentTab);
  }, [currentTab]);

  React.useEffect(() => {
    if (selectedPlayerId) {
      localStorage.setItem('ifc_active_player_id', selectedPlayerId);
    } else {
      localStorage.removeItem('ifc_active_player_id');
    }
  }, [selectedPlayerId]);

  if (isInitialBoot || isLoading) {
    return <LoadingScreen onComplete={() => setIsInitialBoot(false)} />;
  }

  if (!isAuthenticated) {
    return <LoginView />;
  }

  const handleSelectPlayer = (id: string) => {
    setSelectedPlayerId(id);
    setCurrentTab('player-profile');
  };

  const handleOpenAddPlayer = () => {
    setPlayerToEdit(null);
    setIsPlayerModalOpen(true);
  };

  const handleOpenEditPlayer = (player: Player) => {
    setPlayerToEdit(player);
    setIsPlayerModalOpen(true);
  };

  const handlePlayerSaved = (player: Player) => {
    if (selectedPlayerId === player.id) {
      setSelectedPlayerId(player.id);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-[#f4f4f5] font-sans selection:bg-yellow-400 selection:text-black antialiased flex flex-col">
      {/* Top Fixed Sticky Navbar (NO SIDEBAR) */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={tab => {
          if (tab !== 'player-profile') {
            setSelectedPlayerId(null);
          }
          setCurrentTab(tab);
        }}
        onSelectPlayer={handleSelectPlayer}
      />

      {/* Main Page Canvas */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <Suspense fallback={<div className="min-h-[40vh] flex items-center justify-center text-yellow-400">جاري تحميل الصفحة...</div>}>
        {currentTab === 'dashboard' && (
          <DashboardView
            onNavigate={tab => setCurrentTab(tab)}
            onOpenAddPlayer={handleOpenAddPlayer}
          />
        )}

        {currentTab === 'players' && (
          <PlayersView
            onSelectPlayer={handleSelectPlayer}
            onOpenAddPlayer={handleOpenAddPlayer}
            onEditPlayer={handleOpenEditPlayer}
          />
        )}

        {currentTab === 'player-profile' && selectedPlayerId && (
          <PlayerProfileView
            playerId={selectedPlayerId}
            onBack={() => setCurrentTab('players')}
            onEditPlayer={handleOpenEditPlayer}
            onOpenAddPayment={() => {
              setCurrentTab('payments');
            }}
          />
        )}

        {currentTab === 'payments' && (
          <PaymentsView onSelectPlayer={handleSelectPlayer} />
        )}

        {currentTab === 'financial' && (
          <FinancialReportsView />
        )}

        {currentTab === 'coaches' && (
          <CoachesView onNavigateToFinancial={() => setCurrentTab('financial')} />
        )}

        {currentTab === 'attendance' && (
          <AttendanceView onSelectPlayer={handleSelectPlayer} />
        )}

        {currentTab === 'activity-logs' && (
          <ActivityLogsView />
        )}

        {currentTab === 'settings' && <SettingsView />}
        </Suspense>
      </main>

      {/* Global Footer */}
      <Footer className="mt-12" />

      {/* Global Add/Edit Player Modal */}
      <AddEditPlayerModal
        isOpen={isPlayerModalOpen}
        playerToEdit={playerToEdit}
        onClose={() => {
          setIsPlayerModalOpen(false);
          setPlayerToEdit(null);
        }}
        onSaved={handlePlayerSaved}
      />
    </div>
  );
};


export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </ToastProvider>
  );
}
