import { RestorationWidget } from "@/components/chat-widget/restoration-widget";

export default async function WidgetFramePage({
    searchParams,
}: {
    searchParams: Promise<{ key?: string }>;
}) {
    const params = await searchParams;
    const key = typeof params?.key === "string" ? params.key : "";

    return (
        <div className="min-h-screen bg-transparent m-0 p-0">
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