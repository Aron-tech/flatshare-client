import AppIntents
import SwiftUI
import WidgetKit

enum Links {
  static let home = URL(string: "flatshare:///")!
  static let chores = URL(string: "flatshare:///chores")!
  static let house = URL(string: "flatshare:///house")!
  static let login = URL(string: "flatshare:///login")!

  /// Opens the dashboard's grace day / hand-over sheet for the claimed task.
  static func task(_ id: Int) -> URL { URL(string: "flatshare:///?request=\(id)")! }
}

struct GoalRing: View {
  let progress: GoalProgress
  var lineWidth: CGFloat = 8

  var body: some View {
    ZStack {
      Circle().stroke(Palette.muted, lineWidth: lineWidth)
      Circle()
        .trim(from: 0, to: progress.fraction)
        .stroke(progress.reached ? Palette.success : Palette.primary, style: StrokeStyle(lineWidth: lineWidth, lineCap: .round))
        .rotationEffect(.degrees(-90))
        .widgetAccentable()
    }
  }
}

/// Pace line under the goal: behind, on pace, or reached.
struct PaceLabel: View {
  let progress: GoalProgress
  let strings: Strings

  var body: some View {
    let (text, color): (String, Color) =
      progress.reached ? (strings.goalReached, Palette.success)
      : progress.behind > 0 ? (strings.behind(progress.behind), Palette.primarySoftForeground)
      : (strings.onPace, Palette.success)
    HStack(spacing: 4) {
      Circle().fill(color).frame(width: 6, height: 6)
      Text(text).font(.caption2.weight(.semibold)).foregroundStyle(color).lineLimit(1)
    }
  }
}

struct CategoryBadge: View {
  let task: TaskItem
  var size: CGFloat = 28

  var body: some View {
    let tint = Color(hex: task.color) ?? Palette.mutedForeground
    Image(systemName: task.symbol)
      .font(.system(size: size * 0.48, weight: .medium))
      .foregroundStyle(tint)
      .frame(width: size, height: size)
      .background(Circle().fill(tint.opacity(0.15)))
  }
}

/// The interactive ✓; a done task shows a filled check.
struct CheckButton: View {
  let task: TaskItem
  let householdId: Int
  var size: CGFloat = 26

  var body: some View {
    if task.isDone {
      check
    } else {
      Button(intent: CompleteTaskIntent(task: task, householdId: householdId)) { check }
        .buttonStyle(.plain)
    }
  }

  private var check: some View {
    ZStack {
      Circle()
        .strokeBorder(task.isDone ? Palette.success : Palette.border, lineWidth: 1.5)
        .background(Circle().fill(task.isDone ? Palette.success : Color.clear))
      Image(systemName: "checkmark")
        .font(.system(size: size * 0.45, weight: .bold))
        .foregroundStyle(task.isDone ? Color.white : Palette.mutedForeground.opacity(0.5))
    }
    .frame(width: size, height: size)
    .widgetAccentable()
  }
}

struct TaskRow: View {
  let task: TaskItem
  let ready: HQEntry.Ready
  let now: Date

  var body: some View {
    HStack(spacing: 10) {
      CheckButton(task: task, householdId: ready.snapshot.householdId)
      Link(destination: Links.task(task.id)) {
        HStack(spacing: 8) {
          VStack(alignment: .leading, spacing: 1) {
            Text(task.name)
              .font(.system(size: 14, weight: .medium))
              .foregroundStyle(task.isDone ? Palette.mutedForeground : Palette.foreground)
              .strikethrough(task.isDone)
              .lineLimit(1)
            Text(ready.strings.taskSubtitle(task, now: now))
              .font(.caption2)
              .foregroundStyle(isOverdue ? Palette.primarySoftForeground : Palette.mutedForeground)
              .lineLimit(1)
          }
          Spacer(minLength: 4)
          if let points = task.isDone ? task.earned : task.points {
            Text(task.isDone ? ready.strings.earned(points) : "\(Int(points.rounded()))")
              .font(.caption.weight(.semibold).monospacedDigit())
              .foregroundStyle(task.isDone ? Palette.success : Palette.mutedForeground)
          }
        }
      }
    }
  }

  private var isOverdue: Bool { !task.isDone && (task.dueAt.map { $0 < now } ?? false) }
}

struct PetImage: View {
  let house: HouseSummary

  var body: some View {
    if let pet = house.pet {
      let image = Image(petImageName(pet, band: house.band)).resizable()
      // Keeps the pet's colors on a tinted / accented home screen.
      if #available(iOS 18.0, *) {
        image.widgetAccentedRenderingMode(.fullColor).scaledToFit()
      } else {
        image.scaledToFit()
      }
    }
  }
}

/// "Updated 14:05" when the data is cached, or the last ✓ error.
struct StatusFooter: View {
  let ready: HQEntry.Ready

  var body: some View {
    if let error = ready.error {
      Text(error).font(.caption2).foregroundStyle(Palette.primarySoftForeground).lineLimit(2)
    } else if ready.isStale {
      Text(ready.strings.updated(ready.snapshot.fetchedAt)).font(.caption2).foregroundStyle(Palette.mutedForeground)
    }
  }
}

struct SignedOutView: View {
  let lang: Lang

  var body: some View {
    VStack(spacing: 6) {
      Image(systemName: "house").font(.title2).foregroundStyle(Palette.primary)
      Text(Strings(lang: lang).signedOut)
        .font(.caption.weight(.medium))
        .multilineTextAlignment(.center)
        .foregroundStyle(Palette.foreground)
    }
    .widgetURL(Links.login)
  }
}

extension View {
  func widgetBackground() -> some View {
    containerBackground(for: .widget) { Palette.background }
  }
}

extension Font {
  /// Stands in for the app's Newsreader headings (custom fonts are not bundled in the extension).
  static func heading(_ size: CGFloat) -> Font { .system(size: size, weight: .medium, design: .serif) }
}
