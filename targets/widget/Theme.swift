import SwiftUI

/// Colorsets from expo-target.config.js (the app's global.css tokens).
enum Palette {
  static let background = Color("background")
  static let foreground = Color("foreground")
  static let mutedForeground = Color("mutedForeground")
  static let muted = Color("muted")
  static let primary = Color("primary")
  static let primarySoft = Color("primarySoft")
  static let primarySoftForeground = Color("primarySoftForeground")
  static let success = Color("success")
  static let successSoft = Color("successSoft")
  static let border = Color("border")
}

extension Color {
  init?(hex: String?) {
    guard let hex, hex.count == 7, hex.hasPrefix("#"), let value = Int(hex.dropFirst(), radix: 16) else { return nil }
    self.init(
      red: Double((value >> 16) & 0xFF) / 255,
      green: Double((value >> 8) & 0xFF) / 255,
      blue: Double(value & 0xFF) / 255
    )
  }
}

/// SF Symbol for a category, by the same keywords as `components/category-icon.tsx`.
func categorySymbol(_ hints: String?...) -> String {
  let haystack = hints.compactMap { $0 }.joined(separator: " ")
  let keywords: [(String, String)] = [
    ("kitchen|cook|konyh|főz|dish|mosogat", "frying.pan"),
    ("bath|shower|fürd|zuhany|toilet|wc", "shower"),
    ("living|sofa|couch|nappali|floor|padló", "sofa"),
    ("eco|recycl|trash|waste|szemét|szelektív|kuka", "arrow.3.trianglepath"),
    ("plant|garden|növény|kert|virág", "leaf"),
    ("laundry|wash|mosás|ruha", "washer"),
    ("shop|cart|bevásár|supplies|készlet", "cart"),
    ("meal|dinner|vacsora|chef", "fork.knife"),
  ]
  return keywords.first { haystack.range(of: $0.0, options: [.regularExpression, .caseInsensitive]) != nil }?.1 ?? "sparkles"
}

/// The House view's zones in display order, with their symbols.
let houseZones: [(key: String, symbol: String)] = [
  ("kitchen", "frying.pan"),
  ("cleaning", "sparkles"),
  ("trash", "trash"),
  ("laundry", "washer"),
  ("shopping", "cart"),
  ("bathroom", "shower"),
]

/// Which zone a category's mess belongs to, by the same keywords as `lib/house/zones.ts`.
func houseZone(_ hints: String?...) -> String? {
  let rules: [(String, String)] = [
    ("utensil|kitchen|konyha|dish|edény|mosogat|cook|meal|food|főz", "kitchen"),
    ("bath|fürdő|toilet|wc|shower|zuhany", "bathroom"),
    ("shirt|laundry|mosás|ruha|cloth|vasal|iron", "laundry"),
    ("trash|szemét|garbage|bin|recycl|eco|kuka", "trash"),
    ("shop|cart|bevásár|grocer|vásárl", "shopping"),
    ("spray|clean|takarít|vacuum|floor|padló|porsz|sparkle|broom|söpr|living|nappali", "cleaning"),
  ]
  for hint in hints.compactMap({ $0 }) {
    if let match = rules.first(where: { hint.range(of: $0.0, options: [.regularExpression, .caseInsensitive]) != nil }) {
      return match.1
    }
  }
  return nil
}

func zoneSymbol(_ key: String) -> String {
  houseZones.first { $0.key == key }?.symbol ?? "sparkles"
}

/// Pet still frame for the mood (`scripts/house-assets/widget-pets.mjs`).
func petImageName(_ pet: String, band: String) -> String {
  let pose = switch band {
  case "happy": "happy"
  case "content": "idle"
  default: "sad"
  }
  return "pet_\(pet)_\(pose)"
}
