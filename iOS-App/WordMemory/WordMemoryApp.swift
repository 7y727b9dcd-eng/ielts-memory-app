import SwiftUI

@main
struct WordMemoryApp: App {
    @StateObject private var store = VocabularyStore()

    var body: some Scene {
        WindowGroup {
            AppRootView()
                .environmentObject(store)
        }
    }
}
