import SwiftUI

struct SettingsView: View {
    @EnvironmentObject private var store: VocabularyStore
    @State private var dailyGoalText = ""
    @State private var showingResetAlert = false

    var body: some View {
        Form {
            Section("学习计划") {
                TextField("每日目标", text: $dailyGoalText)
                    .keyboardType(.numberPad)
                    .onSubmit(saveDailyGoal)

                Toggle("复习时自动朗读", isOn: Binding(
                    get: { store.settings.autoSpeak },
                    set: { store.settings.autoSpeak = $0 }
                ))

                Button("保存每日目标") {
                    saveDailyGoal()
                }
            }

            Section("雅思词库") {
                Button {
                    store.importIELTSSamplesIfNeeded()
                } label: {
                    Label("导入雅思示例词", systemImage: "square.and.arrow.down.fill")
                }

                Text("后续可以把完整雅思词库整理成 JSON，再接入这里。")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
            }

            Section("数据") {
                Button(role: .destructive) {
                    showingResetAlert = true
                } label: {
                    Label("重置本地数据", systemImage: "trash.fill")
                }
            }
        }
        .navigationTitle("设置")
        .onAppear {
            dailyGoalText = "\(store.settings.dailyGoal)"
        }
        .alert("重置数据？", isPresented: $showingResetAlert) {
            Button("取消", role: .cancel) {}
            Button("重置", role: .destructive) {
                store.resetAllData()
                dailyGoalText = "\(store.settings.dailyGoal)"
            }
        } message: {
            Text("这会清空学习记录，并恢复到雅思示例词库。")
        }
    }

    private func saveDailyGoal() {
        guard let value = Int(dailyGoalText), value > 0 else {
            dailyGoalText = "\(store.settings.dailyGoal)"
            return
        }
        store.settings.dailyGoal = min(value, 300)
        dailyGoalText = "\(store.settings.dailyGoal)"
    }
}
