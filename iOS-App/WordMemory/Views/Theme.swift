import SwiftUI

extension Color {
    static let appBackground = Color(red: 0.965, green: 0.973, blue: 0.953)
    static let cardSurface = Color.white
    static let accentGreen = Color(red: 0.18, green: 0.49, blue: 0.29)
    static let ink = Color(red: 0.09, green: 0.13, blue: 0.10)
    static let softLine = Color(red: 0.88, green: 0.90, blue: 0.86)
    static let warningAmber = Color(red: 0.72, green: 0.44, blue: 0.12)
    static let reviewRed = Color(red: 0.72, green: 0.24, blue: 0.21)
}

struct CardModifier: ViewModifier {
    func body(content: Content) -> some View {
        content
            .padding(18)
            .background(Color.cardSurface)
            .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
            .shadow(color: .black.opacity(0.06), radius: 18, x: 0, y: 10)
    }
}

extension View {
    func appCard() -> some View {
        modifier(CardModifier())
    }
}
