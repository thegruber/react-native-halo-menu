import { Alert, FlatList, StatusBar, StyleSheet, Text, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import {
  HaloMenuPreviewFrame,
  HaloMenuProvider,
  HaloMenuTrigger,
  type HaloAction,
  type HaloIconProps,
} from "react-native-halo-menu";
import { HaloBlurBackdrop } from "react-native-halo-menu/expo";

interface Card {
  id: string;
  title: string;
  emoji: string;
  color: string;
}

const CARDS: Card[] = [
  { id: "1", title: "Sunset Run", emoji: "🌅", color: "#FF8A65" },
  { id: "2", title: "Ocean Dive", emoji: "🌊", color: "#4FC3F7" },
  { id: "3", title: "Forest Walk", emoji: "🌲", color: "#81C784" },
  { id: "4", title: "Night Sky", emoji: "🌌", color: "#7986CB" },
  { id: "5", title: "Coffee Break", emoji: "☕", color: "#A1887F" },
  { id: "6", title: "Studio Mix", emoji: "🎛️", color: "#BA68C8" },
  { id: "7", title: "City Lights", emoji: "🌃", color: "#F06292" },
  { id: "8", title: "Snow Peak", emoji: "🏔️", color: "#90A4AE" },
];

const CARD_RADIUS = 20;
const DEMO_COLOR_SCHEME = "dark";

function emojiIcon(emoji: string) {
  return ({ size }: HaloIconProps) => <Text style={{ fontSize: size - 4 }}>{emoji}</Text>;
}

function buildActions(card: Card): HaloAction[] {
  const say = (verb: string) => Alert.alert(verb, `${verb} “${card.title}”`);
  return [
    { key: "share", title: "Share", onPress: () => say("Share"), renderIcon: emojiIcon("📤") },
    { key: "save", title: "Save", onPress: () => say("Save"), renderIcon: emojiIcon("🔖") },
    { key: "pin", title: "Pin", onPress: () => say("Pin"), renderIcon: emojiIcon("📌") },
    {
      key: "delete",
      title: "Delete",
      destructive: true,
      onPress: () => say("Delete"),
      renderIcon: emojiIcon("🗑️"),
    },
  ];
}

function CardFace({ card, height }: { card: Card; height?: number }) {
  return (
    <View style={[styles.cardFace, { backgroundColor: card.color }, height ? { height } : null]}>
      <Text style={styles.cardEmoji}>{card.emoji}</Text>
      <Text style={styles.cardTitle}>{card.title}</Text>
    </View>
  );
}

function DemoCard({ card }: { card: Card }) {
  return (
    <HaloMenuTrigger
      id={card.id}
      actions={buildActions(card)}
      renderPreview={({ width, height }) => (
        <HaloMenuPreviewFrame width={width} height={height} borderRadius={CARD_RADIUS}>
          <CardFace card={card} height={height} />
        </HaloMenuPreviewFrame>
      )}
      style={styles.cardWrap}
      accessible
      accessibilityRole="button"
      accessibilityLabel={card.title}
      accessibilityHint="Shows quick actions"
    >
      <CardFace card={card} />
    </HaloMenuTrigger>
  );
}

function Demo() {
  const insets = useSafeAreaInsets();
  const isDark = DEMO_COLOR_SCHEME === "dark";

  return (
    <View style={[styles.screen, isDark ? styles.screenDark : styles.screenLight]}>
      <FlatList
        data={CARDS}
        keyExtractor={(card) => card.id}
        numColumns={2}
        columnWrapperStyle={styles.column}
        contentContainerStyle={[
          styles.list,
          { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 24 },
        ]}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={[styles.title, isDark ? styles.textDark : styles.textLight]}>
              react-native-halo-menu
            </Text>
            <Text style={[styles.subtitle, isDark ? styles.textDark : styles.textLight]}>
              Long-press a card, drag onto an action, release.
            </Text>
          </View>
        }
        renderItem={({ item }) => <DemoCard card={item} />}
      />
    </View>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <StatusBar barStyle="light-content" />
      <SafeAreaProvider>
        <HaloMenuProvider
          colorScheme={DEMO_COLOR_SCHEME}
          layout={{
            buttonSize: 54,
            iconSize: 24,
            radius: 92,
            hitRadius: 42,
          }}
          appearance={{
            buttonShadowOpacity: 0.14,
            previewShadowOpacity: 0.28,
            originDotOpacity: 0.22,
          }}
          renderBackdrop={(props) => (
            <HaloBlurBackdrop
              {...props}
              intensity={50}
              tint={props.isDarkMode ? "systemMaterialDark" : "systemMaterialLight"}
              overlayColor={props.isDarkMode ? "rgba(0,0,0,0.24)" : "rgba(255,255,255,0.18)"}
            />
          )}
        >
          <Demo />
        </HaloMenuProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  screen: { flex: 1 },
  screenLight: { backgroundColor: "#F4F2EE" },
  screenDark: { backgroundColor: "#111111" },
  list: { paddingHorizontal: 12 },
  column: { gap: 12 },
  header: { paddingHorizontal: 4, paddingBottom: 16 },
  title: { fontSize: 28, fontWeight: "700" },
  subtitle: { fontSize: 15, marginTop: 4, opacity: 0.7 },
  textLight: { color: "#111111" },
  textDark: { color: "#FFFFFF" },
  cardWrap: { flex: 1, marginBottom: 12 },
  cardFace: {
    flex: 1,
    minHeight: 160,
    borderRadius: CARD_RADIUS,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  cardEmoji: { fontSize: 44 },
  cardTitle: { fontSize: 16, fontWeight: "600", color: "rgba(0,0,0,0.75)" },
});
