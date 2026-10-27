import Foundation

enum Lang {
  case hu, en

  var locale: Locale { Locale(identifier: self == .en ? "en_US" : "hu_HU") }
}

/// Widget texts; the wording follows the app's locales (`src/i18n/locales`).
struct Strings {
  let lang: Lang

  private func pick(_ hu: String, _ en: String) -> String { lang == .en ? en : hu }

  func goalTitle(monthly: Bool) -> String { monthly ? pick("Havi cél", "Monthly goal") : pick("Heti cél", "Weekly goal") }
  var pointsUnit: String { pick("pont", "pts") }
  func points(_ value: Double) -> String { "\(Int(value.rounded())) \(pointsUnit)" }
  func daysLeft(_ count: Int) -> String {
    pick("\(count) nap van hátra", count == 1 ? "1 day left" : "\(count) days left")
  }
  func daysShort(_ count: Int) -> String { pick("\(count) nap", "\(count)d") }
  func behind(_ count: Int) -> String { pick("\(count) pont lemaradás", "\(count) pts behind") }
  var onPace: String { pick("Jó tempóban", "On pace") }
  var goalReached: String { pick("Cél teljesítve", "Goal reached") }
  func spendable(_ value: Double) -> String { pick("Költhető: \(points(value))", "Spendable: \(points(value))") }

  var upNext: String { pick("Következő", "Up next") }
  var myTasks: String { pick("Feladataim", "My Tasks") }
  var done: String { pick("Kész", "Done") }
  var allDone: String { pick("Minden kész", "All done") }
  var noClaimed: String { pick("Nincs vállalt feladatod", "No claimed tasks") }
  var pickFromPool: String { pick("Válassz a szabad feladatok közül", "Pick one from the pool") }
  func more(_ count: Int) -> String { pick("+\(count) további", "+\(count) more") }
  var penalty: String { pick("Büntetés", "Penalty") }
  func earned(_ value: Double) -> String { "+\(Int(value.rounded())) \(pointsUnit)" }

  var signedOut: String { pick("Jelentkezz be a HomeQuestbe", "Sign in to HomeQuest") }
  func updated(_ date: Date) -> String {
    pick("Frissítve: \(time(date))", "Updated \(time(date))")
  }
  var actionFailed: String { pick("Nem sikerült. Nyisd meg az appot.", "That didn't work. Open the app.") }

  func moodTitle(_ band: String) -> String {
    switch band {
    case "happy": pick("Boldog a ház", "The house is happy")
    case "content": pick("Elégedett a ház", "The house is content")
    case "grumpy": pick("Morcos a ház", "The house is grumpy")
    default: pick("Szomorú a ház", "The house is sad")
    }
  }

  func moodBody(_ band: String) -> String {
    switch band {
    case "happy": pick("Minden rendben, az állatok táncolnak.", "All tidy, the animals are dancing.")
    case "content": pick("Néhány apróság vár, de jól álltok.", "A few little things are waiting, but you're doing well.")
    case "grumpy": pick("Gyűlik a rendetlenség, ideje rendet rakni.", "The mess is piling up, time to tidy.")
    default: pick("Sok minden elmaradt, közös erővel gyorsan rendbe jön.", "A lot has slipped, together it will be tidy in no time.")
    }
  }

  var behindPaceHouse: String { pick("A háztartás lemaradt a tempótól", "The household is behind pace") }

  func zoneName(_ key: String) -> String {
    switch key {
    case "kitchen": pick("Konyha", "Kitchen")
    case "cleaning": pick("Padló és takarítás", "Floor and cleaning")
    case "trash": pick("Szemét", "Trash")
    case "laundry": pick("Mosás", "Laundry")
    case "shopping": pick("Bevásárlás", "Shopping")
    case "bathroom": pick("Fürdőszoba", "Bathroom")
    default: pick("Egyéb", "Other")
    }
  }

