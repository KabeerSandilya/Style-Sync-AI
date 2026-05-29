import type { Metadata } from "next";
import { Geist, Geist_Mono, Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/ui/themes";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const cormorantGaramond = Cormorant_Garamond({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "StyleSync AI",
  description: "Your personalized AI-powered digital wardrobe platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      appearance={{
        theme: dark,
        variables: {
          colorPrimary: "var(--primary)",
          colorBackground: "var(--card)",
          colorForeground: "var(--foreground)",
          colorMutedForeground: "var(--muted-foreground)",
          colorInput: "var(--background)",
          colorInputForeground: "var(--foreground)",
          colorBorder: "var(--border)",
          borderRadius: "var(--radius)",
          fontFamily: "var(--font-sans)",
        },
        elements: {
          card: "border border-border/80 shadow-sm bg-card rounded-[var(--radius)]",
          headerTitle: "font-serif text-2xl font-medium tracking-tight text-foreground",
          headerSubtitle: "font-sans text-xs text-muted-foreground",
          socialButtonsBlockButton: "border border-border/60 rounded-[var(--radius)] bg-background hover:bg-accent/40 text-foreground transition-all duration-200 font-sans font-medium text-xs py-2 shadow-sm",
          socialButtonsBlockButtonText: "font-sans font-medium text-foreground",
          formButtonPrimary: "rounded-[var(--radius)] bg-primary text-primary-foreground hover:bg-primary/90 font-sans font-medium tracking-wide text-xs py-2.5 transition-colors shadow-sm",
          formFieldLabel: "text-[11px] font-semibold text-muted-foreground uppercase tracking-wider",
          formFieldInput: "rounded-[var(--radius)] bg-background/50 border border-border/80 text-foreground focus:border-primary focus:ring-1 focus:ring-primary/40 text-sm transition-colors py-2",
          footerActionText: "font-sans text-xs text-muted-foreground",
          footerActionLink: "font-sans text-xs text-primary hover:text-primary/90 hover:underline transition-colors font-medium",
          identityPreviewText: "text-foreground",
          identityPreviewEditButtonIcon: "text-primary",
          formFieldSuccessText: "text-primary",
          formFieldErrorText: "text-destructive",
          alertText: "text-foreground",
          alert: "bg-background border border-border/80 rounded-[var(--radius)]",
          userButtonPopoverCard: "border border-border/80 shadow-md bg-card rounded-[var(--radius)]",
          userButtonPopoverActionButton: "hover:bg-accent/40 text-foreground transition-all duration-200 py-2.5 px-4",
          userButtonPopoverActionButtonText: "text-foreground font-sans font-medium text-xs",
          userButtonPopoverActionButtonIcon: "text-foreground/80",
          userButtonPopoverFooter: "bg-muted/30 border-t border-border/40 text-muted-foreground",
        }
      }}
    >
      <html
        lang="en"
        className={`${geistSans.variable} ${geistMono.variable} ${cormorantGaramond.variable} h-full antialiased`}
      >
        <body className="min-h-full flex flex-col">{children}</body>
      </html>
    </ClerkProvider>
  );
}
