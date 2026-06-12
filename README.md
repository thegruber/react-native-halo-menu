# react-native-halo-menu

**Pinterest-style hold menu for React Native — long-press, drag, release.** A radial action menu powered by Reanimated 4 and Gesture Handler. Zero native code, works in Expo Go.

> Long-press a card → it lifts and tilts above a dimmed backdrop while an arc of action buttons fans out around your finger → drag onto a button → release to trigger. One continuous gesture.

- 🫳 **One-gesture interaction** — open, browse, and select without lifting your finger
- 🪂 **Levitating preview** — the pressed element lifts, tilts toward the screen edge, and casts a real shadow while everything behind dims
- 🏎️ **UI-thread everything** — per-frame finger tracking, hit-testing, and button placement run as Reanimated worklets; zero JS-thread frames
- 🎨 **Fully themeable** — colors, motion, backdrop, label typography, and per-action icons are all injection points with sensible defaults
- 📳 **Bring your own haptics** — `onOpen` / `onHover` callbacks; plug in `expo-haptics` or anything else
- ♿ **Reduce Motion aware** — every animation respects the OS accessibility setting
- 🧪 **Ships a Jest mock** — `react-native-halo-menu/mock`
- 🚀 **New Architecture only, zero native code** — pure TypeScript on your existing Reanimated + Gesture Handler install

## Installation

```sh
npm install react-native-halo-menu
# or
pnpm add react-native-halo-menu
```

Peer dependencies (you almost certainly have them already):

```sh
npx expo install react-native-reanimated react-native-worklets react-native-gesture-handler react-native-safe-area-context
```

| Requirement                    | Version                        |
| ------------------------------ | ------------------------------ |
| react-native                   | >= 0.81 (New Architecture)     |
| react-native-reanimated        | >= 4.0                         |
| react-native-worklets          | matching your Reanimated minor |
| react-native-gesture-handler   | >= 2.16                        |
| react-native-safe-area-context | >= 4.0                         |
| Expo Go                        | ✅ (SDK 54+)                   |

Your app must be wrapped in `GestureHandlerRootView` (Expo Router templates already do this).

## Quickstart

Wrap your app once in `HaloMenuProvider`, inside your `GestureHandlerRootView` and above your
navigator — the same pattern as `@gorhom/bottom-sheet`'s `BottomSheetModalProvider`. The provider
renders the halo overlay (backdrop, lifted preview, radial buttons) as a full-screen
`pointerEvents="none"` layer at the root, so the pan gesture never leaves the trigger.

```tsx
// 1. Mount the provider once, near the root (inside GestureHandlerRootView).
import { HaloMenuProvider } from "react-native-halo-menu";

export function App() {
  return (
    <HaloMenuProvider>
      <Screens />
    </HaloMenuProvider>
  );
}

// 2. Wrap anything long-pressable in a trigger.
import { HaloMenuTrigger, HaloMenuPreviewFrame } from "react-native-halo-menu";

function Card({ item }) {
  return (
    <HaloMenuTrigger
      id={item.id}
      actions={[
        { key: "share", title: "Share", onPress: () => share(item) },
        { key: "save", title: "Save", onPress: () => save(item) },
        { key: "delete", title: "Delete", destructive: true, onPress: () => remove(item) },
      ]}
      renderPreview={({ width, height }) => (
        <HaloMenuPreviewFrame width={width} height={height} borderRadius={16}>
          <CardContent item={item} />
        </HaloMenuPreviewFrame>
      )}
    >
      <CardContent item={item} />
    </HaloMenuTrigger>
  );
}
```

That's it — long-press the card and drag.

## Customization

Everything app-specific is an injection point on the provider:

```tsx
<HaloMenuProvider
  colorScheme="dark"                          // defaults to the OS scheme
  colors={{ foreground: "#fff", surface: "#1c1c1e", destructive: "#ff453a" }}
  motion={{ longPressDuration: 250, liftScale: 1.2 }}
  haptics={{
    onOpen: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
    onHover: () => Haptics.selectionAsync(),
  }}
  renderBackdrop={({ visible, isDarkMode }) => <MyBlurBackdrop visible={visible} />}
  labelTextStyle={{ fontFamily: "SpaceMono-Bold" }}
  suppressActivationWhen={navTransitioning}   // SharedValue — gate during transitions
>
```

