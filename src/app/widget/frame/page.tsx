import { RestorationWidget } from "@/components/chat-widget/restoration-widget";

export default async function WidgetFramePage({
    searchParams,
}: {
    searchParams: { key?: string };
}) {
    const key = searchParams.key ?? "";

    return (
        <div className="min-h-screen bg-transparent p-0 m-0">
            {/* Render embedded variant inside iframe */}
            <div className="p-0">
                <RestorationWidget
                    mode="live"
                    variant="embedded"
                    // NEW props you’ll add in Step 5
                    widgetKey={key}
                    ingestUrl="/api/widget/ingest"
                    configUrl="/api/widget/config"
                />
            </div>
        </div>
    );
}
