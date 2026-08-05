import AppKit
import SwiftUI

@main
struct AwakeBarApp: App {
    @StateObject private var model = AwakeModel()

    init() {
        // Menu bar only - never show a Dock icon, even when run unbundled.
        NSApplication.shared.setActivationPolicy(.accessory)
    }

    var body: some Scene {
        MenuBarExtra {
            AwakeMenu(model: model)
        } label: {
            Image(systemName: model.status.enabled ? "sun.max.fill" : "moon.zzz")
            if let countdown = model.menuBarCountdown {
                Text(countdown)
            }
        }
        .menuBarExtraStyle(.menu)
    }
}
