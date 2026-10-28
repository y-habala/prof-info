import { View, Text, Image, StyleSheet } from "@react-pdf/renderer";
import "./fonts";
import { NAVY, GOLD, INK_MUTED, TINT, RULE } from "./theme";
import type { PdfLogo } from "./logo";

export type HeaderField = { label: string; value: string | null };

const s = StyleSheet.create({
  frame: { borderWidth: 1.2, borderColor: NAVY, borderRadius: 6 },
  accentBar: { height: 4, backgroundColor: NAVY, borderTopLeftRadius: 5, borderTopRightRadius: 5 },
  accentGold: { height: 1.5, backgroundColor: GOLD },
  top: { flexDirection: "row" },
  cell: { paddingVertical: 7, paddingHorizontal: 9, justifyContent: "center" },
  left: { width: "31%", borderRightWidth: 0.8, borderRightColor: RULE },
  center: { width: "38%", alignItems: "center", borderRightWidth: 0.8, borderRightColor: RULE },
  right: { width: "31%", backgroundColor: TINT },

  infoRow: { flexDirection: "row", alignItems: "center", marginBottom: 3 },
  infoDot: { width: 3.5, height: 3.5, borderRadius: 1.75, backgroundColor: GOLD, marginRight: 4 },
  infoLine: { fontFamily: "Times-Italic", fontSize: 8.5, color: INK_MUTED },
  infoValue: { fontFamily: "Times-BoldItalic", color: NAVY },

  logo: { maxHeight: 40, maxWidth: "100%", objectFit: "contain" },
  centerRule: { width: 70, height: 1, backgroundColor: GOLD, marginVertical: 3 },
  arLine: { fontFamily: "Cairo", fontWeight: 700, fontSize: 8, color: NAVY, textAlign: "center", lineHeight: 1.3 },
  arLineSmall: { fontFamily: "Cairo", fontWeight: 700, fontSize: 7, color: INK_MUTED, textAlign: "center", lineHeight: 1.3 },

  fieldLine: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 5,
    paddingBottom: 1.5,
    borderBottomWidth: 0.6,
    borderBottomColor: RULE,
    borderBottomStyle: "dashed",
  },
  fieldLabel: { fontFamily: "Times-BoldItalic", fontSize: 10.5, color: NAVY },
  fieldValue: { fontFamily: "Helvetica-Bold", fontSize: 8.5, marginLeft: 5, flexShrink: 1 },

  bottom: { borderTopWidth: 0.8, borderTopColor: RULE },
});

// Official layout shared by exam sheets and class reports:
// school info | logo + Arabic lines | fill-in fields, then a free bottom row.
export function OfficialHeader({
  left,
  right,
  logo,
  academieAr,
  directionAr,
  children,
}: {
  left: HeaderField[];
  right: HeaderField[];
  logo: PdfLogo;
  academieAr: string;
  directionAr: string;
  children?: React.ReactNode;
}) {
  return (
    <View style={s.frame}>
      <View style={s.accentBar} />
      <View style={s.accentGold} />
      <View style={s.top}>
        <View style={[s.cell, s.left]}>
          {left.map((f) => (
            <View key={f.label} style={s.infoRow}>
              <View style={s.infoDot} />
              <Text style={s.infoLine}>
                {f.label} : <Text style={s.infoValue}>{f.value ?? "—"}</Text>
              </Text>
            </View>
          ))}
        </View>

        <View style={[s.cell, s.center]}>
          {logo ? (
            // eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image has no alt
            <Image style={s.logo} src={logo} />
          ) : null}
          {academieAr || directionAr ? <View style={s.centerRule} /> : null}
          {academieAr ? <Text style={s.arLine}>{academieAr}</Text> : null}
          {directionAr ? <Text style={s.arLineSmall}>{directionAr}</Text> : null}
        </View>

        <View style={[s.cell, s.right]}>
          {right.map((f) => (
            <View key={f.label} style={s.fieldLine}>
              <Text style={s.fieldLabel}>{f.label} :</Text>
              <Text style={s.fieldValue}>{f.value && f.value.trim() ? f.value : " "}</Text>
            </View>
          ))}
        </View>
      </View>
      {children ? <View style={s.bottom}>{children}</View> : null}
    </View>
  );
}
