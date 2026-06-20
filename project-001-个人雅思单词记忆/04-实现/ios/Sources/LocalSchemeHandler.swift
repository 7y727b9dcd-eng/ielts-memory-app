import Foundation
import UniformTypeIdentifiers
import WebKit

final class LocalSchemeHandler: NSObject, WKURLSchemeHandler {
    func webView(_ webView: WKWebView, start task: WKURLSchemeTask) {
        guard let url = task.request.url else { return fail(task, "Missing URL") }
        let path = url.path == "/" ? "index.html" : String(url.path.dropFirst())
        guard !path.contains(".."), let root = Bundle.main.resourceURL?.appendingPathComponent("Web") else { return fail(task, "Invalid path") }
        let file = root.appendingPathComponent(path)
        guard let data = try? Data(contentsOf: file) else { return fail(task, "Resource not found") }
        let mime = UTType(filenameExtension: file.pathExtension)?.preferredMIMEType ?? "application/octet-stream"
        let response = URLResponse(url: url, mimeType: mime, expectedContentLength: data.count, textEncodingName: mime.hasPrefix("text/") || mime.contains("javascript") ? "utf-8" : nil)
        task.didReceive(response)
        task.didReceive(data)
        task.didFinish()
    }

    func webView(_ webView: WKWebView, stop task: WKURLSchemeTask) {}

    private func fail(_ task: WKURLSchemeTask, _ message: String) {
        task.didFailWithError(NSError(domain: "WordTUO", code: 404, userInfo: [NSLocalizedDescriptionKey: message]))
    }
}
