import './globals.css';
import ClientLayout from '@/components/ClientLayout';

export const metadata = {
  title: 'JobCheck — Fake Job Detection',
  description: 'Detect fraudulent job postings with AI-powered analysis. JobCheck exposes scam patterns so you don\'t have to.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="antialiased">
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  );
}
