import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Toaster } from "sonner";
import { ThemeProvider } from "next-themes";
import "./globals.css";

/** Poppins, comme Reinvent Labs Academy dont l'identité inspire celle-ci. */
const poppins = localFont({
  src: [
    { path: "../../public/fonts/Poppins-Regular.ttf", weight: "400" },
    { path: "../../public/fonts/Poppins-Regular.ttf", weight: "500" },
    { path: "../../public/fonts/Poppins-SemiBold.ttf", weight: "600" },
    { path: "../../public/fonts/Poppins-Bold.ttf", weight: "700" },
  ],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "Comptoir : gestion de commerce", template: "%s | Comptoir" },
  description: "Stock, ventes, factures et équipe : gérez votre commerce depuis une seule application, gratuit pour démarrer.",
  applicationName: "Comptoir",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f3f2ee" },
    { media: "(prefers-color-scheme: dark)", color: "#121620" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning className={poppins.variable}>
      <body className="min-h-dvh antialiased">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
          {children}
          <Toaster position="top-center" richColors />
        </ThemeProvider>
      </body>
    </html>
  );
}
