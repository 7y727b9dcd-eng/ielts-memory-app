import Foundation
import UniformTypeIdentifiers
import WebKit

final class LocalSchemeHandler: NSObject, WKURLSchemeHandler {
    func webView(_ webView: WKWebView, start urlSchemeTask: WKURLSchemeTask) {
        guard let url = urlSchemeTask.request.url else {
            fail(urlSchemeTask, message: "Missing URL")
            return
        }

        let requestedPath = url.path == "/" ? "index.html" : String(url.path.dropFirst())
        guard !requestedPath.contains(".."), let root = Bundle.main.resourceURL?.appendingPathComponent("Web") else {
            fail(urlSchemeTask, message: "Invalid path")
            return
        }

        let fileURL = root.appendingPathComponent(requestedPath)
        guard let data = try? Data(contentsOf: fileURL) else {
            fail(urlSchemeTask, message: "Resource not found")
            return
        }

        let mimeType = UTType(filenameExtension: fileURL.pathExtension)?.preferredMIMEType ?? "application/octet-stream"
        let response = URLResponse(
            url: url,
            mimeType: mimeType,
            expectedContentLength: data.count,
            textEncodingName: mimeType.hasPrefix("text/") || mimeType.contains("javascript") ? "utf-8" : nil
        )
        urlSchemeTask.didReceive(response)
        urlSchemeTask.didReceive(data)
        urlSchemeTask.didFinish()
    }

    func webView(_ webView: WKWebView, stop urlSchemeTask: WKURLSchemeTask) {}

    private func fail(_ task: WKURLSchemeTask, message: String) {
        task.didFailWithError(NSError(domain: "IELTSMemory", code: 404, userInfo: [NSLocalizedDescriptionKey: message]))
    }
}
