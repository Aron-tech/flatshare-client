import SwiftUI
import WidgetKit

/// S3 + M3: the household's shared mood with the own pet, and the mess per zone. Only in the bundle when the
/// House feature is on (`EXPO_PUBLIC_HOUSE_ENABLED`, written into the session by the app).
struct HouseWidget: Widget {
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: "HouseWidget", provider: HQProvider()) { entry in
      HouseWidgetView(entry: entry).widgetBackground()
    }
    .configurationDisplayName(Session.lastLanguage == .en ? "House" : "Ház")
    .description(Session.lastLanguage == .en ? "How the house feels and where it needs attention." : "Milyen kedvében van a ház, és hol kell rendet rakni.")
    // Without families the widget is not offered in the gallery (a conditional WidgetBundle needs iOS 18).
    .supportedFamilies(Session.load()?.isHouseEnabled == true ? [.systemSmall, .systemMedium] : [])
  }
}

struct HouseWidgetView: View {
  @Environment(\.widgetFamily) private var family
  let entry: HQEntry

  var body: some View {
    switch entry.content {
    case .signedOut(let lang):
      SignedOutView(lang: lang)
    case .ready(let ready):
      Group {
        if let house = ready.snapshot.house {
          if family == .systemMedium { medium(house, ready.strings) } else { small(house, ready.strings) }
        } else {
          VStack(spacing: 6) {
            Image(systemName: "house").font(.title2).foregroundStyle(Palette.primary)
            StatusFooter(ready: ready)
          }
        }
      }
      .widgetURL(Links.house)
    }
  }

  private func small(_ house: HouseSummary, _ strings: Strings) -> some View {
    VStack(spacing: 2) {
      PetImage(house: house).frame(maxWidth: .infinity).frame(height: 84)
      Text(strings.moodTitle(house.band))
        .font(.heading(15))
        .foregroundStyle(Palette.foreground)
        .multilineTextAlignment(.center)
        .lineLimit(2)
        .minimumScaleFactor(0.85)
      if let zone = house.messiestZone {
        Label(strings.zoneName(zone), systemImage: zoneSymbol(zone))
          .font(.caption2.weight(.medium))
          .foregroundStyle(Palette.primarySoftForeground)
          .lineLimit(1)
      }
    }
  }

  private func medium(_ house: HouseSummary, _ strings: Strings) -> some View {
    HStack(spacing: 12) {
      VStack(alignment: .leading, spacing: 4) {
        PetImage(house: house).frame(width: 64, height: 64)
        Text(strings.moodTitle(house.band)).font(.heading(16)).foregroundStyle(Palette.foreground).lineLimit(1)
        Text(house.behindPace ? strings.behindPaceHouse : strings.moodBody(house.band))
          .font(.caption2)
          .foregroundStyle(Palette.mutedForeground)
          .lineLimit(2)
      }
      .frame(maxWidth: .infinity, alignment: .leading)

      Grid(horizontalSpacing: 6, verticalSpacing: 6) {
        ForEach(0..<2, id: \.self) { row in
          GridRow {
            ForEach(houseZones[(row * 3)..<(row * 3 + 3)], id: \.key) { zone in
              ZoneTile(symbol: zone.symbol, level: house.zones[zone.key] ?? 0)
            }
          }
        }
      }
    }
  }
}

/// A zone's symbol with 0–3 mess dots; a tidy zone stays quiet.
struct ZoneTile: View {
  let symbol: String
  let level: Int

  var body: some View {
    VStack(spacing: 4) {
      Image(systemName: symbol)
        .font(.system(size: 15, weight: .medium))
        .foregroundStyle(level > 0 ? Palette.primarySoftForeground : Palette.mutedForeground.opacity(0.6))
      HStack(spacing: 2) {
        ForEach(0..<3, id: \.self) { index in
          Circle()
            .fill(index < level ? Palette.primary : Palette.border)
            .frame(width: 4, height: 4)
        }
      }
    }
    .frame(width: 44, height: 44)
    .background(RoundedRectangle(cornerRadius: 12).fill(level > 0 ? Palette.primarySoft : Palette.muted))
    .widgetAccentable(level > 0)
  }
}
