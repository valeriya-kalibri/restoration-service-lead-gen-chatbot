import Image from "next/image";
import { AppHeader } from "@/components/layout/app-header";
import { createClient } from "@/lib/supabase/server";
import { GetStartedCTA } from "@/components/get-started-cta";

export default async function WelcomePage() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  const isAuthed = !!auth.user;

  return (
    <div className="min-h-screen bg-muted/30">
      <AppHeader title="KALIBRI BUSINESS OPERATIONS AUDIT" />

      <main className="mx-auto max-w-6xl px-4 py-10">
        {/* Hero: image LEFT, text RIGHT */}
        <section className="grid grid-cols-1 items-center gap-8 md:grid-cols-2">
          {/* Left: transparent image (no border/card) */}
          <div className="flex items-center justify-center">
            <div className="relative h-72 w-full max-w-xl md:h-80">
              <Image
                src="/images/welcome-page-illustration.png"
                alt="Illustration"
                fill
                priority
                className="object-contain"
              />
            </div>
          </div>

          {/* Right: product narrative + CTA */}
          <div className="space-y-4">
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold text-primary">
                Operational &amp; AI Readiness Audit
              </h1>
              <p className="text-sm text-muted-foreground">
                Understand how your business really operates — before automating anything.
              </p>
            </div>

            <div className="space-y-3 text-sm leading-6 text-muted-foreground">
              <p>
                Most companies rush into AI without fixing the foundations. This audit helps you slow down,
                assess reality, and make smart, defensible decisions about automation.
              </p>
              <p>
                This is <span className="font-medium text-foreground">not</span> a chatbot and not a generic AI report.
                It’s a structured operational audit that evaluates how your business runs today — across people,
                processes, tools, and decision-making — and determines whether AI is appropriate, premature, or risky.
                AI is used as an analytical assistant, not a replacement for judgment.
              </p>
            </div>

            {/* ✅ Smart CTA */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <GetStartedCTA isAuthed={isAuthed} />
            </div>
          </div>
        </section>

        {/* Credibility blocks */}
        <section className="mt-10 grid gap-3 md:grid-cols-4">
          <div className="rounded-lg border bg-background p-4">
            <div className="text-sm font-semibold text-primary">Why this exists</div>
            <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
              <li>• Find bottlenecks</li>
              <li>• Reduce operational drag</li>
              <li>• Avoid premature automation</li>
            </ul>
          </div>

          <div className="rounded-lg border bg-background p-4">
            <div className="text-sm font-semibold text-primary">Who it’s for</div>
            <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
              <li>• Fractional CFOs</li>
              <li>• Finance consultants</li>
              <li>• Small teams (2–15)</li>
            </ul>
          </div>

          <div className="rounded-lg border bg-background p-4">
            <div className="text-sm font-semibold text-primary">How it works</div>
            <ol className="mt-2 space-y-1 text-sm text-muted-foreground">
              <li>1) Complete intake</li>
              <li>2) Run audit</li>
              <li>3) Review results</li>
            </ol>
          </div>

          <div className="rounded-lg border bg-background p-4">
            <div className="text-sm font-semibold text-primary">What you get</div>
            <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
              <li>• Summary + findings</li>
              <li>• Risk &amp; readiness</li>
              <li>• Prioritized next steps</li>
            </ul>
          </div>
        </section>
      </main>
    </div>
  );
}
