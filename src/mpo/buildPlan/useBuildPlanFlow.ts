import { useCallback, useMemo, useState } from "react";
import { DEFAULT_PLAN_END, DEFAULT_PLAN_START, defaultSourceStart } from "./data";
import { daysBetweenInclusive } from "./dateUtils";
import { budgetFromUpload, budgetFromWindow, defaultIncludes, planDaysFor } from "./logic";
import type { BuildPlanState, BuildScreen } from "./types";

function initialState(): BuildPlanState {
  return {
    screen: "period",
    planStart: DEFAULT_PLAN_START,
    planEnd: DEFAULT_PLAN_END,
    singleCT: null,
    attrs: [],
    method: null,
    source: "",
    sourceStart: defaultSourceStart(daysBetweenInclusive(DEFAULT_PLAN_START, DEFAULT_PLAN_END)),
    budget: {},
    overridden: {},
    included: {},
    query: "",
    channel: "All",
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

  const continueFromPeriod = useCallback(() => goTo("ct"), [goTo]);

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
    setState((s) => {
      const reset: BuildPlanState = {
        ...s,
        method,
        overridden: {},
        budget: {},
        sourceStart: defaultSourceStart(planDaysFor(s)),
        source: "",
        included: {},
        query: "",
        channel: "All",
      };
      if (method === "upload") {
        return { ...reset, screen: "upload" };
      }
      const { budget } = budgetFromWindow(reset);
      return { ...reset, budget, included: defaultIncludes("fetch", budget), screen: "review" };
    });
  }, []);

  const markUploadFilled = useCallback(() => {
    setState((s) => ({ ...s, source: "upload-ready" }));
  }, []);

  const continueFromUpload = useCallback(() => {
    setState((s) => {
      const budget = budgetFromUpload();
      return {
        ...s,
        budget,
        source: "budget_plan.xlsx",
        included: defaultIncludes("upload", budget),
        query: "",
        channel: "All",
        screen: "review",
      };
    });
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

  const setChannel = useCallback((channel: string) => {
    setState((s) => ({ ...s, channel }));
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
        case "ct":
          return { ...s, screen: "period" };
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

  const completePlan = useCallback(() => goTo("done"), [goTo]);

  const restart = useCallback(() => {
    setState(initialState());
  }, []);

  const actions = useMemo(
    () => ({
      goTo,
      setPeriod,
      continueFromPeriod,
      toggleSingleCT,
      toggleAttr,
      continueFromCT,
      chooseMethod,
      markUploadFilled,
      continueFromUpload,
      setSourceStart,
      reupload,
      setQuery,
      setChannel,
      toggleInclude,
      setBudget,
      back,
      completePlan,
      restart,
    }),
    [
      goTo,
      setPeriod,
      continueFromPeriod,
      toggleSingleCT,
      toggleAttr,
      continueFromCT,
      chooseMethod,
      markUploadFilled,
      continueFromUpload,
      setSourceStart,
      reupload,
      setQuery,
      setChannel,
      toggleInclude,
      setBudget,
      back,
      completePlan,
      restart,
    ]
  );

  return { state, ...actions };
}

export type BuildPlanFlow = ReturnType<typeof useBuildPlanFlow>;
