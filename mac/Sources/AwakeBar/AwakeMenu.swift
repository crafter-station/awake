import AppKit
import SwiftUI

struct AwakeMenu: View {
    @ObservedObject var model: AwakeModel

    var body: some View {
        Text(model.statusLine)
        Divider()

        if model.status.enabled {
            Button("Turn off") { model.turnOff() }
            Divider()
            Section("Restart timer") {
                durationButtons
            }
        } else {
            durationButtons
        }

        Divider()

        if !model.cliFound {
            Text("awake CLI not found")
            Text("Install it, then relaunch this app")
            Divider()
        } else if model.status.sudoersConfigured == false {
            Text("Run `awake setup` in a terminal first")
            Divider()
        }

        Button("Refresh status") { model.refresh() }
        Button("Quit Awake") { NSApplication.shared.terminate(nil) }
            .keyboardShortcut("q")
    }

    @ViewBuilder
    private var durationButtons: some View {
        Button("Keep awake 30 min") { model.turnOn("30m") }
        Button("Keep awake 1 hour") { model.turnOn("1h") }
        Button("Keep awake 2 hours") { model.turnOn("2h") }
        Button("Keep awake until turned off") { model.turnOnForever() }
    }
}
