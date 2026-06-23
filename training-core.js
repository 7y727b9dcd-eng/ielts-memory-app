(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.TrainingCore = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const clamp = (value) => Math.max(0, Math.min(1, Number(value) || 0));
  const round4 = (value) => Math.round(value * 10000) / 10000;
  const average = (items, field) => items.length ? items.reduce((sum, item) => sum + clamp(item[field]), 0) / items.length : 0;

  function f1Score(selected, expected) {
    const chosen = new Set(selected);
    const truth = new Set(expected);
    if (!chosen.size && !truth.size) return 1;
    if (!chosen.size || !truth.size) return 0;
    const hits = [...chosen].filter((value) => truth.has(value)).length;
    const precision = hits / chosen.size;
    const recall = hits / truth.size;
    return precision + recall ? round4((2 * precision * recall) / (precision + recall)) : 0;
  }

  function scoreSlotMethod(selectedTypes, actualTypes) {
    return f1Score(selectedTypes, actualTypes);
  }

  function scoreDelayedMethod(intentScore, selectedConstraints, expectedConstraints) {
    return round4(clamp(intentScore) * 0.6 + f1Score(selectedConstraints, expectedConstraints) * 0.4);
  }

  function scoreMetaMethod({ predictedTypes, actualTypes, confidence, detailScore, reviewed }) {
    const predictions = new Set(predictedTypes);
    const actual = new Set(actualTypes);
    const predictionRelevance = predictions.size
      ? [...predictions].filter((type) => actual.has(type)).length / predictions.size
      : 0;
    const confidenceRate = Math.max(1, Math.min(5, Number(confidence) || 1)) / 5;
    const calibration = 1 - Math.abs(confidenceRate - clamp(detailScore));
    return round4(predictionRelevance * 0.3 + calibration * 0.4 + (reviewed ? 0.3 : 0));
  }

  function summarizeBaseline(items) {
    if (!items.length) return null;
    const stable = items.filter((item) => clamp(item.detailScore) >= 0.7 && clamp(item.intentScore) === 1);
    const source = items[0] || {};
    const actualSource = source.audioSource ?? source.source ?? source.audioDelivery ?? "system";
    const speakerId = source.speakerId || "system";
    const audioProvider = source.audioProvider || (actualSource === "system" ? "system" : "azure");
    return {
      detailScore: round4(average(items, "detailScore")),
      intentScore: round4(average(items, "intentScore")),
      onePassRate: round4(items.filter((item) => Number(item.replayCount) === 0).length / items.length),
      stableDuration: stable.length ? Math.max(...stable.map((item) => Number(item.duration) || 0)) : 10,
      speakerId,
      audioProvider,
      voiceVersion: Number(source.voiceVersion) || 1,
      completedAt: new Date().toISOString(),
    };
  }

  function evaluateProgress(baseline, items) {
    if (!baseline || items.length < 5) return { status: "collecting", count: items.length };
    const detail = average(items, "detailScore");
    const intent = average(items, "intentScore");
    const stableItems = items.filter((item) => clamp(item.detailScore) >= 0.7 && clamp(item.intentScore) === 1);
    const stableDuration = stableItems.length ? Math.max(...stableItems.map((item) => Number(item.duration) || 0)) : 0;
    const detailDelta = Math.round((detail - baseline.detailScore) * 100);
    const intentDelta = Math.round((intent - baseline.intentScore) * 100);
    const durationDelta = stableDuration - baseline.stableDuration;
    let status = "stable";
    if ((detailDelta >= 8 && intentDelta >= 0) || (durationDelta >= 5 && detailDelta >= -5)) status = "improved";
    else if (detailDelta <= -8 || intentDelta <= -8) status = "reinforce";
    return { status, count: items.length, detail, intent, stableDuration, detailDelta, intentDelta, durationDelta };
  }

  function evaluateMethodTrend(items) {
    const scored = items.filter((item) => Number.isFinite(item.methodScore));
    if (scored.length < 10) return { count: scored.length };
    const firstFive = average(scored.slice(0, 5), "methodScore");
    const latestFive = average(scored.slice(-5), "methodScore");
    return { count: scored.length, firstFive: round4(firstFive), latestFive: round4(latestFive), delta: Math.round((latestFive - firstFive) * 100) };
  }

  return { f1Score, scoreSlotMethod, scoreDelayedMethod, scoreMetaMethod, summarizeBaseline, evaluateProgress, evaluateMethodTrend };
});
