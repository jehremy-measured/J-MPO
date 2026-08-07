import { useCallback, useMemo, useState } from "react";
import type { PlanTarget } from "../types";
import { DEFAULT_PLAN_END, DEFAULT_PLAN_START, defaultSourceStart } from "./data";
import { daysBetweenInclusive } from "./dateUtils";
import { applyMethodChoice, applyUploadedBudget, budgetFromWindow, channelsPresent } from "./logic";
import type { BuildPlanState, BuildScreen } from "./types";

function initialState(): BuildPlanState {
  return {
    screen: "period",
    planStart: DEFAULT_PLAN_START,
    planEnd: DEFAULT_PLAN_END,
    target: null,
    singleCT: null,
    attrs: [],
    method: null,
    source: "",
    sourceStart: defaultSourceStart(daysBetweenInclusive(DEFAULT_PLAN_START, DEFAULT_PLAN_END)),
    budget: {},
    overridden: {},
    included: {},
    query: "",
    channels: channelsPresent(),
  };
}

export function useBuildPlanFlow(seed?: BuildPlanState) {
  const [state, setState] = useState<BuildPlanState>(() => seed ?? initialState());

  const goTo = useCallback((screen: BuildScreen) => {
    setState((s) => ({ ...s, screen }));
  }, []);

  const setPeriod = useCallback((planStart: Date, planEnd: Date) => {
    setState((s) => ({ ...s, planStart, planEnd }));
  }, []);

  const continueFromPeriod = useCallback(() => goTo("target"), [goTo]);

  const setTarget = useCallback((target: PlanTarget) => {
    setState((s) => ({ ...s, target }));
  }, []);

  const continueFromTarget = useCallback(() => goTo("ct"), [goTo]);

  const toggleSingleCT = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      singleCT: s.singleCT === id ? null : id,
      attrs: [],
    }));
  }, []);

  const toggleAttr = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      singleCT: null,
      attrs: s.attrs.includes(id) ? s.attrs.filter((x) => x !== id) : [...s.attrs, id],
    }));
  }, []);

  const continueFromCT = useCallback(() => goTo("method"), [goTo]);

  const chooseMethod = useCallback((method: "upload" | "fetch") => {
    setState((s) => applyMethodChoice(s, method));
  }, []);

  const markUploadFilled = useCallback(() => {
    setState((s) => ({ ...s, source: "upload-ready" }));
  }, []);

  const continueFromUpload = useCallback(() => {
    setState((s) => applyUploadedBudget(s));
  }, []);

  const setSourceStart = useCallback((sourceStart: Date) => {
    setState((s) => {
      const next = { ...s, sourceStart, overridden: {} };
      const { budget } = budgetFromWindow(next);
      return { ...next, budget };
    });
  }, []);

  const reupload = useCallback(() => {
    setState((s) => ({ ...s, screen: "upload", source: "" }));
  }, []);

  const setQuery = useCallback((query: string) => {
    setState((s) => ({ ...s, query }));
  }, []);

  const toggleChannel = useCallback((channel: string) => {
    setState((s) => ({
      ...s,
      channels: s.channels.includes(channel)
        ? s.channels.filter((c) => c !== channel)
        : [...s.channels, channel],
    }));
  }, []);

  const toggleInclude = useCallback((id: string) => {
    setState((s) => ({ ...s, included: { ...s.included, [id]: !s.included[id] } }));
  }, []);

  const setBudget = useCallback((id: string, value: number | null) => {
    setState((s) => ({
      ...s,
      budget: { ...s.budget, [id]: value },
      overridden: { ...s.overridden, [id]: true },
    }));
  }, []);

  const back = useCallback(() => {
    setState((s) => {
      switch (s.screen) {
        case "target":
          return { ...s, screen: "period" };
        case "ct":
          return { ...s, screen: "target" };
        case "method":
          return { ...s, screen: "ct" };
        case "upload":
          return { ...s, screen: "method" };
        case "review":
          return { ...s, screen: s.method === "upload" ? "upload" : "method" };
        default:
          return s;
      }
    });
  }, []);

  const actions = useMemo(
    () => ({
      goTo,
      setPeriod,
      continueFromPeriod,
      setTarget,
      continueFromTarget,
      toggleSingleCT,
      toggleAttr,
      continueFromCT,
      chooseMethod,
      markUploadFilled,
      continueFromUpload,
      setSourceStart,
      reupload,
      setQuery,
      toggleChannel,
      toggleInclude,
      setBudget,
      back,
    }),
    [
      goTo,
      setPeriod,
      continueFromPeriod,
      setTarget,
      continueFromTarget,
      toggleSingleCT,
      toggleAttr,
      continueFromCT,
      chooseMethod,
      markUploadFilled,
      continueFromUpload,
      setSourceStart,
      reupload,
      setQuery,
      toggleChannel,
      toggleInclude,
      setBudget,
      back,
    ]
  );

  return { state, ...actions };
}

export type BuildPlanFlow = ReturnType<typeof useBuildPlanFlow>;