  /// Same as the app's `formatDue`: "Ma, 18:00-ig", "Holnap, 08:00", "Szombat, 15:00"…
  func due(_ date: Date?, now: Date) -> String {
    guard let date else { return pick("Nincs határidő", "No deadline") }
    let calendar = Calendar.current
    let days = calendar.dateComponents([.day], from: calendar.startOfDay(for: now), to: calendar.startOfDay(for: date)).day ?? 0
    let clock = time(date)
    if date < now { return pick("Lejárt (\(clock))", "Overdue (\(clock))") }
    if days == 0 { return pick("Ma, \(clock)-ig", "Today, by \(clock)") }
    if days == 1 { return pick("Holnap, \(clock)", "Tomorrow, \(clock)") }
    if days < 7 {
      let weekday = format(date, template: "EEEE")
      return "\(weekday.prefix(1).uppercased() + weekday.dropFirst()), \(clock)"
    }
    return format(date, template: "MMMd")
  }

  /// Two-digit hours like the app's `toLocaleTimeString(…, { hour: "2-digit" })`: "08:00", "08:00 AM".
  private func time(_ date: Date) -> String {
    if lang == .en { return format(date, template: "hh:mm a") }
    let formatter = DateFormatter()
    formatter.locale = lang.locale
    formatter.dateFormat = "HH:mm"
    return formatter.string(from: date)
  }

  private func format(_ date: Date, template: String) -> String {
    let formatter = DateFormatter()
    formatter.locale = lang.locale
    formatter.setLocalizedDateFormatFromTemplate(template)
    return formatter.string(from: date)
  }

  /// A task's deadline line, with the penalty mark.
  func taskSubtitle(_ task: TaskItem, now: Date) -> String {
    if task.isDone { return done }
    return task.isPenalty ? "\(penalty) · \(due(task.dueAt, now: now))" : due(task.dueAt, now: now)
  }
}

/// The household's goal period, like `lib/cycle.ts`.
struct Cycle {
  let elapsedFraction: Double
  let daysLeft: Int

  init(session: Session?, now: Date = .now) {
    let calendar = Calendar.current
    var start = calendar.startOfDay(for: now)
    let end: Date
    if session?.resetPeriod == "monthly" {
      let resetDay = session?.resetDayOfMonth ?? 1
      if calendar.component(.day, from: start) < resetDay {
        start = calendar.date(byAdding: .month, value: -1, to: start)!
      }
      var parts = calendar.dateComponents([.year, .month], from: start)
      parts.day = resetDay
      start = calendar.date(from: parts)!
      end = calendar.date(byAdding: .month, value: 1, to: start)!
    } else {
      let resetDay = session?.resetDayOfWeek ?? 1
      // Calendar weekday: Sunday = 1; ISO: Monday = 1
      let isoDay = (calendar.component(.weekday, from: start) + 5) % 7 + 1
      start = calendar.date(byAdding: .day, value: -((isoDay - resetDay + 7) % 7), to: start)!
      end = calendar.date(byAdding: .day, value: 7, to: start)!
    }
    let elapsed = now.timeIntervalSince(start) / end.timeIntervalSince(start)
    elapsedFraction = min(1, max(0, elapsed))
    daysLeft = max(0, Int((end.timeIntervalSince(now) / 86_400).rounded(.up)))
  }
}

/// The goal card's numbers (`weekly-goal-card.tsx`).
struct GoalProgress {
  let weekly: Double
  let target: Double
  let behind: Int
  let cycle: Cycle

  init(snapshot: Snapshot, session: Session?, now: Date) {
    weekly = snapshot.weeklyPoints
    target = snapshot.minPoints
    cycle = Cycle(session: session, now: now)
    behind = max(0, Int((target * cycle.elapsedFraction).rounded()) - Int(weekly.rounded()))
  }

  var fraction: Double { target > 0 ? min(1, weekly / target) : 1 }
  var reached: Bool { weekly >= target }
}
