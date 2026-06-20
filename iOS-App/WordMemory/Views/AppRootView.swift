import SwiftUI

enum AppTab: Hashable {
    case home
    case review
    case library
    case stats
    case settings
}

struct AppRootView: View {
    @State private var selectedTab: AppTab = .home

    var body: some View {
        TabView(selection: $selectedTab) {
            NavigationStack {
                HomeView(selectedTab: $selectedTab)
            }
            .tabItem { Label("首页", systemImage: "house.fill") }
            .tag(AppTab.home)

            NavigationStack {
                ReviewView()
            }
            .tabItem { Label("复习", systemImage: "rectangle.stack.fill") }
            .tag(AppTab.review)

            NavigationStack {
                LibraryView()
            }
            .tabItem { Label("词库", systemImage: "books.vertical.fill") }
            .tag(AppTab.library)

            NavigationStack {
                StatsView()
            }
            .tabItem { Label("统计", systemImage: "chart.bar.fill") }
            .tag(AppTab.stats)

            NavigationStack {
                SettingsView()
            }
            .tabItem { Label("设置", systemImage: "gearshape.fill") }
            .tag(AppTab.settings)
        }
        .tint(.accentGreen)
    }
}

#Preview {
    AppRootView()
        .environmentObject(VocabularyStore())
}
