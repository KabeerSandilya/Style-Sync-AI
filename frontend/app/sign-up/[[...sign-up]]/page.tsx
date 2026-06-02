import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background px-6 py-12 text-foreground">
      <div className="w-full max-w-[26rem] flex flex-col items-center">
        {/* Wordmark */}
        <span className="font-serif text-base tracking-[0.18em] uppercase text-foreground mb-8 select-none">
          StyleSync AI
        </span>

        {/* Card */}
        <div className="w-full bg-card border border-border rounded-xl shadow-[0_4px_24px_rgba(28,25,23,0.06)] px-8 pt-8 pb-6">
          <h1 className="font-serif text-[2rem] leading-[1.12] font-medium text-foreground mb-2">
            An elegant start to your{" "}
            <span className="italic font-light text-primary">daily silhouette</span>.
          </h1>
          <p className="font-sans text-sm text-muted-foreground mb-6">
            Create your refined StyleSync AI account.
          </p>

          <SignUp
            appearance={{
              elements: {
                cardBox: { width: "100%", boxShadow: "none", borderRadius: "0px" },
                card: {
                  background: "transparent",
                  border: "none",
                  boxShadow: "none",
                  padding: "0",
                  width: "100%",
                },
                header: { display: "none" },
              },
            }}
          />
        </div>
      </div>
    </div>
  );
}
