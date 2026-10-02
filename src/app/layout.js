import './globals.css';

export const metadata = {
  title: 'Rishi Hairstyles - Men\'s & Beauty Salon',
  description: 'Your Beauty, Our Priority - Premium Salon Booking and Management.',
  manifest: '/manifest.json',
  themeColor: '#0A0A0F',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
