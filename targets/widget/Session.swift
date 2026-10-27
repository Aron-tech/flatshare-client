import Foundation
import Security

/// What the app shares with the widgets (`src/services/widgets/WidgetSync.ts`).
enum AppGroup {
  /// `group.<app bundle id>`; the extension's bundle id is `<app bundle id>.widget`.
  static let id: String = {
    let parts = (Bundle.main.bundleIdentifier ?? "").split(separator: ".").dropLast()
    return "group." + parts.joined(separator: ".")
  }()

  static var defaults: UserDefaults { UserDefaults(suiteName: id) ?? .standard }
}

struct Session: Decodable {
  let baseUrl: String
  let appKey: String
  let householdId: Int
  let language: String
  let houseEnabled: Int
  let resetPeriod: String
  let resetDayOfWeek: Int
  let resetDayOfMonth: Int

  var isHouseEnabled: Bool { houseEnabled == 1 }
  var lang: Lang { language == "en" ? .en : .hu }

  static func load() -> Session? {
    guard let data = AppGroup.defaults.data(forKey: "session") else { return nil }
    let decoder = JSONDecoder()
    decoder.keyDecodingStrategy = .convertFromSnakeCase
    return try? decoder.decode(Session.self, from: data)
  }

  /// The language for the "signed out" state, when there is no session.
  static var lastLanguage: Lang { load()?.lang ?? (Locale.current.language.languageCode?.identifier == "en" ? .en : .hu) }
}

/// Reads the token the app stores with expo-secure-store (`keychainService: "widget"`, the app group as access group).
enum TokenStore {
  static func read() -> String? {
    let account = Data("auth_token".utf8)
    let query: [String: Any] = [
      kSecClass as String: kSecClassGenericPassword,
      kSecAttrService as String: "widget:no-auth",
      kSecAttrGeneric as String: account,
      kSecAttrAccount as String: account,
      kSecAttrAccessGroup as String: AppGroup.id,
      kSecMatchLimit as String: kSecMatchLimitOne,
      kSecReturnData as String: kCFBooleanTrue as Any,
    ]
    var item: CFTypeRef?
    guard SecItemCopyMatching(query as CFDictionary, &item) == errSecSuccess, let data = item as? Data else { return nil }
    return String(data: data, encoding: .utf8)
  }
}
