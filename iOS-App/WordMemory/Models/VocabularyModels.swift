import Foundation

enum ReviewResult: String, Codable, CaseIterable, Identifiable {
    case again
    case hard
    case good

    var id: String { rawValue }

    var title: String {
        switch self {
        case .again: "不认识"
        case .hard: "模糊"
        case .good: "认识"
        }
    }
}

struct VocabularyWord: Identifiable, Codable, Hashable {
    var id: UUID = UUID()
    var text: String
    var meaning: String
    var phonetic: String
    var example: String
    var tags: [String]
    var level: Int
    var correctCount: Int
    var wrongCount: Int
    var createdAt: Date
    var lastReviewedAt: Date?
    var nextReviewAt: Date

    var isMastered: Bool {
        level >= 5
    }

    var isWeak: Bool {
        wrongCount > 0 || level <= 2
    }
}

struct ReviewRecord: Identifiable, Codable, Hashable {
    var id: UUID = UUID()
    var wordText: String
    var result: ReviewResult
    var reviewedAt: Date
}

struct LearningSettings: Codable, Hashable {
    var dailyGoal: Int
    var autoSpeak: Bool

    static let `default` = LearningSettings(dailyGoal: 30, autoSpeak: true)
}

struct VocabularyStoreSnapshot: Codable {
    var words: [VocabularyWord]
    var records: [ReviewRecord]
    var settings: LearningSettings
}

extension VocabularyWord {
    static let ieltsSamples: [VocabularyWord] = [
        VocabularyWord(
            text: "substantial",
            meaning: "大量的；实质性的；重要的",
            phonetic: "/səbˈstænʃl/",
            example: "The report shows a substantial increase in international applications.",
            tags: ["雅思", "阅读", "高频"],
            level: 1,
            correctCount: 0,
            wrongCount: 0,
            createdAt: .now,
            lastReviewedAt: nil,
            nextReviewAt: .now
        ),
        VocabularyWord(
            text: "coherent",
            meaning: "连贯的；条理清楚的",
            phonetic: "/koʊˈhɪrənt/",
            example: "A coherent essay presents ideas in a logical order.",
            tags: ["雅思", "写作"],
            level: 1,
            correctCount: 0,
            wrongCount: 0,
            createdAt: .now,
            lastReviewedAt: nil,
            nextReviewAt: .now
        ),
        VocabularyWord(
            text: "interpret",
            meaning: "解释；理解；口译",
            phonetic: "/ɪnˈtɜːrprət/",
            example: "Candidates need to interpret data from charts accurately.",
            tags: ["雅思", "阅读", "图表"],
            level: 2,
            correctCount: 1,
            wrongCount: 0,
            createdAt: .now,
            lastReviewedAt: nil,
            nextReviewAt: .now
        ),
        VocabularyWord(
            text: "approximately",
            meaning: "大约；近似地",
            phonetic: "/əˈprɑːksɪmətli/",
            example: "The number of visitors rose to approximately two million.",
            tags: ["雅思", "写作", "数据"],
            level: 2,
            correctCount: 1,
            wrongCount: 0,
            createdAt: .now,
            lastReviewedAt: nil,
            nextReviewAt: .now
        )
    ]
}
