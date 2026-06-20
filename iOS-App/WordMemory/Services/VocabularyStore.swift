import AVFoundation
import Foundation

@MainActor
final class VocabularyStore: ObservableObject {
    @Published private(set) var words: [VocabularyWord] = []
    @Published private(set) var records: [ReviewRecord] = []
    @Published var settings: LearningSettings = .default {
        didSet { save() }
    }

    private let fileURL: URL
    private let speechSynthesizer = AVSpeechSynthesizer()
    private let calendar = Calendar.current

    init(fileURL: URL? = nil) {
        let documents = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first
        self.fileURL = fileURL ?? documents!.appendingPathComponent("word-memory-store.json")
        load()
    }

    var dueWords: [VocabularyWord] {
        let start = calendar.startOfDay(for: .now)
        return words
            .filter { $0.nextReviewAt <= start || calendar.isDateInToday($0.nextReviewAt) }
            .sorted { lhs, rhs in
                if lhs.level != rhs.level { return lhs.level < rhs.level }
                if lhs.wrongCount != rhs.wrongCount { return lhs.wrongCount > rhs.wrongCount }
                return lhs.text < rhs.text
            }
    }

    var todayReviewCount: Int {
        records.filter { calendar.isDateInToday($0.reviewedAt) }.count
    }

    var masteredCount: Int {
        words.filter(\.isMastered).count
    }

    var weakWords: [VocabularyWord] {
        words
            .filter(\.isWeak)
            .sorted { lhs, rhs in
                if lhs.wrongCount != rhs.wrongCount { return lhs.wrongCount > rhs.wrongCount }
                return lhs.level < rhs.level
            }
    }

    var learningStreak: Int {
        var streak = 0
        var date = calendar.startOfDay(for: .now)

        while records.contains(where: { calendar.isDate($0.reviewedAt, inSameDayAs: date) }) {
            streak += 1
            guard let previous = calendar.date(byAdding: .day, value: -1, to: date) else { break }
            date = previous
        }

        return streak
    }

    func addWord(text: String, meaning: String, phonetic: String, example: String, tags: [String]) {
        let trimmedText = text.trimmingCharacters(in: .whitespacesAndNewlines)
        let trimmedMeaning = meaning.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmedText.isEmpty, !trimmedMeaning.isEmpty else { return }

        let word = VocabularyWord(
            text: trimmedText,
            meaning: trimmedMeaning,
            phonetic: phonetic.trimmingCharacters(in: .whitespacesAndNewlines),
            example: example.trimmingCharacters(in: .whitespacesAndNewlines),
            tags: tags.map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }.filter { !$0.isEmpty },
            level: 1,
            correctCount: 0,
            wrongCount: 0,
            createdAt: .now,
            lastReviewedAt: nil,
            nextReviewAt: calendar.startOfDay(for: .now)
        )

        words.insert(word, at: 0)
        save()
    }

    func review(wordID: VocabularyWord.ID, result: ReviewResult) {
        guard let index = words.firstIndex(where: { $0.id == wordID }) else { return }

        switch result {
        case .again:
            words[index].level = max(1, words[index].level - 1)
            words[index].wrongCount += 1
            words[index].nextReviewAt = calendar.startOfDay(for: .now)
        case .hard:
            words[index].wrongCount += 1
            words[index].nextReviewAt = nextDate(afterDays: 1)
        case .good:
            words[index].level = min(6, words[index].level + 1)
            words[index].correctCount += 1
            words[index].nextReviewAt = nextDate(afterDays: intervalDays(for: words[index].level))
        }

        words[index].lastReviewedAt = .now
        records.insert(ReviewRecord(wordText: words[index].text, result: result, reviewedAt: .now), at: 0)
        records = Array(records.prefix(200))
        save()
    }

    func deleteWords(ids: Set<VocabularyWord.ID>) {
        words.removeAll { ids.contains($0.id) }
        save()
    }

    func importIELTSSamplesIfNeeded() {
        let existing = Set(words.map { $0.text.lowercased() })
        let newWords = VocabularyWord.ieltsSamples.filter { !existing.contains($0.text.lowercased()) }
        words.insert(contentsOf: newWords, at: 0)
        save()
    }

    func resetAllData() {
        words = VocabularyWord.ieltsSamples
        records = []
        settings = .default
        save()
    }

    func speak(_ word: VocabularyWord) {
        guard !word.text.isEmpty else { return }
        let utterance = AVSpeechUtterance(string: word.text)
        utterance.voice = AVSpeechSynthesisVoice(language: "en-US")
        utterance.rate = AVSpeechUtteranceDefaultSpeechRate * 0.88
        speechSynthesizer.speak(utterance)
    }

    private func load() {
        guard
            let data = try? Data(contentsOf: fileURL),
            let snapshot = try? JSONDecoder.appDecoder.decode(VocabularyStoreSnapshot.self, from: data)
        else {
            words = VocabularyWord.ieltsSamples
            records = []
            settings = .default
            return
        }

        words = snapshot.words
        records = snapshot.records
        settings = snapshot.settings
    }

    private func save() {
        let snapshot = VocabularyStoreSnapshot(words: words, records: records, settings: settings)
        guard let data = try? JSONEncoder.appEncoder.encode(snapshot) else { return }
        try? data.write(to: fileURL, options: [.atomic])
    }

    private func intervalDays(for level: Int) -> Int {
        switch level {
        case ...1: 1
        case 2: 3
        case 3: 7
        case 4: 15
        default: 30
        }
    }

    private func nextDate(afterDays days: Int) -> Date {
        calendar.date(byAdding: .day, value: days, to: calendar.startOfDay(for: .now)) ?? .now
    }
}

private extension JSONDecoder {
    static var appDecoder: JSONDecoder {
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        return decoder
    }
}

private extension JSONEncoder {
    static var appEncoder: JSONEncoder {
        let encoder = JSONEncoder()
        encoder.dateEncodingStrategy = .iso8601
        encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
        return encoder
    }
}
