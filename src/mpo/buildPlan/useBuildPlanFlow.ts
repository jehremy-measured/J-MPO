import { useCallback, useMemo, useState } from "react";
import type { PlanTarget } from "../types";
import { DEFAULT_PLAN_END, DEFAULT_PLAN_START, defaultSourceStart } from "./data";
import { daysBetweenInclusive } from "./dateUtils";
import {
  applyMethodChoice,
  applyUploadedBudget,
  budgetFromUpload,
  budgetFromWindow,
  channelsPresent,
  defaultBudgetFor,
} from "./logic";
import type { BuildPlanState, BuildScreen, PlanTypeChoice } from "./types";

export function defaultBuildPlanState(): BuildPlanState {
  return {
    screen: "plan-type",
    planType: null,
    planStart: DEFAULT_PLAN_START,
    planEnd: DEFAULT_PLAN_END,
    target: null,
    targetValue: null,
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
  const [state, setState] = useState<BuildPlanState>(() => seed ?? defaultBuildPlanState());

  const goTo = useCallback((screen: BuildScreen) => {
    setState((s) => ({ ...s, screen }));
  }, []);

  const setPlanType = useCallback((planType: PlanTypeChoice) => {
    setState((s) => ({ ...s, planType }));
  }, []);

  const continueFromPlanType = useCallback(() => goTo("period"), [goTo]);

  const choosePlanType = useCallback((planType: PlanTypeChoice) => {
    setState((s) => ({ ...s, planType, screen: "period" }));
  }, []);

  const setPeriod = useCallback((planStart: Date, planEnd: Date) => {
    setState((s) => ({ ...s, planStart, planEnd }));
  }, []);

  const continueFromPeriod = useCallback(() => goTo("ct"), [goTo]);

  const setTarget = useCallback((target: PlanTarget) => {
    setState((s) => ({ ...s, target, targetValue: null }));
  }, []);

  const setTargetValue = useCallback((targetValue: number | null) => {
    setState((s) => ({ ...s, targetValue }));
  }, []);

  const continueFromTarget = useCallback(() => goTo("method"), [goTo]);

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

  const continueFromCT = useCallback(() => goTo("target"), [goTo]);

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

  const setIncludedForIds = useCallback((ids: string[], value: boolean) => {
    setState((s) => {
      const included = { ...s.included };
      ids.forEach((id) => {
        included[id] = value;
      });
      return { ...s, included };
    });
  }, []);

  const setBudget = useCallback((id: string, value: number | null) => {
    setState((s) => ({
      ...s,
      budget: { ...s.budget, [id]: value },
      overridden: { ...s.overridden, [id]: true },
    }));
  }, []);

  const resetBudget = useCallback((id: string) => {
    setState((s) => {
      const overridden = { ...s.overridden };
      delete overridden[id];
      return { ...s, overridden, budget: { ...s.budget, [id]: defaultBudgetFor(s, id) } };
    });
  }, []);

  const resetAllBudgets = useCallback(() => {
    setState((s) => {
      const budget = s.method === "upload" ? budgetFromUpload() : budgetFromWindow({ ...s, overridden: {} }).budget;
      return { ...s, overridden: {}, budget };
    });
  }, []);

  const back = useCallback(() => {
    setState((s) => {
      switch (s.screen) {
        case "period":
          return { ...s, screen: "plan-type" };
        case "ct":
          return { ...s, screen: "period" };
        case "target":
          return { ...s, screen: "ct" };
        case "method":
          return { ...s, screen: "target" };
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
      setPlanType,
      continueFromPlanType,
      choosePlanType,
      setPeriod,
      continueFromPeriod,
      setTarget,
      setTargetValue,
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
      setIncludedForIds,
      setBudget,
      resetBudget,
      resetAllBudgets,
      back,
    }),
    [
      goTo,
      setPlanType,
      continueFromPlanType,
      choosePlanType,
      setPeriod,
      continueFromPeriod,
      setTarget,
      setTargetValue,
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
      setIncludedForIds,
      setBudget,
      resetBudget,
      resetAllBudgets,
      back,
    ]
  );

  return { state, ...actions };
}

export type BuildPlanFlow = ReturnType<typeof useBuildPlanFlow>;
