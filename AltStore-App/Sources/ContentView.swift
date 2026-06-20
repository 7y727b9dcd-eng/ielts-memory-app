import SwiftUI
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
        configuration.setURLSchemeHandler(LocalSchemeHandler(), forURLScheme: "ielts")
        configuration.userContentController.add(context.coordinator, name: "shareBackup")

        let webView = WKWebView(frame: .zero, configuration: configuration)
        webView.isOpaque = false
        webView.backgroundColor = UIColor(red: 0.965, green: 0.973, blue: 0.949, alpha: 1)
        webView.scrollView.contentInsetAdjustmentBehavior = .never
        webView.allowsBackForwardNavigationGestures = false
        webView.navigationDelegate = context.coordinator

        if let url = URL(string: "ielts://app/index.html") {
            webView.load(URLRequest(url: url))
        }
        return webView
    }

    func updateUIView(_ webView: WKWebView, context: Context) {}

    static func dismantleUIView(_ webView: WKWebView, coordinator: Coordinator) {
        webView.configuration.userContentController.removeScriptMessageHandler(forName: "shareBackup")
    }

    final class Coordinator: NSObject, WKScriptMessageHandler, WKNavigationDelegate {
        func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
            guard message.name == "shareBackup", let json = message.body as? String else { return }
            let url = FileManager.default.temporaryDirectory.appendingPathComponent("ielts-memory-backup.json")

            do {
                try json.write(to: url, atomically: true, encoding: .utf8)
                presentShareSheet(for: url)
            } catch {
                return
            }
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
