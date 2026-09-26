import WidgetKit
import SwiftUI
internal import ExpoWidgets

struct MentaStreak: Widget {
  let name: String = "MentaStreak"

  var body: some WidgetConfiguration {
    StaticConfiguration(kind: name, provider: WidgetsTimelineProvider(name: name)) { entry in
      WidgetsEntryView(entry: entry)
    }
    .configurationDisplayName("Your streak")
    .description("Keep your promise and streak in sight.")
    .supportedFamilies([.systemSmall, .systemMedium, .systemLarge, .systemExtraLarge, .accessoryCircular, .accessoryRectangular, .accessoryInline])
  }
}