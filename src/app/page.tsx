import { AppHeader } from "@/components/layout/app-header";
import { AppFooter } from "@/components/layout/app-footer";
import { createClient } from "@/lib/supabase/server";
import { HeroCTA } from "@/components/get-started-cta";
import { MessageSquare, BarChart3 } from "lucide-react";
import { RestorationWidget } from "@/components/chat-widget/restoration-widget";

export default async function WelcomePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  const isAuthed = !!auth.user;
  const params = await searchParams;
  const wasCancelled = params.cancelled === "1";

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <AppHeader />

      {wasCancelled && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-3 text-center text-sm text-amber-800">
          Your account has been cancelled. Log back in any time to reactivate it.
        </div>
      )}

      {/* Hero — same blue as header so they merge without a seam */}
      <section className="bg-primary text-white pt-8 pb-12 px-4">
        <div className="mx-auto max-w-3xl text-center space-y-4">
          <h1 className="text-3xl md:text-4xl font-bold uppercase tracking-wide leading-snug">
            Capture Emergency Leads.<br />24/7. Automated.
          </h1>
          <p className="text-white/80 text-sm md:text-base max-w-lg mx-auto">
            Know which restoration emergencies are happening right now — and ensure your team responds before the competition does.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-1">
            <HeroCTA isAuthed={isAuthed} />
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-4">
        {/* Feature cards */}
        <section className="py-12 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-xl border bg-white p-6 shadow-sm space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <MessageSquare className="h-5 w-5 text-primary" />
              </div>
              <div className="text-base font-bold text-foreground">Live Demo Widget</div>
            </div>
            <p className="text-sm text-muted-foreground">
              Experience exactly what your website visitors see — a fast, conversational intake that captures name, phone, location, and damage type in under 30 seconds. No forms. No friction.
            </p>
          </div>

          <div className="rounded-xl border bg-white p-6 shadow-sm space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <BarChart3 className="h-5 w-5 text-primary" />
              </div>
              <div className="text-base font-bold text-foreground">Full Lead Capture System</div>
            </div>
            <p className="text-sm text-muted-foreground">
              Get a fully installed, branded chatbot widget on your website — with a real-time lead dashboard, instant SMS alerts for emergencies, and 24/7 automated intake. No tech team required.
            </p>
          </div>
        </section>

        {/* Demo widget — centered */}
        <section id="demo" className="pb-12">
          <div className="mx-auto max-w-lg">
            <div className="text-center mb-6 space-y-2">
              <h2 className="text-xl font-bold text-foreground">Try the Demo</h2>
              <p className="text-sm text-muted-foreground">
                This is exactly what website visitors see. Takes ~30 seconds and captures name, phone, and location.
              </p>
            </div>
            <div className="rounded-xl border bg-white p-5 shadow-sm">
              <RestorationWidget mode="demo" variant="embedded" />
              <p className="mt-3 text-xs text-center text-muted-foreground">
                Demo mode: Call/Text buttons are preview-only. Live mode uses the business number from Settings.
              </p>
            </div>
          </div>
        </section>

        {/* Info cards */}
        <section className="pb-20 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Why this exists */}
          <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-5 shadow-sm space-y-3">
            <div className="text-xs font-bold uppercase tracking-widest text-primary">Why this exists</div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex gap-2"><span className="text-primary/50 shrink-0">·</span>Missed calls are missed jobs — most homeowners call 2–3 companies and go with whoever answers first</li>
              <li className="flex gap-2"><span className="text-primary/50 shrink-0">·</span>Emergencies can't wait for a callback — water damage spreads by the hour</li>
              <li className="flex gap-2"><span className="text-primary/50 shrink-0">·</span>Contact forms convert poorly — visitors abandon them before hitting submit</li>
              <li className="flex gap-2"><span className="text-primary/50 shrink-0">·</span>After-hours leads vanish — no one checks the inbox until morning</li>
            </ul>
          </div>

          {/* Who it's for */}
          <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-5 shadow-sm space-y-3">
            <div className="text-xs font-bold uppercase tracking-widest text-primary">Who it&apos;s for</div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex gap-2"><span className="text-primary/50 shrink-0">·</span>Water restoration companies dealing with floods, burst pipes, and sewage</li>
              <li className="flex gap-2"><span className="text-primary/50 shrink-0">·</span>Fire &amp; smoke restoration teams handling post-fire cleanup</li>
              <li className="flex gap-2"><span className="text-primary/50 shrink-0">·</span>Mold remediation specialists</li>
              <li className="flex gap-2"><span className="text-primary/50 shrink-0">·</span>Any emergency home service that needs to respond fast and win the job before a competitor does</li>
            </ul>
          </div>

          {/* How it works */}
          <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-5 shadow-sm space-y-3">
            <div className="text-xs font-bold uppercase tracking-widest text-primary">How it works</div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex gap-2"><span className="text-primary/50 shrink-0">·</span>Visitor lands on your site — the widget appears immediately, no click required</li>
              <li className="flex gap-2"><span className="text-primary/50 shrink-0">·</span>AI walks them through a short conversation: damage type, urgency, location, and contact info</li>
              <li className="flex gap-2"><span className="text-primary/50 shrink-0">·</span>You receive an instant SMS alert with the full lead details</li>
              <li className="flex gap-2"><span className="text-primary/50 shrink-0">·</span>Everything is logged in your dashboard — even if it comes in at 3am</li>
            </ul>
          </div>

          {/* What you get */}
          <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-5 shadow-sm space-y-3">
            <div className="text-xs font-bold uppercase tracking-widest text-primary">What you get</div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex gap-2"><span className="text-primary/50 shrink-0">·</span>Captured leads around the clock — even after hours and on weekends</li>
              <li className="flex gap-2"><span className="text-primary/50 shrink-0">·</span>Instant SMS alerts for high-urgency emergencies</li>
              <li className="flex gap-2"><span className="text-primary/50 shrink-0">·</span>Full lead dashboard with contact info, damage type, and conversation history</li>
              <li className="flex gap-2"><span className="text-primary/50 shrink-0">·</span>Follow-up tracking so no lead slips through the cracks</li>
              <li className="flex gap-2"><span className="text-primary/50 shrink-0">·</span>Fewer lost emergencies — and a real edge over competitors still using forms</li>
            </ul>
          </div>
        </section>
      </main>
      <AppFooter />
    </div>
  );
}