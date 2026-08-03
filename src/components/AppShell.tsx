import { useState, type ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { Menu, Sun, Moon, ClipboardList, Radio } from 'lucide-react';
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
 * Cáscara compartida: header (hamburguesa + marca + toggle day/night).
 * El side panel de navegación (admin) aparece como overlay sobre el contenido
 * al tocar la hamburguesa — no ocupa ancho permanente.
 */
export function AppShell({ isAdmin, activeView, children }: AppShellProps) {
  const { isDark, toggleDarkMode } = useDarkMode();
  const [navOpen, setNavOpen] = useState(false);

  return (
    <div className="flex h-screen flex-col bg-background">
      <header className="flex items-center justify-between border-b bg-background px-4 py-3">
        <div className="flex items-center gap-2">
          {isAdmin && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setNavOpen(open => !open)}
              aria-label="Abrir navegación"
              className={cn(navOpen && 'bg-muted')}
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}
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

      <div className="relative flex flex-1 overflow-hidden">
        {/* Contenido en su propio stacking context (z-0): nada de lo que haya
            dentro (toggles, selectores de cliente, subheaders) puede pintarse
            por encima del overlay de navegación. */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <div className="h-full">{children}</div>
        </div>

        {isAdmin && navOpen && (
          <>
            <div className="absolute inset-0 z-10 bg-black/40" onClick={() => setNavOpen(false)} />
            <nav className="absolute left-0 top-0 z-20 flex h-full w-48 flex-col gap-1 border-r bg-background p-2 shadow-xl">
              {NAV_ITEMS.map(item => (
                <NavLink
                  key={item.view}
                  to={item.to}
                  onClick={() => setNavOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                      isActive || activeView === item.view
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                    )
                  }
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </>
        )}
      </div>
    </div>
  );
}
