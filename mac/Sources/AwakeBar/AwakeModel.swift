import Foundation
@preconcurrency import UserNotifications

struct BatteryInfo: Decodable {
    let percent: Int?
    let onAc: Bool
    let charging: Bool
}

struct AwakeStatus: Decodable {
    let enabled: Bool
    let managed: Bool
    let forever: Bool
    let since: String?
    let until: String?
    let remainingSeconds: Int?
    let battery: BatteryInfo?
    let sudoersConfigured: Bool?

    static let initial = AwakeStatus(
        enabled: false, managed: false, forever: false,
        since: nil, until: nil, remainingSeconds: nil,
        battery: nil, sudoersConfigured: nil
    )

    var untilDate: Date? {
        guard let until else { return nil }
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return formatter.date(from: until)
    }
}

private struct Envelope<T: Decodable>: Decodable {
    let data: T?
}

@MainActor
final class AwakeModel: ObservableObject {
    @Published var status: AwakeStatus = .initial
    @Published var cliFound: Bool

    private let invocation: [String]?
    private var timer: Timer?

    init() {
        invocation = Self.resolveInvocation()
        cliFound = invocation != nil
        refresh()
        timer = Timer.scheduledTimer(withTimeInterval: 60, repeats: true) { [weak self] _ in
            Task { @MainActor in self?.refresh() }
        }
    }

    // The CLI ships as a JS entrypoint whose `env node` shebang is useless in
    // a GUI context (nvm/bun PATHs live in shell rc files), so resolve the
    // symlink and pair it with a runtime found at a known location.
    nonisolated static func resolveInvocation() -> [String]? {
        let fm = FileManager.default
        let home = fm.homeDirectoryForCurrentUser.path
        let cliCandidates = [
            "\(home)/.bun/bin/awake",
            "/opt/homebrew/bin/awake",
            "/usr/local/bin/awake",
        ]
        guard let cli = cliCandidates.first(where: { fm.fileExists(atPath: $0) }) else {
            return nil
        }
        let resolved = URL(fileURLWithPath: cli).resolvingSymlinksInPath().path
        guard resolved.hasSuffix(".js") else { return [resolved] }

        let runtimeCandidates = [
            "\(home)/.bun/bin/bun",
            "/opt/homebrew/bin/bun",
            "/opt/homebrew/bin/node",
            "/usr/local/bin/node",
        ]
        guard let runtime = runtimeCandidates.first(where: { fm.isExecutableFile(atPath: $0) }) else {
            return nil
        }
        return [runtime, resolved]
    }

    func refresh() { perform(nil) }
    func turnOn(_ duration: String) { perform(["on", duration, "--json"]) }
    func turnOnForever() { perform(["on", "--forever", "--json"]) }
    func turnOff() { perform(["off", "--json"]) }

    // Action commands (on/off) now return the same JSON shape as `status`,
    // so decode that reply directly instead of always following up with a
    // separate `status --json` call - halves the subprocesses per click.
    // Falls back to an explicit status call only if the action's own reply
    // didn't decode (e.g. it errored and wrote to stderr instead).
    private func perform(_ action: [String]?) {
        guard let invocation else { return }
        Task.detached(priority: .userInitiated) { [weak self] in
            let decoder = JSONDecoder()
            decoder.keyDecodingStrategy = .convertFromSnakeCase
            func decode(_ output: Data?) -> AwakeStatus? {
                output.flatMap {
                    try? decoder.decode(Envelope<AwakeStatus>.self, from: $0).data
                }
            }

            let status: AwakeStatus? = {
                if let action, let decoded = decode(Self.execute(invocation + action)) {
                    return decoded
                }
                return decode(Self.execute(invocation + ["status", "--json"]))
            }()

            await MainActor.run { [weak self] in
                guard let self, let status else { return }
                self.status = status
                self.updateReminder(for: status)
            }
        }
    }

    nonisolated private static func execute(_ argv: [String]) -> Data? {
        guard let first = argv.first else { return nil }
        let process = Process()
        process.executableURL = URL(fileURLWithPath: first)
        process.arguments = Array(argv.dropFirst())
        let stdout = Pipe()
        process.standardOutput = stdout
        process.standardError = Pipe()
        do {
            try process.run()
        } catch {
            return nil
        }
        let data = stdout.fileHandleForReading.readDataToEndOfFile()
        process.waitUntilExit()
        return data
    }

    // A repeating "still on" nudge, only for forever mode - timed sessions
    // already auto-off and notify from the CLI side.
    private func updateReminder(for status: AwakeStatus) {
        guard Bundle.main.bundleIdentifier != nil else { return }
        let center = UNUserNotificationCenter.current()
        let identifier = "awake.reminder"

        guard status.enabled, status.forever else {
            center.removePendingNotificationRequests(withIdentifiers: [identifier])
            return
        }

        center.requestAuthorization(options: [.alert, .sound]) { granted, _ in
            guard granted else { return }
            center.getPendingNotificationRequests { pending in
                guard !pending.contains(where: { $0.identifier == identifier }) else { return }
                let content = UNMutableNotificationContent()
                content.title = "Awake is still on"
                content.body = "Your Mac is being kept awake with no timer. Turn it off from the menu bar when you are done."
                let trigger = UNTimeIntervalNotificationTrigger(timeInterval: 3600, repeats: true)
                center.add(UNNotificationRequest(identifier: identifier, content: content, trigger: trigger))
            }
        }
    }

    var statusLine: String {
        if !status.enabled {
            return "Off - closing the lid sleeps normally"
        }
        if status.forever {
            return "On until you turn it off"
        }
        if let until = status.untilDate {
            return "On - auto-off at \(Self.timeFormatter.string(from: until))"
        }
        return "On"
    }

    var menuBarCountdown: String? {
        guard status.enabled, !status.forever, let until = status.untilDate else {
            return nil
        }
        let minutes = Int(max(0, until.timeIntervalSinceNow) / 60)
        if minutes >= 60 {
            return "\(minutes / 60)h \(minutes % 60)m"
        }
        return "\(minutes)m"
    }

    private static let timeFormatter: DateFormatter = {
        let formatter = DateFormatter()
        formatter.timeStyle = .short
        formatter.dateStyle = .none
        return formatter
    }()
}
