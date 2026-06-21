import type { Metadata } from "next";
import { Geist, Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { Providers } from "@/components/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const cormorantGaramond = Cormorant_Garamond({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  style: ["normal", "italic"],
  display: "swap",
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
        variables: {
          colorPrimary: "#46553d",
          colorPrimaryForeground: "#fffefb",
          colorBackground: "#fffefb",
          colorForeground: "#1c1917",
          colorMutedForeground: "#78716c",
          colorInput: "#fffefb",
          colorInputForeground: "#1c1917",
          colorNeutral: "#1c1917",
          colorRing: "#849685",
          colorShimmer: "#ebdcd0",
          borderRadius: "0.5rem",
          fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
          fontFamilyButtons: "var(--font-geist-sans), system-ui, sans-serif",
          fontSize: "0.875rem",
          fontWeight: { normal: 400, medium: 500, bold: 600 },
        },
        elements: {
          rootBox: "font-sans",
          socialButtonsBlockButton: {
            background: "#fffefb",
            border: "1px solid #ebdcd0",
            borderRadius: "0.5rem",
            color: "#1c1917",
            fontSize: "0.875rem",
            fontWeight: "500",
            padding: "0.5rem 1rem",
            transition: "background 200ms, border-color 200ms",
            "&:hover": { background: "#f5ece3" },
          },
          socialButtonsBlockButtonText: {
            color: "#1c1917",
            fontWeight: "500",
          },
          dividerLine: { background: "#ebdcd0" },
          dividerText: { color: "#a8a29e", fontSize: "0.75rem" },
          formFieldLabel: {
            fontSize: "0.8rem",
            fontWeight: "500",
            color: "#1c1917",
          },
          formFieldInput: {
            background: "transparent",
            border: "none",
            borderBottom: "1px solid #ebdcd0",
            borderRadius: "0px",
            color: "#1c1917",
            fontSize: "0.875rem",
            padding: "0.5rem 0.25rem",
            transition: "border-color 200ms",
            "&:focus": {
              borderBottom: "1px solid #708272",
              boxShadow: "none",
              outline: "none",
            },
          },
          formButtonPrimary: {
            background: "#46553d",
            color: "#fffefb",
            borderRadius: "0.5rem",
            fontSize: "0.875rem",
            fontWeight: "500",
            textTransform: "none",
            padding: "0.625rem 1.5rem",
            transition: "background 200ms",
            "&:hover": { background: "#3a4733" },
          },
          footerActionText: { fontSize: "0.8rem", color: "#78716c" },
          footerActionLink: {
            fontSize: "0.8rem",
            color: "#46553d",
            fontWeight: "500",
          },
          identityPreviewText: { color: "#1c1917" },
          identityPreviewEditButtonIcon: { color: "#708272" },
          formFieldSuccessText: { color: "#708272" },
          formFieldErrorText: { color: "#963535" },
          alert: {
            background: "#f5ece3",
            border: "1px solid #ebdcd0",
            borderRadius: "0.5rem",
          },
          alertText: { color: "#1c1917" },
          userButtonPopoverCard: {
            background: "#fffefb",
            border: "1px solid #ebdcd0",
            boxShadow: "0 4px 24px rgba(28,25,23,0.12)",
            borderRadius: "0px",
            overflow: "hidden",
          },
          userButtonPopoverUserInfoName: {
            color: "#1c1917",
            fontWeight: "600",
          },
          userButtonPopoverUserInfoEmail: {
            color: "#78716c",
          },
          userButtonPopoverActionButton: {
            background: "#fffefb",
            color: "#1c1917",
            transition: "background 200ms",
            padding: "0.625rem 1rem",
          },
          userButtonPopoverActionButtonText: {
            color: "#1c1917 !important",
            fontWeight: "500",
            fontSize: "0.75rem",
          },
          userButtonPopoverActionButtonIcon: { color: "#708272 !important" },
          userButtonPopoverFooter: {
            background: "#f5ece3",
            borderTop: "1px solid #ebdcd0",
            color: "#78716c",
          },
          userButtonPopoverFooterActionLink: {
            color: "#78716c",
          },
          userButtonPopoverFooterActionText: {
            color: "#78716c",
          },
        },
      }}
    >
      <html
        lang="en"
        className={`${geistSans.variable} ${cormorantGaramond.variable} h-full antialiased`}
      >
        <body className="min-h-full flex flex-col">
          <Providers>{children}</Providers>
        </body>
      </html>
    </ClerkProvider>
  );
}
