import SwiftUI

struct LibraryView: View {
    @EnvironmentObject private var store: VocabularyStore
    @State private var searchText = ""
    @State private var showingAddWord = false

    private var filteredWords: [VocabularyWord] {
        guard !searchText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
            return store.words
        }

        let query = searchText.lowercased()
        return store.words.filter { word in
            word.text.lowercased().contains(query)
                || word.meaning.lowercased().contains(query)
                || word.tags.joined(separator: " ").lowercased().contains(query)
        }
    }

    var body: some View {
        List {
            Section {
                ForEach(filteredWords) { word in
                    WordRow(word: word)
                }
                .onDelete { offsets in
                    let ids = Set(offsets.map { filteredWords[$0].id })
                    store.deleteWords(ids: ids)
                }
            }
        }
        .listStyle(.insetGrouped)
        .navigationTitle("雅思词库")
        .searchable(text: $searchText, prompt: "搜索单词、释义、标签")
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button {
                    showingAddWord = true
                } label: {
                    Image(systemName: "plus")
                }
            }
        }
        .sheet(isPresented: $showingAddWord) {
            AddWordView()
        }
    }
}

struct WordRow: View {
    var word: VocabularyWord

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(alignment: .firstTextBaseline) {
                Text(word.text)
                    .font(.headline)
                Spacer()
                Text("Lv.\(word.level)")
                    .font(.caption.weight(.bold))
                    .foregroundStyle(.accentGreen)
            }

            Text(word.meaning)
                .font(.subheadline)
                .foregroundStyle(.secondary)

            if !word.tags.isEmpty {
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack {
                        ForEach(word.tags, id: \.self) { tag in
                            Text(tag)
                                .font(.caption.weight(.semibold))
                                .padding(.horizontal, 8)
                                .padding(.vertical, 4)
                                .background(Color.accentGreen.opacity(0.10))
                                .foregroundStyle(.accentGreen)
                                .clipShape(Capsule())
                        }
                    }
                }
            }
        }
        .padding(.vertical, 4)
    }
}

struct AddWordView: View {
    @Environment(\.dismiss) private var dismiss
    @EnvironmentObject private var store: VocabularyStore

    @State private var text = ""
    @State private var meaning = ""
    @State private var phonetic = ""
    @State private var example = ""
    @State private var tags = "雅思"

    var body: some View {
        NavigationStack {
            Form {
                Section("单词") {
                    TextField("英文单词", text: $text)
                        .textInputAutocapitalization(.never)
                    TextField("音标", text: $phonetic)
                }

                Section("记忆内容") {
                    TextField("中文释义", text: $meaning, axis: .vertical)
                    TextField("例句", text: $example, axis: .vertical)
                        .lineLimit(3...5)
                    TextField("标签，用逗号分隔", text: $tags)
                }
            }
            .navigationTitle("添加单词")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("取消") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("保存") {
                        store.addWord(
                            text: text,
                            meaning: meaning,
                            phonetic: phonetic,
                            example: example,
                            tags: tags.split(separator: ",").map(String.init)
                        )
                        dismiss()
                    }
                    .disabled(text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty || meaning.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                }
            }
        }
    }
}
