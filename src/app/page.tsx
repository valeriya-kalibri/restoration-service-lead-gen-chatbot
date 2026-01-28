import Image from "next/image";
import { AppHeader } from "@/components/layout/app-header";
import { createClient } from "@/lib/supabase/server";
import { GetStartedCTA } from "@/components/get-started-cta";
import { RestorationWidget } from "@/components/chat-widget/restoration-widget";

export default async function WelcomePage() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  const isAuthed = !!auth.user;

  return (
    <div className="min-h-screen bg-muted/30">
      <AppHeader title="RESTORATION SERVICE LEAD GENERATION CHATBOT" />

      <main className="mx-auto max-w-6xl px-4 py-10">
        {/* Hero */}
        <section className="grid grid-cols-1 items-center gap-8 md:grid-cols-2">
          {/* Image */}
          <div className="flex items-center justify-center">
            <div className="relative h-72 w-full max-w-xl md:h-80">
              <Image
                src="/images/welcome-page-illustration.png"
                alt="Restoration chatbot illustration"
                fill
                priority
                className="object-contain"
              />
            </div>
          </div>

          {/* Copy */}
          <div className="space-y-4">
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold text-primary">
                Capture Emergency Leads — Even When You Miss the Call
              </h1>
              <p className="text-sm text-muted-foreground">
                An embedded website chatbot built for water, fire, and mold restoration companies.
              </p>
            </div>

            <div className="space-y-3 text-sm leading-6 text-muted-foreground">
              <p>
                When a homeowner has an emergency, they don’t wait. If your phone goes unanswered,
                they call the next company on Google.
              </p>

              <p>
                This chatbot acts as a{" "}
                <span className="font-medium text-foreground">
                  24/7 emergency intake assistant
                </span>
                . It captures the situation, collects contact details, and immediately alerts your team by SMS —
                so you can call back before the job is gone.
              </p>

              <p>
                There’s no scheduling, no long forms, and no friction. Just fast lead capture,
                real phone numbers, and real conversations.
              </p>
            </div>

            {/* CTA */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <GetStartedCTA isAuthed={isAuthed} />
            </div>
          </div>
        </section>

        {/* Demo widget embed */}
        <section className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="rounded-lg border bg-background p-5">
            <div className="space-y-2">
              <h2 className="text-base font-semibold text-primary">Try the demo</h2>
              <p className="text-sm text-muted-foreground">
                This is exactly what website visitors see. It asks a few fast questions, captures the lead,
                and alerts your team.
              </p>
              <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
                <li>• Takes ~30 seconds</li>
                <li>• Captures name + phone + location</li>
                <li>• Alerts your team by SMS (live mode)</li>
              </ul>
            </div>
          </div>

          <div className="rounded-lg border bg-background p-5">
            
              {/* IMPORTANT: demo mode = no API calls */}
              <RestorationWidget mode="demo" variant="embedded" />


            

            <div className="mt-3 text-xs text-muted-foreground">
              Demo mode: Call/Text buttons are preview-only. Live mode uses the business number from Settings.
            </div>
          </div>
        </section>

        {/* Value blocks */}
        <section className="mt-10 grid gap-3 md:grid-cols-4">
          <div className="rounded-lg border bg-background p-4">
            <div className="text-sm font-semibold text-primary">Why this exists</div>
            <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
              <li>• Missed calls = lost jobs</li>
              <li>• Emergencies can’t wait</li>
              <li>• Forms are too slow</li>
            </ul>
          </div>

          <div className="rounded-lg border bg-background p-4">
            <div className="text-sm font-semibold text-primary">Who it’s for</div>
            <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
              <li>• Water restoration companies</li>
              <li>• Fire & smoke restoration</li>
              <li>• Mold remediation teams</li>
            </ul>
          </div>

          <div className="rounded-lg border bg-background p-4">
            <div className="text-sm font-semibold text-primary">How it works</div>
            <ol className="mt-2 space-y-1 text-sm text-muted-foreground">
              <li>1) Visitor reports the emergency</li>
              <li>2) Chatbot collects contact details</li>
              <li>3) You receive an instant SMS alert</li>
            </ol>
          </div>

          <div className="rounded-lg border bg-background p-4">
            <div className="text-sm font-semibold text-primary">What you get</div>
            <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
              <li>• Captured leads (even after hours)</li>
              <li>• Call-back requests by SMS</li>
              <li>• Fewer lost emergencies</li>
            </ul>
          </div>
        </section>
      </main>
    </div>
  );
}

