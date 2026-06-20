import SwiftUI

struct StatsView: View {
    @EnvironmentObject private var store: VocabularyStore

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 18) {
                LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                    MetricTile(title: "总词数", value: "\(store.words.count)", systemImage: "books.vertical.fill")
                    MetricTile(title: "已掌握", value: "\(store.masteredCount)", systemImage: "seal.fill")
                    MetricTile(title: "薄弱词", value: "\(store.weakWords.count)", systemImage: "exclamationmark.triangle.fill")
                    MetricTile(title: "今日完成", value: "\(store.todayReviewCount)", systemImage: "checkmark.circle.fill")
                }

                VStack(alignment: .leading, spacing: 14) {
                    Text("掌握分布")
                        .font(.headline)

                    ForEach(1...6, id: \.self) { level in
                        let count = store.words.filter { $0.level == level }.count
                        LevelBar(level: level, count: count, total: max(store.words.count, 1))
                    }
                }
                .appCard()

                VStack(alignment: .leading, spacing: 12) {
                    Text("学习记录")
                        .font(.headline)

                    if store.records.isEmpty {
                        Text("完成一次复习后，这里会显示记录。")
                            .foregroundStyle(.secondary)
                    } else {
                        ForEach(store.records.prefix(12)) { record in
                            HStack {
                                VStack(alignment: .leading, spacing: 4) {
                                    Text(record.wordText)
                                        .font(.subheadline.weight(.semibold))
                                    Text(record.reviewedAt.formatted(date: .abbreviated, time: .shortened))
                                        .font(.caption)
                                        .foregroundStyle(.secondary)
                                }
                                Spacer()
                                Text(record.result.title)
                                    .font(.caption.weight(.bold))
                                    .foregroundStyle(.accentGreen)
                            }
                            Divider()
                        }
                    }
                }
                .appCard()
            }
            .padding(20)
        }
        .background(Color.appBackground.ignoresSafeArea())
        .navigationTitle("统计")
    }
}

struct LevelBar: View {
    var level: Int
    var count: Int
    var total: Int

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text("等级 \(level)")
                Spacer()
                Text("\(count)")
                    .foregroundStyle(.secondary)
            }
            .font(.caption.weight(.semibold))

            GeometryReader { proxy in
                RoundedRectangle(cornerRadius: 4)
                    .fill(Color.softLine)
                    .overlay(alignment: .leading) {
                        RoundedRectangle(cornerRadius: 4)
                            .fill(Color.accentGreen)
                            .frame(width: proxy.size.width * CGFloat(count) / CGFloat(total))
                    }
            }
            .frame(height: 8)
        }
    }
}
