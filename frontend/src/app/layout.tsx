import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Predictus',
  description: 'Multi-step registration system',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
