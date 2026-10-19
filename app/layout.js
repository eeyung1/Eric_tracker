import './globals.css';
export const metadata = { title: "Eric's Growth Track", description: 'Evening sessions, assignments, and class confidence.' };
export default function RootLayout({ children }) {
  return <html lang="en"><body>{children}</body></html>;
}
