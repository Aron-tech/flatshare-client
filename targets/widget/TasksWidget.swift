import SwiftUI
import WidgetKit

/// S2 (next task), M1 (today), L1 (my week) and the lock screen's next task, with the interactive ✓.
struct TasksWidget: Widget {
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: "TasksWidget", provider: HQProvider()) { entry in
      TasksWidgetView(entry: entry).widgetBackground()
    }
    .configurationDisplayName(Strings(lang: Session.lastLanguage).myTasks)
    .description(Session.lastLanguage == .en ? "Your claimed tasks; tick them off right here." : "A vállalt feladataid; pipáld ki őket innen.")
    .supportedFamilies([.systemSmall, .systemMedium, .systemLarge, .accessoryRectangular, .accessoryInline])
  }
}

struct TasksWidgetView: View {
  @Environment(\.widgetFamily) private var family
  let entry: HQEntry

  var body: some View {
    switch entry.content {
    case .signedOut(let lang):
      if family.isAccessory { Image(systemName: "house") } else { SignedOutView(lang: lang) }
    case .ready(let ready):
      switch family {
      case .systemMedium: MediumTasks(ready: ready, now: entry.date)
      case .systemLarge: LargeTasks(ready: ready, now: entry.date)
      case .accessoryRectangular: rectangular(ready)
      case .accessoryInline: inline(ready)
      default: SmallNextTask(ready: ready, now: entry.date)
      }
    }
  }

  private func rectangular(_ ready: HQEntry.Ready) -> some View {
    let strings = ready.strings
    return VStack(alignment: .leading, spacing: 1) {
      if let task = ready.snapshot.openTasks.first {
        Text(strings.upNext).font(.caption2).foregroundStyle(.secondary)
        Text(task.name).font(.headline).lineLimit(1).widgetAccentable()
        Text(strings.due(task.dueAt, now: entry.date)).font(.caption).lineLimit(1)
      } else {
        Text(strings.myTasks).font(.caption2).foregroundStyle(.secondary)
        Text(strings.allDone).font(.headline).widgetAccentable()
      }
    }
    .frame(maxWidth: .infinity, alignment: .leading)
    .widgetURL(ready.snapshot.openTasks.first.map { Links.task($0.id) } ?? Links.home)
  }

  private func inline(_ ready: HQEntry.Ready) -> some View {
    let strings = ready.strings
    return Group {
      if let task = ready.snapshot.openTasks.first {
        Text("\(task.name) · \(strings.due(task.dueAt, now: entry.date))")
      } else {
        Text(strings.allDone)
      }
    }
    .widgetURL(Links.home)
  }
}

/// S2: the most urgent claimed task with a big ✓.
struct SmallNextTask: View {
  let ready: HQEntry.Ready
  let now: Date

  var body: some View {
    let strings = ready.strings
    let open = ready.snapshot.openTasks
    if let task = open.first {
      VStack(alignment: .leading, spacing: 4) {
        HStack {
          CategoryBadge(task: task, size: 30)
          Spacer()
          if let justDone = ready.snapshot.tasks.filter(\.isDone).max(by: { $0.doneAt! < $1.doneAt! }), let earned = justDone.earned {
            Label(strings.earned(earned), systemImage: "checkmark")
              .font(.caption2.weight(.semibold))
              .foregroundStyle(Palette.success)
          } else if let points = task.points {
            Text(strings.points(points)).font(.caption.weight(.semibold)).foregroundStyle(Palette.mutedForeground)
          }
        }
        Text(task.name)
          .font(.heading(17))
          .foregroundStyle(Palette.foreground)
          .lineLimit(2)
          .padding(.top, 2)
        Text(strings.taskSubtitle(task, now: now))
          .font(.caption2)
          .foregroundStyle(task.dueAt.map { $0 < now } == true ? Palette.primarySoftForeground : Palette.mutedForeground)
          .lineLimit(1)
        Spacer(minLength: 0)
        Button(intent: CompleteTaskIntent(task: task, householdId: ready.snapshot.householdId)) {
          Label(strings.done, systemImage: "checkmark")
            .font(.caption.weight(.semibold))
            .frame(maxWidth: .infinity)
            .padding(.vertical, 7)
            .background(Capsule().fill(Palette.primary))
            .foregroundStyle(.white)
        }
        .buttonStyle(.plain)
        .widgetAccentable()
      }
      .widgetURL(Links.task(task.id))
    } else {
      AllDoneView(ready: ready, compact: true)
    }
  }
}

/// M1: goal ring on the left, up to three tasks on the right.
struct MediumTasks: View {
  let ready: HQEntry.Ready
  let now: Date

