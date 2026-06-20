import SwiftUI

struct ReviewView: View {
    @EnvironmentObject private var store: VocabularyStore
    @State private var showAnswer = false

    private var currentWord: VocabularyWord? {
        store.dueWords.first
    }

    var body: some View {
        ZStack {
            Color.appBackground.ignoresSafeArea()

            if let word = currentWord {
                VStack(spacing: 20) {
                    Spacer(minLength: 16)
                    reviewCard(word)
                    actionButtons(word)
                    Spacer(minLength: 16)
                }
                .padding(20)
            } else {
                ContentUnavailableView(
                    "今天已完成",
                    systemImage: "checkmark.seal.fill",
                    description: Text("没有到期单词，可以添加新词或明天再来。")
                )
            }
        }
        .navigationTitle("复习")
        .onChange(of: currentWord?.id) { _, _ in
            showAnswer = false
            if let word = currentWord, store.settings.autoSpeak {
                store.speak(word)
            }
        }
        .task {
            if let word = currentWord, store.settings.autoSpeak {
                store.speak(word)
            }
        }
    }

    private func reviewCard(_ word: VocabularyWord) -> some View {
        VStack(spacing: 18) {
            Text("\(store.dueWords.count) 个待复习")
                .font(.caption.weight(.bold))
                .foregroundStyle(.accentGreen)

            Text(word.text)
                .font(.system(size: 46, weight: .bold, design: .rounded))
                .minimumScaleFactor(0.6)
                .multilineTextAlignment(.center)

            Text(word.phonetic)
                .font(.title3)
                .foregroundStyle(.secondary)

            HStack(spacing: 12) {
                Button {
                    store.speak(word)
                } label: {
                    Label("朗读", systemImage: "speaker.wave.2.fill")
                }
                .buttonStyle(.bordered)

                Button {
                    withAnimation(.snappy) {
                        showAnswer.toggle()
                    }
                } label: {
                    Label(showAnswer ? "收起" : "显示答案", systemImage: "eye.fill")
                }
                .buttonStyle(.borderedProminent)
                .tint(.accentGreen)
            }

            if showAnswer {
                VStack(alignment: .leading, spacing: 12) {
                    Text(word.meaning)
                        .font(.title3.weight(.semibold))
                    Divider()
                    Text(word.example)
                        .font(.body)
                        .foregroundStyle(.secondary)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .transition(.opacity.combined(with: .move(edge: .top)))
            }
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 28)
        .appCard()
    }

    private func actionButtons(_ word: VocabularyWord) -> some View {
        HStack(spacing: 10) {
            reviewButton("不认识", color: .reviewRed, result: .again, word: word)
            reviewButton("模糊", color: .warningAmber, result: .hard, word: word)
            reviewButton("认识", color: .accentGreen, result: .good, word: word)
        }
    }

    private func reviewButton(_ title: String, color: Color, result: ReviewResult, word: VocabularyWord) -> some View {
        Button {
            withAnimation(.snappy) {
                store.review(wordID: word.id, result: result)
                showAnswer = false
            }
        } label: {
            Text(title)
                .frame(maxWidth: .infinity)
        }
        .buttonStyle(.borderedProminent)
        .tint(color)
    }
}
