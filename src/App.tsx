import { useState, useEffect } from 'react';
import { KioskContainer } from './components/layout/KioskContainer';
import { HomePage } from './pages/HomePage';
import { DocumentsPage } from './pages/DocumentsPage';
import { DrawingPage } from './pages/DrawingPage';
import { UseCasePage } from './pages/UseCasePage';
import { AutomationPage } from './pages/AutomationPage';
import { ProductsPage } from './pages/ProductsPage';
import { CompanionProvider, useCompanion } from './components/companion/CompanionContext';
import { CompanionDock } from './components/companion/CompanionDock';
import type { WorkspaceId, StagedFile } from './types';

function AppContent() {
  const [activeWorkspace, setActiveWorkspace] = useState<WorkspaceId>('home');
  const [stagedFiles, setStagedFiles] = useState<StagedFile[]>([]);
  const { emitEvent } = useCompanion();

  const handleNavigateToWorkspace = (workspace: WorkspaceId) => {
    setActiveWorkspace(workspace);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    emitEvent({
      type: 'WORKSPACE_CHANGED',
      payload: { workspaceId: workspace, hasUserGesture: true },
    });
  };

  const handleReturnToHome = () => {
    setActiveWorkspace('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    emitEvent({
      type: 'WORKSPACE_CHANGED',
      payload: { workspaceId: 'home', hasUserGesture: true },
    });
  };

  const handleFileStaged = (file: StagedFile) => {
    setStagedFiles((prev) => {
      if (prev.some((f) => f.id === file.id)) return prev;
      return [...prev, file];
    });
  };

  // Keyboard shortcut: Escape returns to Home view
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && activeWorkspace !== 'home') {
        handleReturnToHome();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeWorkspace]);

  return (
    <KioskContainer onResetToHome={activeWorkspace !== 'home' ? handleReturnToHome : undefined}>
      {activeWorkspace === 'home' && (
        <HomePage
          onNavigateToWorkspace={handleNavigateToWorkspace}
          onFileStaged={handleFileStaged}
          stagedFiles={stagedFiles}
        />
      )}

      {activeWorkspace === 'documents' && (
        <DocumentsPage
          onReturn={handleReturnToHome}
          initialStagedFiles={stagedFiles}
        />
      )}

      {activeWorkspace === 'drawing' && (
        <DrawingPage
          onReturn={handleReturnToHome}
          initialStagedFiles={stagedFiles}
        />
      )}

      {activeWorkspace === 'use-case' && (
        <UseCasePage onReturn={handleReturnToHome} />
      )}

      {activeWorkspace === 'automation' && (
        <AutomationPage onReturn={handleReturnToHome} />
      )}

      {activeWorkspace === 'products' && (
        <ProductsPage onReturn={handleReturnToHome} />
      )}

      {/* Persistent Companion Dock across all 5 workspace screens */}
      {activeWorkspace !== 'home' && <CompanionDock />}
    </KioskContainer>
  );
}

export function App() {
  return (
    <CompanionProvider>
      <AppContent />
    </CompanionProvider>
  );
}

export default App;
