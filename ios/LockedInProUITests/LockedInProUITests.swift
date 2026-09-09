import XCTest

final class LockedInProUITests: XCTestCase {
  private let proofText =
    "Codex native XCTest proof: completed the receipt drift check-in through the simulator text field."

  override func setUpWithError() throws {
    continueAfterFailure = false
  }

  func testTextProofSubmitFromOpenRoute() throws {
    let app = XCUIApplication(bundleIdentifier: "org.example.menta")
    app.activate()

    let input = app.descendants(matching: .any)["text-proof-input"]
    XCTAssertTrue(
      input.waitForExistence(timeout: 20),
      "Expected the text proof route to be open before running the UI test."
    )

    input.tap()
    input.typeText(proofText)

    let sendButton = app.descendants(matching: .any)["send-text-proof-button"]
    XCTAssertTrue(
      sendButton.waitForExistence(timeout: 10),
      "Expected the Send proof button to be visible after entering proof text."
    )
    sendButton.tap()

    let receipt = app.descendants(matching: .any)["proof-submit-state-screen"]
    XCTAssertTrue(
      receipt.waitForExistence(timeout: 30),
      "Expected proof submission to reach the receipt state."
    )
    XCTAssertTrue(
      app.staticTexts["You showed up"].waitForExistence(timeout: 10),
      "Expected pending/receipt copy after proof submission."
    )
  }

  func testReviewQueueOpensScopedPeerProofFromReceipt() throws {
    guard
      ProcessInfo.processInfo.environment["MENTA_UI_TEST_REVIEW_RECEIPT"] == "1"
    else {
      throw XCTSkip("Set MENTA_UI_TEST_REVIEW_RECEIPT=1 for the live review receipt smoke.")
    }

    let app = XCUIApplication(bundleIdentifier: "org.example.menta")
    app.activate()

    let reviewButton = app.buttons["Review someone else"]
    XCTAssertTrue(
      reviewButton.waitForExistence(timeout: 15),
      "Expected the proof receipt to expose the Review someone else action."
    )
    reviewButton.tap()

    XCTAssertTrue(
      app.staticTexts["Review Queue"].waitForExistence(timeout: 30) ||
        app.staticTexts["Challenge review"].waitForExistence(timeout: 1),
      "Expected tapping Review someone else to open the review queue."
    )
    XCTAssertTrue(
      app.staticTexts["Review Submitter"].waitForExistence(timeout: 20),
      "Expected the scoped peer submitter to appear in the review queue."
    )
    XCTAssertTrue(
      app.staticTexts["Codex review fixture 2026-06-05"].waitForExistence(timeout: 10),
      "Expected the temporary review fixture challenge to appear in the queue."
    )
  }
}
