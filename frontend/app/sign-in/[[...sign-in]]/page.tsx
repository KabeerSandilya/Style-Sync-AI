import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background px-6 py-12 text-foreground">
      <div className="w-full max-w-[26rem] flex flex-col items-center">
        {/* Wordmark */}
        <span className="font-serif text-base font-semibold tracking-[0.22em] uppercase text-foreground mb-8 select-none">
          StyleSync AI
        </span>

        {/* Card */}
        <div className="w-full bg-card border border-border shadow-[0_4px_24px_rgba(28,25,23,0.06)] px-8 pt-8 pb-6">
          <h1 className="font-serif text-[2rem] leading-[1.12] font-medium text-foreground mb-2 text-center">
            An elegant return to your{" "}
            <span className="italic font-light text-primary">daily silhouette</span>.
          </h1>
          <p className="font-sans text-sm text-muted-foreground mb-6 text-center">
            Welcome back to StyleSync AI.
          </p>

          <SignIn
            appearance={{
              elements: {
                rootBox: { width: "100%", display: "flex", justifyContent: "center" },
                cardBox: { width: "100%", boxShadow: "none", borderRadius: "0px" },
                card: {
                  background: "transparent",
                  border: "none",
                  boxShadow: "none",
                  padding: "0",
                  width: "100%",
                },
                header: { display: "none" },
                main: { width: "100%", alignItems: "center" },
                socialButtonsBlockButton: { justifyContent: "center" },
                form: { width: "100%" },
                formFieldInput: { width: "100%" },
                formButtonPrimary: { width: "100%" },
              },
            }}
          />
        </div>
      </div>
    </div>
  );
}