  var body: some View {
    let strings = ready.strings
    let progress = GoalProgress(snapshot: ready.snapshot, session: ready.session, now: now)
    HStack(spacing: 14) {
      Link(destination: Links.home) {
        VStack(spacing: 6) {
          ZStack {
            GoalRing(progress: progress, lineWidth: 7)
            VStack(spacing: -2) {
              Text("\(Int(progress.weekly.rounded()))").font(.heading(20)).foregroundStyle(Palette.foreground)
              Text("/ \(Int(progress.target.rounded()))").font(.caption2.monospacedDigit()).foregroundStyle(Palette.mutedForeground)
            }
          }
          .frame(width: 70, height: 70)
          Text(strings.daysShort(progress.cycle.daysLeft) + " · " + "\(Int((progress.fraction * 100).rounded()))%")
            .font(.caption2)
            .foregroundStyle(Palette.mutedForeground)
        }
      }
      .frame(width: 84)

      if ready.snapshot.tasks.isEmpty {
        AllDoneView(ready: ready, compact: true).frame(maxWidth: .infinity)
      } else {
        VStack(alignment: .leading, spacing: 7) {
          HStack {
            Text(strings.myTasks).font(.caption.weight(.semibold)).foregroundStyle(Palette.mutedForeground)
            Spacer()
            PaceLabel(progress: progress, strings: strings)
          }
          ForEach(ready.snapshot.tasks.prefix(3)) { task in
            TaskRow(task: task, ready: ready, now: now)
          }
          Spacer(minLength: 0)
        }
      }
    }
  }
}

/// L1: goal and pace, five tasks, and the house's mood (or the spendable points without the House feature).
struct LargeTasks: View {
  let ready: HQEntry.Ready
  let now: Date

  var body: some View {
    let strings = ready.strings
    let progress = GoalProgress(snapshot: ready.snapshot, session: ready.session, now: now)
    let tasks = ready.snapshot.tasks
    VStack(alignment: .leading, spacing: 10) {
      Link(destination: Links.home) {
        HStack(spacing: 12) {
          GoalRing(progress: progress, lineWidth: 6).frame(width: 46, height: 46)
          VStack(alignment: .leading, spacing: 2) {
            Text(strings.goalTitle(monthly: ready.session?.resetPeriod == "monthly"))
              .font(.caption.weight(.semibold))
              .foregroundStyle(Palette.mutedForeground)
            Text("\(Int(progress.weekly.rounded())) / \(strings.points(progress.target))")
              .font(.heading(20))
              .foregroundStyle(Palette.foreground)
          }
          Spacer()
          VStack(alignment: .trailing, spacing: 3) {
            PaceLabel(progress: progress, strings: strings)
            Text(strings.daysLeft(progress.cycle.daysLeft)).font(.caption2).foregroundStyle(Palette.mutedForeground)
          }
        }
      }

      Rectangle().fill(Palette.border).frame(height: 1)

      if tasks.isEmpty {
        AllDoneView(ready: ready, compact: false).frame(maxWidth: .infinity, maxHeight: .infinity)
      } else {
        Text(strings.myTasks).font(.caption.weight(.semibold)).foregroundStyle(Palette.mutedForeground)
        VStack(spacing: 9) {
          ForEach(tasks.prefix(5)) { task in
            TaskRow(task: task, ready: ready, now: now)
          }
        }
        if tasks.count > 5 {
          Link(destination: Links.home) {
            Text(strings.more(tasks.count - 5)).font(.caption2.weight(.semibold)).foregroundStyle(Palette.primarySoftForeground)
          }
        }
        Spacer(minLength: 0)
      }

      footer(strings)
    }
  }

  @ViewBuilder
  private func footer(_ strings: Strings) -> some View {
    if ready.error != nil || ready.isStale {
      StatusFooter(ready: ready)
    } else if ready.houseEnabled, let house = ready.snapshot.house {
      Link(destination: Links.house) {
        HStack(spacing: 8) {
          PetImage(house: house).frame(width: 34, height: 34)
          VStack(alignment: .leading, spacing: 0) {
            Text(strings.moodTitle(house.band)).font(.caption.weight(.semibold)).foregroundStyle(Palette.foreground)
            if let zone = house.messiestZone {
              Label(strings.zoneName(zone), systemImage: zoneSymbol(zone))
                .font(.caption2)
                .foregroundStyle(Palette.mutedForeground)
            }
          }
          Spacer()
        }
        .padding(8)
        .background(RoundedRectangle(cornerRadius: 14).fill(Palette.muted))
      }
    } else {
      Text(strings.spendable(ready.snapshot.spendablePoints)).font(.caption2).foregroundStyle(Palette.mutedForeground)
    }
  }
}

/// No open claimed task: a calm "all done" with the pet (House feature) or a leaf.
struct AllDoneView: View {
  let ready: HQEntry.Ready
  let compact: Bool

  var body: some View {
    let strings = ready.strings
    VStack(spacing: 4) {
      if ready.houseEnabled, let house = ready.snapshot.house, house.pet != nil {
        PetImage(house: house).frame(width: compact ? 52 : 72, height: compact ? 52 : 72)
      } else {
        Image(systemName: "leaf").font(.title2).foregroundStyle(Palette.success)
      }
      Text(ready.snapshot.tasks.isEmpty ? strings.noClaimed : strings.allDone)
        .font(.caption.weight(.semibold))
        .foregroundStyle(Palette.foreground)
        .multilineTextAlignment(.center)
      Text(strings.pickFromPool)
        .font(.caption2)
        .foregroundStyle(Palette.mutedForeground)
        .multilineTextAlignment(.center)
        .lineLimit(2)
      StatusFooter(ready: ready)
    }
    .widgetURL(Links.chores)
  }
}

extension WidgetFamily {
  var isAccessory: Bool { self == .accessoryCircular || self == .accessoryRectangular || self == .accessoryInline }
}
