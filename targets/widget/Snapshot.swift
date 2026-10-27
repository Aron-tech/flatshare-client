import Foundation

struct TaskItem: Codable, Hashable, Identifiable {
  let id: Int
  let name: String
  let dueAt: Date?
  let points: Double?
  let isPenalty: Bool
  let symbol: String
  let color: String?
  /// Set for a task completed from the widget; it stays visible as done for a while.
  var doneAt: Date? = nil
  var earned: Double? = nil

  var isDone: Bool { doneAt != nil }
}

struct HouseSummary: Codable {
  let score: Int
  let band: String
  let behindPace: Bool
  /// Zone key → mess level (0–3), only the zones with mess.
  let zones: [String: Int]
  let pet: String?

  var messiestZone: String? {
    zones.filter { $0.value > 0 }.max { $0.value == $1.value ? $0.key > $1.key : $0.value < $1.value }?.key
  }
}

struct Snapshot: Codable {
  let householdId: Int
  var fetchedAt: Date
  var weeklyPoints: Double
  var minPoints: Double
  var spendablePoints: Double
  /// Claimed tasks, by deadline (no deadline last).
  var tasks: [TaskItem]
  var house: HouseSummary?

  var openTasks: [TaskItem] { tasks.filter { !$0.isDone } }
}

enum SnapshotStore {
  private static let cacheKey = "snapshot"
  private static let doneKey = "recent_done"
  private static let errorKey = "last_error"
  /// How long a task completed from the widget stays visible as done.
  private static let doneVisibleFor: TimeInterval = 15 * 60

  static func cached(for session: Session) -> Snapshot? {
    guard let data = AppGroup.defaults.data(forKey: cacheKey),
          let snapshot = try? JSONDecoder().decode(Snapshot.self, from: data),
          snapshot.householdId == session.householdId else { return nil }
    return snapshot
  }

  static func fetch(session: Session) async throws -> Snapshot {
    let api = try Api(session: session)
    async let me = api.me()
    async let instances = api.taskInstances()
    // The house is optional: without it (or on its error) the other widgets still work.
    let house = session.isHouseEnabled ? try? await api.house() : nil

    let claimed = try await instances.claimed.map { dto in
      TaskItem(
        id: dto.id,
        name: dto.task.name,
        dueAt: parseDate(dto.dueAt),
        points: dto.points.map { $0 + (dto.offerPoints ?? 0) },
        isPenalty: dto.isPenalty ?? false,
        symbol: categorySymbol(dto.task.category?.icon, dto.task.category?.name, dto.task.icon),
        color: dto.task.category?.color
      )
    }
    let points = try await me
    let snapshot = Snapshot(
      householdId: session.householdId,
      fetchedAt: .now,
      weeklyPoints: points.weeklyPoints,
      minPoints: points.minPoints,
      spendablePoints: points.spendablePoints,
      tasks: sorted(claimed + recentDone(excluding: Set(claimed.map(\.id)))),
      house: house.map(summarize)
    )
    save(snapshot)
    return snapshot
  }

  static func markCompleted(_ task: TaskItem, result: CompletionDto, session: Session) {
    var done = task
    done.doneAt = .now
    done.earned = result.points + (result.offerPoints ?? 0)
    var recent = loadRecentDone().filter { $0.id != task.id }
    recent.append(done)
    if let data = try? JSONEncoder().encode(recent) { AppGroup.defaults.set(data, forKey: doneKey) }

    guard var snapshot = cached(for: session) else { return }
    snapshot.weeklyPoints = result.weeklyPoints
    snapshot.spendablePoints = result.spendablePoints
    snapshot.tasks = snapshot.tasks.map { $0.id == task.id ? done : $0 }
    save(snapshot)
  }

  static var lastError: String? {
    guard let stored = AppGroup.defaults.dictionary(forKey: errorKey),
          let at = stored["at"] as? Date, Date.now.timeIntervalSince(at) < 10 * 60 else { return nil }
    return stored["message"] as? String
  }

  static func setError(_ message: String?) {
    if let message {
      AppGroup.defaults.set(["message": message, "at": Date.now], forKey: errorKey)
    } else {
      AppGroup.defaults.removeObject(forKey: errorKey)
    }
  }

  private static func save(_ snapshot: Snapshot) {
    if let data = try? JSONEncoder().encode(snapshot) { AppGroup.defaults.set(data, forKey: cacheKey) }
  }

  private static func loadRecentDone() -> [TaskItem] {
    guard let data = AppGroup.defaults.data(forKey: doneKey),
          let items = try? JSONDecoder().decode([TaskItem].self, from: data) else { return [] }
    return items.filter { ($0.doneAt.map { Date.now.timeIntervalSince($0) } ?? .infinity) < doneVisibleFor }
  }

  private static func recentDone(excluding claimedIds: Set<Int>) -> [TaskItem] {
    loadRecentDone().filter { !claimedIds.contains($0.id) }
  }

  private static func sorted(_ tasks: [TaskItem]) -> [TaskItem] {
    tasks.sorted { a, b in
      switch (a.dueAt, b.dueAt) {
      case let (x?, y?): return x < y
      case (_?, nil): return true
      case (nil, _?): return false
      case (nil, nil): return a.id < b.id
      }
    }
  }

  private static func summarize(_ house: HouseDto) -> HouseSummary {
    var zones: [String: Int] = [:]
    for zone in house.zones where zone.messLevel > 0 {
      guard let key = houseZone(zone.categoryIcon, zone.categoryName) else { continue }
      zones[key] = max(zones[key] ?? 0, zone.messLevel)
    }
    return HouseSummary(
      score: Int(house.mood.score.rounded()),
      band: house.mood.band,
      behindPace: house.mood.behindPace,
      zones: zones,
      pet: house.members.first(where: \.isMe)?.character
    )
  }
}
