import Foundation

enum ApiError: Error {
  case signedOut
  case http(Int, String?)

  var message: String? {
    if case .http(_, let message) = self { return message }
    return nil
  }
}

/// The few backend endpoints the widgets use, with the same headers as the app's `HttpClient`.
struct Api {
  let session: Session
  let token: String

  init(session: Session) throws {
    guard let token = TokenStore.read() else { throw ApiError.signedOut }
    self.session = session
    self.token = token
  }

  private var household: String { "/households/\(session.householdId)" }

  func me() async throws -> MeDto { try await get("\(household)/me") }
  func taskInstances() async throws -> TaskInstancesDto { try await get("\(household)/task-instances") }
  func house() async throws -> HouseDto { try await get("\(household)/house") }

  func complete(taskInstanceId: Int) async throws -> CompletionDto {
    try decode(try await request("\(household)/task-instances/\(taskInstanceId)/complete", method: "POST"))
  }

  private func get<T: Decodable>(_ path: String) async throws -> T {
    try decode(try await request(path, method: "GET"))
  }

  private func request(_ path: String, method: String) async throws -> Data {
    guard let url = URL(string: session.baseUrl + path) else { throw ApiError.http(0, nil) }
    var request = URLRequest(url: url, timeoutInterval: 12)
    request.httpMethod = method
    request.setValue("application/json", forHTTPHeaderField: "Accept")
    request.setValue("application/json", forHTTPHeaderField: "Content-Type")
    request.setValue(session.language, forHTTPHeaderField: "Accept-Language")
    request.setValue(session.appKey, forHTTPHeaderField: "X-App-Key")
    request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")

    let (data, response) = try await URLSession.shared.data(for: request)
    let status = (response as? HTTPURLResponse)?.statusCode ?? 0
    guard (200..<300).contains(status) else {
      if status == 401 { throw ApiError.signedOut }
      throw ApiError.http(status, (try? JSONDecoder().decode(MessageDto.self, from: data))?.message)
    }
    return data
  }

  private func decode<T: Decodable>(_ data: Data) throws -> T {
    let decoder = JSONDecoder()
    decoder.keyDecodingStrategy = .convertFromSnakeCase
    return try decoder.decode(T.self, from: data)
  }
}

struct MessageDto: Decodable {
  let message: String?
}

struct MeDto: Decodable {
  let minPoints: Double
  let weeklyPoints: Double
  let spendablePoints: Double
}

struct TaskInstancesDto: Decodable {
  let claimed: [TaskInstanceDto]
}

struct TaskInstanceDto: Decodable {
  let id: Int
  let dueAt: String?
  let points: Double?
  let isPenalty: Bool?
  let offerPoints: Double?
  let task: TaskDto

  struct TaskDto: Decodable {
    let name: String
    let icon: String?
    let category: CategoryDto?
  }

  struct CategoryDto: Decodable {
    let name: String?
    let icon: String?
    let color: String?
  }
}

struct HouseDto: Decodable {
  let mood: Mood
  let zones: [Zone]
  let members: [Member]

  struct Mood: Decodable {
    let score: Double
    let band: String
    let behindPace: Bool
  }

  struct Zone: Decodable {
    let categoryIcon: String?
    let categoryName: String?
    let messLevel: Int
  }

  struct Member: Decodable {
    let character: String
    let isMe: Bool
  }
}

struct CompletionDto: Decodable {
  let points: Double
  let offerPoints: Double?
  let weeklyPoints: Double
  let spendablePoints: Double
}

/// Laravel sends microseconds ("2026-10-26T18:00:00.000000Z"), which ISO8601DateFormatter does not always accept.
func parseDate(_ value: String?) -> Date? {
  guard let value else { return nil }
  let trimmed = value.replacingOccurrences(of: #"\.\d+"#, with: "", options: .regularExpression)
  return ISO8601DateFormatter().date(from: trimmed)
}
