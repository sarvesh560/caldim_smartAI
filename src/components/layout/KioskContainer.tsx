import React from 'react';
import { KioskHeader } from './KioskHeader';
import { KioskFooter } from './KioskFooter';


interface KioskContainerProps {
  children: React.ReactNode;
  onResetToHome?: () => void;
}

export const KioskContainer: React.FC<KioskContainerProps> = ({
  children,
  onResetToHome,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        width: '100%',
        position: 'relative',
        overflowX: 'hidden',
      }}
    >
      {/* Kiosk Floating Header */}
      <KioskHeader onResetToHome={onResetToHome} />

      {/* Main Exhibition Content Area */}
      <main
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: '100%',
          position: 'relative',
          zIndex: 5,
        }}
      >
        {children}
      </main>

      {/* Kiosk Modality Footer */}
      <KioskFooter />
    </div>
  );
};
