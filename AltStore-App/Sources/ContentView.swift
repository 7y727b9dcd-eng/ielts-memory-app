import SwiftUI
import UserNotifications
import WebKit

struct ContentView: View {
    var body: some View {
        WebAppView()
            .ignoresSafeArea()
    }
}

struct WebAppView: UIViewRepresentable {
    func makeCoordinator() -> Coordinator {
        Coordinator()
    }

    func makeUIView(context: Context) -> WKWebView {
        let configuration = WKWebViewConfiguration()
        configuration.websiteDataStore = .default()
        configuration.setURLSchemeHandler(LocalSchemeHandler(), forURLScheme: "listentraining")
        configuration.userContentController.add(context.coordinator, name: "shareBackup")
        configuration.userContentController.add(context.coordinator, name: "scheduleReminder")

        let webView = WKWebView(frame: .zero, configuration: configuration)
        webView.isOpaque = false
        webView.backgroundColor = UIColor(red: 0.961, green: 0.949, blue: 0.918, alpha: 1)
        webView.scrollView.contentInsetAdjustmentBehavior = .never
        webView.allowsBackForwardNavigationGestures = false
        webView.navigationDelegate = context.coordinator
        webView.uiDelegate = context.coordinator

        if let url = URL(string: "listentraining://app/index.html") {
            webView.load(URLRequest(url: url))
        }
        return webView
    }

    func updateUIView(_ webView: WKWebView, context: Context) {}

    static func dismantleUIView(_ webView: WKWebView, coordinator: Coordinator) {
        webView.configuration.userContentController.removeScriptMessageHandler(forName: "shareBackup")
        webView.configuration.userContentController.removeScriptMessageHandler(forName: "scheduleReminder")
    }

    final class Coordinator: NSObject, WKScriptMessageHandler, WKNavigationDelegate, WKUIDelegate {
        func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
            if message.name == "scheduleReminder", let payload = message.body as? [String: Any] {
                scheduleReminders(payload, webView: message.webView)
                return
            }

            guard message.name == "shareBackup", let json = message.body as? String else { return }
            let url = FileManager.default.temporaryDirectory.appendingPathComponent("listening-training-backup.json")

            do {
                try json.write(to: url, atomically: true, encoding: .utf8)
                presentShareSheet(for: url)
            } catch {
                return
            }
        }

        private func scheduleReminders(_ payload: [String: Any], webView: WKWebView?) {
            let center = UNUserNotificationCenter.current()
            let identifiers = (0..<5).map { "listening-training-reminder-\($0)" }
            center.removePendingNotificationRequests(withIdentifiers: identifiers)

            guard payload["enabled"] as? Bool == true else {
                reportReminderStatus("disabled", webView: webView)
                return
            }

            let weeklyGoal = min(5, max(2, payload["weeklyGoal"] as? Int ?? 3))
            let timeParts = (payload["time"] as? String ?? "20:00").split(separator: ":").compactMap { Int($0) }
            let hour = timeParts.first ?? 20
            let minute = timeParts.count > 1 ? timeParts[1] : 0
            let weekdayMap: [Int: [Int]] = [
                2: [3, 6],
                3: [2, 4, 6],
                4: [2, 3, 5, 6],
                5: [2, 3, 4, 5, 6],
            ]

            center.requestAuthorization(options: [.alert, .sound, .badge]) { [weak self] granted, _ in
                guard granted else {
                    self?.reportReminderStatus("denied", webView: webView)
                    return
                }

                for (index, weekday) in (weekdayMap[weeklyGoal] ?? weekdayMap[3]!).enumerated() {
                    let content = UNMutableNotificationContent()
                    content.title = "聆听训练"
                    content.body = "用 20 分钟练习边听边压缩，让工作对话更容易跟上。"
                    content.sound = .default

                    var components = DateComponents()
                    components.weekday = weekday
                    components.hour = hour
                    components.minute = minute
                    let trigger = UNCalendarNotificationTrigger(dateMatching: components, repeats: true)
                    let request = UNNotificationRequest(identifier: identifiers[index], content: content, trigger: trigger)
                    center.add(request)
                }
                self?.reportReminderStatus("scheduled", webView: webView)
            }
        }

        private func reportReminderStatus(_ status: String, webView: WKWebView?) {
            DispatchQueue.main.async {
                webView?.evaluateJavaScript("window.handleReminderStatus?.('\(status)')")
            }
        }

        func webView(
            _ webView: WKWebView,
            requestMediaCapturePermissionFor origin: WKSecurityOrigin,
            initiatedByFrame frame: WKFrameInfo,
            type: WKMediaCaptureType,
            decisionHandler: @escaping (WKPermissionDecision) -> Void
        ) {
            decisionHandler(.prompt)
        }

        private func presentShareSheet(for url: URL) {
            guard
                let scene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
                let root = scene.windows.first(where: { $0.isKeyWindow })?.rootViewController
            else { return }

            let controller = UIActivityViewController(activityItems: [url], applicationActivities: nil)
            controller.popoverPresentationController?.sourceView = root.view
            controller.popoverPresentationController?.sourceRect = CGRect(
                x: root.view.bounds.midX,
                y: root.view.bounds.maxY - 40,
                width: 1,
                height: 1
            )
            root.present(controller, animated: true)
        }
    }
}
