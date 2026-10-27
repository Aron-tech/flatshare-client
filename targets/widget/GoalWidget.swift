import SwiftUI
import WidgetKit

/// S1 + lock screen: the own weekly (or monthly) goal and pace.
struct GoalWidget: Widget {
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: "GoalWidget", provider: HQProvider()) { entry in
      GoalWidgetView(entry: entry).widgetBackground()
    }
    .configurationDisplayName(Strings(lang: Session.lastLanguage).goalTitle(monthly: false))
    .description(Session.lastLanguage == .en ? "Your points and pace for this period." : "A pontjaid és a tempód ebben az időszakban.")
    .supportedFamilies([.systemSmall, .accessoryCircular, .accessoryRectangular, .accessoryInline])
  }
}

struct GoalWidgetView: View {
  @Environment(\.widgetFamily) private var family
  let entry: HQEntry

  var body: some View {
    switch entry.content {
    case .signedOut(let lang):
      if family == .systemSmall { SignedOutView(lang: lang) } else { Image(systemName: "house") }
    case .ready(let ready):
      let progress = GoalProgress(snapshot: ready.snapshot, session: ready.session, now: entry.date)
      Group {
        switch family {
        case .accessoryCircular: circular(progress)
        case .accessoryRectangular: rectangular(ready, progress)
        case .accessoryInline: inline(ready, progress)
        default: small(ready, progress)
        }
      }
      .widgetURL(Links.home)
    }
  }

  private func small(_ ready: HQEntry.Ready, _ progress: GoalProgress) -> some View {
    let strings = ready.strings
    return VStack(alignment: .leading, spacing: 6) {
      Text(strings.goalTitle(monthly: ready.session?.resetPeriod == "monthly"))
        .font(.caption.weight(.semibold))
        .foregroundStyle(Palette.mutedForeground)
      ZStack {
        GoalRing(progress: progress, lineWidth: 9)
        VStack(spacing: -2) {
          Text("\(Int(progress.weekly.rounded()))")
            .font(.heading(26))
            .foregroundStyle(Palette.foreground)
            .contentTransition(.numericText())
          Text("/ \(Int(progress.target.rounded()))")
            .font(.caption2.monospacedDigit())
            .foregroundStyle(Palette.mutedForeground)
        }
      }
      .frame(maxWidth: .infinity)
      .frame(height: 74)
      Spacer(minLength: 0)
      PaceLabel(progress: progress, strings: strings)
      Text(strings.daysLeft(progress.cycle.daysLeft))
        .font(.caption2)
        .foregroundStyle(Palette.mutedForeground)
    }
  }

  private func circular(_ progress: GoalProgress) -> some View {
    Gauge(value: progress.fraction) {
      Image(systemName: "house")
    } currentValueLabel: {
      Text("\(Int(progress.weekly.rounded()))")
    }
    .gaugeStyle(.accessoryCircularCapacity)
    .widgetAccentable()
  }

  private func rectangular(_ ready: HQEntry.Ready, _ progress: GoalProgress) -> some View {
    let strings = ready.strings
    return VStack(alignment: .leading, spacing: 2) {
      Text("\(Int(progress.weekly.rounded())) / \(strings.points(progress.target))")
        .font(.headline)
        .widgetAccentable()
      Gauge(value: progress.fraction) { EmptyView() }
        .gaugeStyle(.accessoryLinearCapacity)
      Text("\(strings.daysShort(progress.cycle.daysLeft)) · \(progress.reached ? strings.goalReached : progress.behind > 0 ? strings.behind(progress.behind) : strings.onPace)")
        .font(.caption)
        .lineLimit(1)
    }
    .frame(maxWidth: .infinity, alignment: .leading)
  }

  private func inline(_ ready: HQEntry.Ready, _ progress: GoalProgress) -> some View {
    Text("\(Int(progress.weekly.rounded()))/\(ready.strings.points(progress.target)) · \(ready.strings.daysShort(progress.cycle.daysLeft))")
  }
}
