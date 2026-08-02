import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { Sun, Moon, ClipboardList, Radio } from 'lucide-react';
import { Button } from './ui/button';
import { useDarkMode } from '../hooks/useDarkMode';
import { cn } from './ui/utils';

interface AppShellProps {
  isAdmin: boolean;
  activeView: 'ordering' | 'hub';
  children: ReactNode;
}

const NAV_ITEMS = [
  { to: '/ordering', label: 'Ordenar', icon: ClipboardList, view: 'ordering' },
  { to: '/hub', label: 'Hub', icon: Radio, view: 'hub' },
];

/**
 * Cáscara compartida: header (marca + toggle day/night) que ven tanto admin
 * como usuarios normales, y un side panel de navegación solo para admin
 * (Ordenar / Hub).
 */
export function AppShell({ isAdmin, activeView, children }: AppShellProps) {
  const { isDark, toggleDarkMode } = useDarkMode();

  return (
    <div className="flex h-screen flex-col bg-background">
      <header className="flex items-center justify-between border-b bg-background px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-base font-bold tracking-widest">BARDO</span>
          {!isAdmin && (
            <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-muted-foreground">
              Orden de música
            </span>
          )}
        </div>
        <Button
          variant="outline"
          size="lg"
          onClick={toggleDarkMode}
          className="flex items-center gap-2 px-4"
        >
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          <span className="hidden sm:inline">{isDark ? 'Light' : 'Dark'}</span>
        </Button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {isAdmin && (
          <nav className="flex w-48 shrink-0 flex-col gap-1 border-r bg-background p-2">
            {NAV_ITEMS.map(item => (
              <NavLink
                key={item.view}
                to={item.to}
                className={cn(
                  'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  activeView === item.view
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            ))}
          </nav>
        )}

        <div className="min-w-0 flex-1 overflow-hidden">{children}</div>
      </div>
    </div>
  );
}
