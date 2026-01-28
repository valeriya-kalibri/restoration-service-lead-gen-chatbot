import { RestorationWidget } from "@/components/chat-widget/restoration-widget";

export default async function WidgetFramePage({
    searchParams,
}: {
    searchParams: { key?: string };
}) {
    const key = searchParams.key ?? "";

    return (
        <div className="min-h-screen bg-transparent p-0 m-0">
            <div className="p-0">
                <RestorationWidget
                    mode="live"
                    variant="embedded"
                    widgetKey={key}
                    ingestUrl="/api/widget/ingest"
                    configUrl="/api/widget/config"
                />
            </div>
        </div>
    );
}
