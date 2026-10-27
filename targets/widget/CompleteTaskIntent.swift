import AppIntents
import WidgetKit

/// The widget's ✓ button: completes the claimed task on the backend without opening the app.
struct CompleteTaskIntent: AppIntent {
  static let title: LocalizedStringResource = "Complete task"
  static let isDiscoverable = false

  @Parameter(title: "Task instance")
  var taskInstanceId: Int

  @Parameter(title: "Household")
  var householdId: Int

  init() {}

  init(task: TaskItem, householdId: Int) {
    self.taskInstanceId = task.id
    self.householdId = householdId
  }

  func perform() async throws -> some IntentResult {
    let strings = Strings(lang: Session.lastLanguage)
    // A household switch in the app since the last redraw: the task belongs to another household.
    guard let session = Session.load(), session.householdId == householdId,
          let task = SnapshotStore.cached(for: session)?.tasks.first(where: { $0.id == taskInstanceId }) else {
      SnapshotStore.setError(strings.actionFailed)
      return .result()
    }
    do {
      let result = try await Api(session: session).complete(taskInstanceId: taskInstanceId)
      SnapshotStore.markCompleted(task, result: result, session: session)
      SnapshotStore.setError(nil)
    } catch {
      SnapshotStore.setError((error as? ApiError)?.message ?? strings.actionFailed)
    }
    // The system reloads the widget after the intent; the app refreshes its data when it comes to the foreground.
    return .result()
  }
}
