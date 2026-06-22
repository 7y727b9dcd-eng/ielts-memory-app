(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.VoiceCore = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const LEGACY_SPEAKERS = { natural: "lin_xiao", briefing: "chen_yu", calm: "su_ning", system: "system" };

  function migrateVoiceRecord(record) {
    const speakerId = record.speakerId || LEGACY_SPEAKERS[record.voiceProfile] || "system";
    const audioDelivery = record.audioDelivery || (record.audioSource === "cache" ? "cache" : record.audioSource === "azure" ? "network" : "system");
    const audioProvider = record.audioProvider || (audioDelivery === "system" ? "system" : "azure");
    return { ...record, speakerId, audioProvider, audioDelivery, voiceVersion: Number(record.voiceVersion) || 1 };
  }

  function isVoiceComparable(baseline, attempt) {
    return Boolean(baseline && attempt && baseline.speakerId === attempt.speakerId && baseline.audioProvider === attempt.audioProvider && Number(baseline.voiceVersion) === Number(attempt.voiceVersion));
  }

  return { LEGACY_SPEAKERS, migrateVoiceRecord, isVoiceComparable };
});