Per-action icons are a render prop, so any icon system works:

```tsx
{
  key: "share",
  title: "Share",
  onPress: share,
  renderIcon: ({ size, color }) => <Feather name="share" size={size} color={color} />,
}
```

### Escape hatch: `useHaloMenuTrigger`

When the measured view must differ from the gesture host (hero layouts, FlashList cells with
recycled dimensions, deferred actions), use the hook directly:

```tsx
const { panGesture, animatedRef, menuActiveRef } = useHaloMenuTrigger({
  id: item.id,
  actions,
  renderPreview,
  fallbackWidth,
  fallbackHeight, // SharedValues for recycled cells
  disabledWhen: isMultiSelectMode, // SharedValue gate
  interceptAction: (action) => action.key === "select", // defer until close
  onCloseComplete: fireDeferredAction,
  hideOnUnmount: true,
});
```

### Imperative handle

```tsx
const { visible, hide } = useHaloMenu(); // visible is a SharedValue<boolean>
```

## API

| Export                                              | Kind      | Purpose                             |
| --------------------------------------------------- | --------- | ----------------------------------- |
| `HaloMenuProvider`                                  | component | Root overlay + configuration        |
| `HaloMenuTrigger`                                   | component | Long-press wrapper (the 90% case)   |
| `useHaloMenuTrigger`                                | hook      | Full-control escape hatch           |
| `HaloMenuPreviewFrame`                              | component | Lift/tilt/shadow frame for previews |
| `useHaloMenu`                                       | hook      | `{ visible, hide }`                 |
| `DEFAULT_MOTION`                                    | constant  | The default motion values           |
| `HaloAction`, `HaloMenuColors`, `HaloMenuMotion`, … | types     | Full TypeScript surface             |

Up to **5 actions** render per menu (the arc gets ambiguous beyond that); extras are dropped with a dev warning.

## Testing

```js
// jest.setup.js
jest.mock("react-native-halo-menu", () => require("react-native-halo-menu/mock"));
```

Using the bare `react-native` Jest preset (not `jest-expo`)? This package ships untranspiled
ESM, so add it to your transform allowlist:

```js
transformIgnorePatterns: [
  "node_modules/(?!(react-native-halo-menu|(jest-)?react-native|@react-native(-community)?)/)",
],
```

## Known limitations

The overlay renders in the root view hierarchy. Triggers inside a **native modal**
(RN `<Modal>`, Expo Router `presentation: "modal"` / `formSheet` routes) will lift _below_
that modal. On iOS you can render the overlay above native modals with react-native-screens'
`FullWindowOverlay`:

```tsx
import { FullWindowOverlay } from "react-native-screens";

const OverlayHost = ({ children }) =>
  Platform.OS === "ios" ? <FullWindowOverlay>{children}</FullWindowOverlay> : <>{children}</>;

<HaloMenuProvider overlayContainerComponent={OverlayHost}>
```

(Alternatively, mount a second `HaloMenuProvider` inside the modal's content — with its own
`GestureHandlerRootView`, per the Gesture Handler docs.)

## When to use something else

If you want the **native platform context menu** (UIMenu / Material), use
[zeego](https://zeego.dev) or `@react-native-menu/menu` — they're excellent and complementary.
This package is for the **gesture-layer** menu: touch-first power actions on cards and grids
where you want full visual control and a single fluid gesture.

## Example app

A runnable showcase lives in [`example/`](./example):

```sh
pnpm install
pnpm --dir example start   # then open in Expo Go or a dev build
```

## Roadmap

- `accessibilityActions` fallback so screen-reader users get the same actions without the gesture
- Geometry configuration (radius, arc spacing) — additive, post-1.0
- Expo Snack + demo GIF

## License

MIT © Adrian Gruber
