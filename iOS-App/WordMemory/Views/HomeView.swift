import SwiftUI

struct HomeView: View {
    @EnvironmentObject private var store: VocabularyStore
    @Binding var selectedTab: AppTab

    private var progress: Double {
        guard store.settings.dailyGoal > 0 else { return 0 }
        return min(Double(store.todayReviewCount) / Double(store.settings.dailyGoal), 1)
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 18) {
                header
                metrics
                dailyFocus
                weakWords
            }
            .padding(20)
        }
        .background(Color.appBackground.ignoresSafeArea())
        .navigationTitle("今天")
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("IELTS Memory")
                .font(.caption.weight(.bold))
                .foregroundStyle(.accentGreen)
            Text("先完成到期复习，再补充新词。")
                .font(.title2.weight(.semibold))
                .foregroundStyle(.ink)
        }
    }

    private var metrics: some View {
        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
            MetricTile(title: "待复习", value: "\(store.dueWords.count)", systemImage: "clock.fill")
            MetricTile(title: "今日完成", value: "\(store.todayReviewCount)", systemImage: "checkmark.circle.fill")
            MetricTile(title: "总词数", value: "\(store.words.count)", systemImage: "books.vertical.fill")
            MetricTile(title: "连续学习", value: "\(store.learningStreak)天", systemImage: "flame.fill")
        }
    }

    private var dailyFocus: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                VStack(alignment: .leading, spacing: 5) {
                    Text("每日目标")
                        .font(.headline)
                    Text("\(store.todayReviewCount) / \(store.settings.dailyGoal) 个")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }
                Spacer()
                Button {
                    selectedTab = .review
                } label: {
                    Label("开始", systemImage: "play.fill")
                }
                .buttonStyle(.borderedProminent)
                .tint(.accentGreen)
            }

            ProgressView(value: progress)
                .tint(.accentGreen)
        }
        .appCard()
    }

    private var weakWords: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("最近薄弱词")
                    .font(.headline)
                Spacer()
                Button("查看全部") {
                    selectedTab = .library
                }
                .font(.subheadline.weight(.semibold))
            }

            if store.weakWords.isEmpty {
                Text("暂时没有薄弱词。")
                    .foregroundStyle(.secondary)
            } else {
                ForEach(store.weakWords.prefix(4)) { word in
                    WordRow(word: word)
                }
            }
        }
        .appCard()
    }
}

struct MetricTile: View {
    var title: String
    var value: String
    var systemImage: String

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Image(systemName: systemImage)
                .foregroundStyle(.accentGreen)
            Text(value)
                .font(.title.bold())
                .foregroundStyle(.ink)
            Text(title)
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .appCard()
    }
}
