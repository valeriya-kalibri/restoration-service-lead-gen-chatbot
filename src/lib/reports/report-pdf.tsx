import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

export type AuditResult = {
    business_summary?: { one_liner?: string; description?: string };
    assumptions?: string[];
    findings?: any[];
    recommendations?: any[];
};

const styles = StyleSheet.create({
    page: { padding: 28, fontSize: 11, fontFamily: "Helvetica" },
    h1: { fontSize: 18, marginBottom: 6 },
    h2: { fontSize: 12, marginTop: 14, marginBottom: 6, fontWeight: "bold" },
    muted: { color: "#666" },
    box: { border: "1px solid #DDD", padding: 10, marginTop: 6 },
});

export function ReportPdf({
    result,
    createdAt,
}: {
    result: AuditResult;
    createdAt?: string | null;
}) {
    return (
        <Document>
            <Page size="LETTER" style={styles.page}>
                <Text style={styles.h1}>Business Operations Audit Report</Text>
                {createdAt ? <Text style={styles.muted}>Generated: {createdAt}</Text> : null}

                <Text style={styles.h2}>Operational Context</Text>
                <View style={styles.box}>
                    <Text>
                        {result.business_summary?.description ??
                            result.business_summary?.one_liner ??
                            "No summary provided."}
                    </Text>
                </View>

                <Text style={styles.h2}>Recommendations</Text>
                {(result.recommendations ?? []).map((r: any, i: number) => (
                    <View key={i} style={styles.box}>
                        <Text>{r.title}</Text>
                        <Text>{r.why}</Text>
                    </View>
                ))}

                <Text style={styles.h2}>Assumptions</Text>
                {(result.assumptions ?? []).map((a, i) => (
                    <Text key={i}>• {a}</Text>
                ))}

                <Text style={styles.h2}>Appendix — Findings</Text>
                {(result.findings ?? []).map((f: any, i: number) => (
                    <View key={i} style={styles.box}>
                        <Text>{f.dimension}</Text>
                        <Text>{f.what_we_observed}</Text>
                    </View>
                ))}
            </Page>
        </Document>
    );
}
