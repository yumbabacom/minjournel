import './globals.css';
import { Merriweather, Montserrat } from 'next/font/google';

// Configure font objects
const merriweather = Merriweather({
  subsets: ['latin'],
  weight: ['300', '700'],
  variable: '--font-merriweather',
});

const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['300', '400', '700'],
  variable: '--font-montserrat',
});

export const metadata = {
  title: 'Journel - Your Personal Journaling Platform',
  description: 'Capture your thoughts, reflect on your days, and discover yourself.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${merriweather.variable} ${montserrat.variable}`}>
      <body>
        {children}
      </body>
    </html>
  );
} 