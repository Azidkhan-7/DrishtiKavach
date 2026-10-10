import type { Metadata } from 'next';
import './globals.css';
import { TelemetryProvider } from '@/lib/telemetryContext';
import Navbar from '@/components/Navbar';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'DRISHTIKAVACH — Continuous Intelligence for Physical Sensors',
  description:
    'Engineering metrology platform for detecting physical sensor anomalies, drift, noise, spikes, frozen readings, dropouts and false alarms through explainable cross-sensor corroboration.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-[var(--bg-primary)] text-[var(--text-primary)]">
        <TelemetryProvider>
          <Navbar />
          <main className="flex-1">{children}</main>

          {/* Editorial Footer */}
          <footer className="border-t border-technical bg-[var(--bg-secondary)]/60 text-xs font-mono py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-display text-base tracking-tight text-[var(--text-primary)] font-medium">
                    DRISHTIKAVACH
                  </span>
                  <span className="text-[10px] text-[var(--text-muted)] border border-technical px-1.5 py-0.5 rounded">
                    PROD-READY MVP
                  </span>
                </div>
                <p className="text-[11px] text-[var(--text-muted)]">
                  Continuous intelligence & metrological diagnostics for physical sensor streams.
                </p>
              </div>

              {/* Hardware Pin Quick Reference */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-[10px] text-[var(--text-secondary)] border-y md:border-y-0 md:border-x border-technical/80 py-3 md:py-0 md:px-6">
                <div>
                  <span className="text-[var(--text-muted)] block">DHT11 DATA</span>
                  <span className="text-[var(--accent-cyan)] font-semibold">GPIO 4</span>
                </div>
                <div>
                  <span className="text-[var(--text-muted)] block">JSN-SR04T TRIG</span>
                  <span className="text-[var(--state-normal)] font-semibold">GPIO 5</span>
                </div>
                <div>
                  <span className="text-[var(--text-muted)] block">JSN-SR04T ECHO</span>
                  <span className="text-[var(--accent-amber)] font-semibold">GPIO 18 (LVL-SHFT)</span>
                </div>
                <div>
                  <span className="text-[var(--text-muted)] block">LEDS / BUZZER</span>
                  <span className="text-[var(--text-primary)] font-semibold">32, 22 / 23</span>
                </div>
              </div>

              {/* System Nav Links */}
              <div className="flex items-center gap-4 text-[11px] text-[var(--text-muted)]">
                <Link href="/system" className="hover:text-[var(--accent-amber)] transition-colors">
                  System Rig
                </Link>
                <Link href="/live" className="hover:text-[var(--accent-amber)] transition-colors">
                  Live Telemetry
                </Link>
                <Link href="/fault-lab" className="hover:text-[var(--accent-amber)] transition-colors">
                  Fault Lab
                </Link>
                <Link href="/architecture" className="hover:text-[var(--accent-amber)] transition-colors">
                  Architecture
                </Link>
              </div>
            </div>
            
            <div className="max-w-7xl mx-auto pt-6 mt-6 border-t border-technical/40 flex flex-col sm:flex-row items-center justify-between text-[10px] text-[var(--text-muted)] gap-2">
              <span>METROLOGICAL DIAGNOSTICS ARCHITECTURE // NOT A BLACK-BOX MODEL</span>
              <span>PROBABILISTIC REASONING AS ENGINEERING DECISION AID</span>
            </div>
          </footer>
        </TelemetryProvider>
      </body>
    </html>
  );
}
