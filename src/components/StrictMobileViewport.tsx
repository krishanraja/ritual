import { ReactNode } from 'react';

interface StrictMobileViewportProps {
  children: ReactNode;
}

export const StrictMobileViewport = ({ children }: StrictMobileViewportProps) => {
  return (
    <div className="h-[100dvh] w-full flex flex-col overflow-hidden">
      {/* Content fills all available space */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {children}
      </div>
    </div>
  );
};
