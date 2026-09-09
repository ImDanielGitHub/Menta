import AppIntents
import UIKit

private enum MentaIntentError: Error, LocalizedError {
  case invalidRoute
  case couldNotOpenMenta

  var errorDescription: String? {
    switch self {
    case .invalidRoute:
      return "Menta could not build that action."
    case .couldNotOpenMenta:
      return "Menta could not open that action. Try opening the app first."
    }
  }
}

@available(iOS 16.0, *)
@MainActor
private func openMentaRoute(_ route: String) async throws {
  guard let url = URL(string: "menta://\(route)") else {
    throw MentaIntentError.invalidRoute
  }

  let opened = await withCheckedContinuation { continuation in
    UIApplication.shared.open(url, options: [:]) { success in
      continuation.resume(returning: success)
    }
  }

  guard opened else {
    throw MentaIntentError.couldNotOpenMenta
  }
}

@available(iOS 16.0, *)
struct AddProofIntent: AppIntent {
  static var title: LocalizedStringResource = "Add Proof"
  static var description = IntentDescription(
    "Open the next promise that needs proof in Menta."
  )
  static var openAppWhenRun = true

  @MainActor
  func perform() async throws -> some IntentResult & ProvidesDialog {
    try await openMentaRoute("checkin")
    return .result(dialog: "Opening the next promise that needs proof")
  }
}

@available(iOS 16.0, *)
struct ReviewProofIntent: AppIntent {
  static var title: LocalizedStringResource = "Review Proof"
  static var description = IntentDescription(
    "Open proof that is waiting for your review in Menta."
  )
  static var openAppWhenRun = true

  @MainActor
  func perform() async throws -> some IntentResult & ProvidesDialog {
    try await openMentaRoute("review-queue")
    return .result(dialog: "Opening proof waiting for review")
  }
}

@available(iOS 16.0, *)
struct JoinGroupIntent: AppIntent {
  static var title: LocalizedStringResource = "Join a Group"
  static var description = IntentDescription(
    "Open Menta to enter a group invite code."
  )
  static var openAppWhenRun = true

  @MainActor
  func perform() async throws -> some IntentResult & ProvidesDialog {
    try await openMentaRoute("join-group")
    return .result(dialog: "Opening group invite entry")
  }
}

@available(iOS 16.0, *)
struct MentaAppShortcuts: AppShortcutsProvider {
  static var shortcutTileColor: ShortcutTileColor = .purple

  static var appShortcuts: [AppShortcut] {
    AppShortcut(
      intent: AddProofIntent(),
      phrases: [
        "Add proof in \(.applicationName)",
        "Open my next proof in \(.applicationName)",
      ],
      shortTitle: "Add Proof",
      systemImageName: "checkmark.circle"
    )

    AppShortcut(
      intent: ReviewProofIntent(),
      phrases: [
        "Review proof in \(.applicationName)",
        "Open proof to review in \(.applicationName)",
      ],
      shortTitle: "Review Proof",
      systemImageName: "checkmark.message"
    )

    AppShortcut(
      intent: JoinGroupIntent(),
      phrases: [
        "Join a group in \(.applicationName)",
        "Enter a group invite in \(.applicationName)",
      ],
      shortTitle: "Join a Group",
      systemImageName: "person.2.badge.plus"
    )
  }
}
