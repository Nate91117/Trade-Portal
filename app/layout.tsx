import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Intercompany Futures Portal',
  description: 'Internal trade entry and management for intercompany futures trades',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-[#F8F9FA] antialiased">{children}</body>
    </html>
  );
}
