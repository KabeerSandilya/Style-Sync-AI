import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="min-h-screen w-full flex bg-background text-foreground">
      {/* Left Panel - Brand Presentation (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-16 border-r border-border/30 bg-card/20 select-none">
        {/* Understated Logo */}
        <div className="flex items-center">
          <span className="font-serif text-lg tracking-wide uppercase font-semibold text-primary">StyleSync AI</span>
        </div>

        {/* Brand Pitch & Tagline */}
        <div className="flex flex-col gap-6 max-w-md my-auto">
          <h2 className="font-serif text-4xl font-medium leading-tight text-foreground">
            Dress better with what you <span className="italic font-light text-primary">already own</span>.
          </h2>
          <p className="font-sans text-sm text-muted-foreground leading-relaxed">
            StyleSync AI redefines your daily silhouette by combining a digital inventory of your wardrobe with weather-aware styling recommendations, driven by aesthetic-focused artificial intelligence.
          </p>
          <div className="h-px w-12 bg-border/80 my-2" />
          
          {/* Minimal Feature List */}
          <ul className="flex flex-col gap-3 font-sans text-xs text-foreground/80 tracking-wide font-medium">
            <li className="flex items-center gap-3">
              <span className="w-1.5 h-1.5 bg-primary" />
              Organize your digital wardrobe
            </li>
            <li className="flex items-center gap-3">
              <span className="w-1.5 h-1.5 bg-primary" />
              Get AI-powered outfit recommendations
            </li>
            <li className="flex items-center gap-3">
              <span className="w-1.5 h-1.5 bg-primary" />
              Dress for the weather and setting
            </li>
          </ul>
        </div>

        {/* Small Footer Detail */}
        <div className="font-sans text-[10px] text-muted-foreground uppercase tracking-widest">
          © 2026 StyleSync AI / Editorial Boutique
        </div>
      </div>

      {/* Right Panel - Auth Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12">
        <SignIn />
      </div>
    </div>
  );
}
