import WidgetKit

struct HQEntry: TimelineEntry {
  let date: Date
  let content: Content

  enum Content {
    case signedOut(Lang)
    case ready(Ready)
  }

  struct Ready {
    let session: Session?
    let snapshot: Snapshot
    /// The last refresh failed, this is the cached data.
    let isStale: Bool
    let error: String?

    var strings: Strings { Strings(lang: session?.lang ?? .hu) }
    var houseEnabled: Bool { session?.isHouseEnabled ?? false }
  }
}

/// One provider for all widgets: they show the same data, so the timelines refresh together.
struct HQProvider: TimelineProvider {
  func placeholder(in context: Context) -> HQEntry {
    HQEntry(date: .now, content: .ready(.sample))
  }

  func getSnapshot(in context: Context, completion: @escaping (HQEntry) -> Void) {
    if context.isPreview, let session = Session.load(), let cached = SnapshotStore.cached(for: session) {
      completion(HQEntry(date: .now, content: .ready(.init(session: session, snapshot: cached, isStale: false, error: nil))))
    } else if context.isPreview {
      completion(placeholder(in: context))
    } else {
      Task { completion(await load()) }
    }
  }

  func getTimeline(in context: Context, completion: @escaping (Timeline<HQEntry>) -> Void) {
    Task {
      let entry = await load()
      if case .signedOut = entry.content {
        // The app reloads the widgets after signing in.
        completion(Timeline(entries: [entry], policy: .never))
        return
      }
      // Deadlines and days left are relative, so the same data is redrawn every 15 minutes, then refetched.
      let entries = (0..<4).map { step in
        HQEntry(date: entry.date.addingTimeInterval(Double(step) * 15 * 60), content: entry.content)
      }
      completion(Timeline(entries: entries, policy: .atEnd))
    }
  }

  private func load() async -> HQEntry {
    guard let session = Session.load() else { return HQEntry(date: .now, content: .signedOut(Session.lastLanguage)) }
    do {
      let snapshot = try await SnapshotStore.fetch(session: session)
      return HQEntry(date: .now, content: .ready(.init(session: session, snapshot: snapshot, isStale: false, error: SnapshotStore.lastError)))
    } catch ApiError.signedOut {
      return HQEntry(date: .now, content: .signedOut(session.lang))
    } catch {
      guard let cached = SnapshotStore.cached(for: session) else {
        return HQEntry(date: .now, content: .ready(.init(session: session, snapshot: .empty(session), isStale: true, error: nil)))
      }
      return HQEntry(date: .now, content: .ready(.init(session: session, snapshot: cached, isStale: true, error: SnapshotStore.lastError)))
    }
  }
}

extension Snapshot {
  static func empty(_ session: Session) -> Snapshot {
    Snapshot(householdId: session.householdId, fetchedAt: .now, weeklyPoints: 0, minPoints: 0, spendablePoints: 0, tasks: [], house: nil)
  }
}

extension HQEntry.Ready {
  /// Gallery preview and placeholder.
  static var sample: HQEntry.Ready {
    let session = Session.load()
    let lang = session?.lang ?? Session.lastLanguage
    let en = lang == .en
    let now = Date.now
    let snapshot = Snapshot(
      householdId: 0,
      fetchedAt: now,
      weeklyPoints: 62,
      minPoints: 100,
      spendablePoints: 18,
      tasks: [
        TaskItem(id: 1, name: en ? "Wash the dishes" : "Mosogatás", dueAt: now.addingTimeInterval(3 * 3600), points: 12, isPenalty: false, symbol: "frying.pan", color: "#D87758"),
        TaskItem(id: 2, name: en ? "Take out the trash" : "Szemét levitele", dueAt: now.addingTimeInterval(26 * 3600), points: 6, isPenalty: false, symbol: "arrow.3.trianglepath", color: "#7C9D86"),
        TaskItem(id: 3, name: en ? "Vacuum the living room" : "Porszívózás a nappaliban", dueAt: now.addingTimeInterval(50 * 3600), points: 15, isPenalty: false, symbol: "sofa", color: "#B48A5A"),
        TaskItem(id: 4, name: en ? "Laundry" : "Mosás", dueAt: nil, points: 10, isPenalty: false, symbol: "washer", color: "#6F8FAF"),
      ],
      house: HouseSummary(score: 72, band: "content", behindPace: false, zones: ["kitchen": 1, "trash": 2], pet: "cat")
    )
    return HQEntry.Ready(session: session, snapshot: snapshot, isStale: false, error: nil)
  }
}
