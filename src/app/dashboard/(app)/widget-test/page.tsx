import { RestorationWidget } from "@/components/chat-widget/restoration-widget";

export default function WidgetTestPage() {
    return (
        <div className="space-y-6">
            <div className="space-y-1">
                <h1 className="text-lg font-semibold">Widget Test</h1>
                <p className="text-sm text-muted-foreground">
                    This page renders a single widget instance for testing flow.
                </p>
            </div>

            {/* Render ONLY ONE widget at a time */}
            <RestorationWidget mode="live" />
            {/* 
        When testing SMS + Supabase, temporarily switch to:
        <RestorationWidget mode="live" />
      */}
        </div>
    );
}
