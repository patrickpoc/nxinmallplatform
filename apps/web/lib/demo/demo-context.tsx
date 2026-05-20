"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useSession } from "next-auth/react";
import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/routing";
import { signInDemoBuyer, signInDemoSeller } from "@/lib/demo/demo-auth";
import type { RegisterPrefillHandler } from "@/lib/demo/demo-register-prefill";
import {
  DEMO_STORAGE_KEY,
  findStepIndexByPathname,
  getDemoSteps,
  isSamePathSubSteps,
  resolveStepPath,
  type DemoBootstrap,
  type DemoFlow,
  type DemoPersona,
  type DemoStep,
} from "@/lib/demo/demo-steps";
import type { CartLine } from "@/lib/cart/types";
import {
  getAutoAdvanceDelay,
  type DemoPlaybackMode,
} from "@/lib/demo/demo-playback";
import type { HeaderDemoHandlers } from "@/lib/demo/demo-header-bridge";
import {
  isTopFirstDemoStep,
  loadPreferredScrollSpeed,
  savePreferredScrollSpeed,
  type DemoScrollSpeed,
} from "@/lib/demo/demo-scroll";
import { detectDemoSurface, type DemoSurface } from "@/lib/demo/demo-surface";

export type { DemoPlaybackMode, DemoPersona, DemoScrollSpeed, DemoSurface };

export type CheckoutDemoHandlers = {
  setStep: (step: 1 | 2 | 3 | 4) => void;
  prefill: () => void;
  confirmOrder: () => void;
  isDone: () => boolean;
};

type DemoPersisted = {
  active: boolean;
  stepIndex: number;
  persona: DemoPersona;
  flow: DemoFlow;
  playbackMode: DemoPlaybackMode;
  surface: DemoSurface;
};

type DemoContextValue = {
  isActive: boolean;
  persona: DemoPersona | null;
  flow: DemoFlow | null;
  stepIndex: number;
  totalSteps: number;
  currentStep: DemoStep;
  activeSteps: DemoStep[];
  bootstrap: DemoBootstrap | null;
  checkoutStep: 1 | 2 | 3 | 4;
  isLoggedIn: boolean;
  isGuestFlow: boolean;
  playbackMode: DemoPlaybackMode;
  scrollSpeed: DemoScrollSpeed;
  isAutoPlaying: boolean;
  autoPaused: boolean;
  stepReady: boolean;
  isTransitioning: boolean;
  isResolvingTarget: boolean;
  isNavigating: boolean;
  navigationEpoch: number;
  activeDemoTargetId: string | null;
  surface: DemoSurface;
  pocketExpanded: boolean;
  setPocketExpanded: (expanded: boolean) => void;
  startDemo: (mode?: DemoPlaybackMode, persona?: DemoPersona) => Promise<void>;
  exitDemo: () => void;
  goNext: () => Promise<void>;
  goPrev: () => Promise<void>;
  setPlaybackMode: (mode: DemoPlaybackMode) => void;
  setScrollSpeed: (speed: DemoScrollSpeed) => void;
  pauseAuto: () => void;
  resumeAuto: () => void;
  markStepReady: () => void;
  setActiveDemoTargetId: (id: string | null) => void;
  setResolvingTarget: (resolving: boolean) => void;
  registerCheckoutHandlers: (handlers: CheckoutDemoHandlers | null) => void;
  registerCartSeeder: (fn: ((item: Omit<CartLine, "lineId" | "quantity"> & { quantity?: number }) => void) | null) => void;
  registerPrefillHandler: (handler: RegisterPrefillHandler | null) => void;
  registerHeaderHandlers: (handlers: HeaderDemoHandlers | null) => void;
};

const DemoContext = createContext<DemoContextValue | null>(null);

function loadPersisted(): DemoPersisted | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(DEMO_STORAGE_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as DemoPersisted & {
      persona?: DemoPersona;
      flow?: DemoFlow;
      playbackMode?: DemoPlaybackMode;
      surface?: DemoSurface;
    };
    if (!p.active || typeof p.stepIndex !== "number") return null;
    const persona = p.persona === "seller" ? "seller" : "buyer";
    const flow = p.flow === "authenticated" ? "authenticated" : "guest";
    const playbackMode = p.playbackMode === "auto" ? "auto" : "manual";
    const surface = p.surface === "mobile" ? "mobile" : "desktop";
    return { active: p.active, stepIndex: p.stepIndex, persona, flow, playbackMode, surface };
  } catch {
    return null;
  }
}

function savePersisted(p: DemoPersisted | null) {
  if (typeof window === "undefined") return;
  try {
    if (!p) sessionStorage.removeItem(DEMO_STORAGE_KEY);
    else sessionStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(p));
  } catch {
    // ignore
  }
}

export function DemoTourProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const { data: session, status: sessionStatus, update: updateSession } = useSession();

  const [isActive, setIsActive] = useState(false);
  const [persona, setPersona] = useState<DemoPersona | null>(null);
  const [flow, setFlow] = useState<DemoFlow | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [bootstrap, setBootstrap] = useState<DemoBootstrap | null>(null);
  const [checkoutStep, setCheckoutStepState] = useState<1 | 2 | 3 | 4>(1);
  const [playbackMode, setPlaybackModeState] = useState<DemoPlaybackMode>("manual");
  const [scrollSpeed, setScrollSpeedState] = useState<DemoScrollSpeed>(1);
  const [autoPaused, setAutoPaused] = useState(false);
  const [stepReady, setStepReady] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isResolvingTarget, setIsResolvingTarget] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [navigationEpoch, setNavigationEpoch] = useState(0);
  const [activeDemoTargetId, setActiveDemoTargetIdState] = useState<string | null>(null);
  const [surface, setSurface] = useState<DemoSurface>("desktop");
  const [pocketExpanded, setPocketExpanded] = useState(false);

  const navigatingRef = useRef(false);
  const autoAdvancingRef = useRef(false);
  const prevStepRef = useRef<DemoStep | null>(null);
  const checkoutHandlersRef = useRef<CheckoutDemoHandlers | null>(null);
  const cartSeederRef = useRef<((item: Omit<CartLine, "lineId" | "quantity"> & { quantity?: number }) => void) | null>(null);
  const registerPrefillRef = useRef<RegisterPrefillHandler | null>(null);
  const headerHandlersRef = useRef<HeaderDemoHandlers | null>(null);

  const isLoggedIn = !!session?.user;

  const activeSteps = useMemo(
    () =>
      flow && persona
        ? getDemoSteps(persona, flow, surface)
        : getDemoSteps("buyer", "guest", surface),
    [flow, persona, surface],
  );

  const saveStep = useCallback(
    (
      index: number,
      currentPersona: DemoPersona,
      currentFlow: DemoFlow,
      mode: DemoPlaybackMode,
      currentSurface: DemoSurface,
    ) => {
      savePersisted({
        active: true,
        stepIndex: index,
        persona: currentPersona,
        flow: currentFlow,
        playbackMode: mode,
        surface: currentSurface,
      });
    },
    [],
  );

  const markStepReady = useCallback(() => {
    setStepReady(true);
    setIsTransitioning(false);
  }, []);

  const setActiveDemoTargetId = useCallback((id: string | null) => {
    setActiveDemoTargetIdState(id);
  }, []);

  const setResolvingTarget = useCallback((resolving: boolean) => {
    setIsResolvingTarget(resolving);
  }, []);

  const closeHeaderDemoUi = useCallback(() => {
    const header = headerHandlersRef.current;
    if (!header) return;
    header.closeCategories();
    header.closeLocaleMenu();
    header.closeProfileMenu();
    header.closeMobileNav();
  }, []);

  const beginStepTransition = useCallback(() => {
    setStepReady(false);
    setIsTransitioning(true);
    setActiveDemoTargetIdState(null);
    closeHeaderDemoUi();
    setNavigationEpoch((e) => e + 1);
  }, [closeHeaderDemoUi]);

  const fetchBootstrap = useCallback(async (): Promise<DemoBootstrap | null> => {
    try {
      const res = await fetch("/api/demo/bootstrap");
      if (!res.ok) return null;
      return (await res.json()) as DemoBootstrap;
    } catch {
      return null;
    }
  }, []);

  const applyCheckoutSubStep = useCallback((sub?: 1 | 2 | 3 | 4) => {
    if (!sub) return;
    setCheckoutStepState(sub);
    checkoutHandlersRef.current?.setStep(sub);
    if (typeof window !== "undefined") {
      window.scrollTo(0, 0);
    }
  }, []);

  const runOnEnter = useCallback(
    async (step: DemoStep, steps: DemoStep[]) => {
      if (step.checkoutSubStep) applyCheckoutSubStep(step.checkoutSubStep);

      if (step.onEnter === "signInDemo" && !session?.user) {
        const res = await signInDemoBuyer(`/${locale}/account/personal`);
        if (!res?.error) await updateSession();
      }

      if (step.onEnter === "signInDemoSeller") {
        const res = await signInDemoSeller(`/${locale}/seller/dashboard`);
        if (!res?.error) {
          await updateSession({ portalMode: "seller", role: "SELLER" });
        }
      }

      if (step.onEnter === "seedCart" && bootstrap && cartSeederRef.current) {
        cartSeederRef.current({
          productId: bootstrap.productId,
          variantId: bootstrap.variantId,
          name: bootstrap.name,
          priceAmount: bootstrap.priceAmount,
          priceCurrency: bootstrap.priceCurrency,
          imageUrl: bootstrap.imageUrl,
          unit: bootstrap.unit,
          quantity: 1,
        });
      }

      if (step.onEnter === "prefillRegister" && step.registerPhase && registerPrefillRef.current) {
        registerPrefillRef.current(step.registerPhase);
      }

      if (step.onEnter === "prefillCheckout") {
        checkoutHandlersRef.current?.prefill();
        applyCheckoutSubStep(1);
      }

      if (step.onEnter === "confirmCheckout") {
        const handlers = checkoutHandlersRef.current;
        if (handlers && !handlers.isDone()) {
          handlers.confirmOrder();
        }
      }

      const { setDemoProductsSortExpanded } = await import("@/lib/demo/demo-products-sort");
      setDemoProductsSortExpanded(false);
      if (step.onEnter === "openProductsSort") {
        setDemoProductsSortExpanded(true);
        await new Promise((r) => setTimeout(r, 150));
      }

      const header = headerHandlersRef.current;
      const tourSurface = detectDemoSurface();
      if (header) {
        header.closeCategories();
        header.closeLocaleMenu();
        header.closeProfileMenu();
        header.closeMobileNav();
        if (step.onEnter === "openCategories") {
          header.openCategories();
          await new Promise((r) => setTimeout(r, tourSurface === "mobile" ? 400 : 280));
        }
        if (step.onEnter === "openLocaleMenu" && tourSurface === "desktop") {
          header.openLocaleMenu();
          await new Promise((r) => setTimeout(r, 280));
        }
        if (step.onEnter === "openProfileMenu" && tourSurface === "desktop") {
          header.openProfileMenu();
          await new Promise((r) => setTimeout(r, 280));
          const { queryDemoTarget } = await import("@/lib/demo/demo-overlay");
          if (!queryDemoTarget("profile-menu-panel")) {
            queryDemoTarget("profile-menu-trigger")?.click();
            await new Promise((r) => setTimeout(r, 150));
          }
        }
        if (step.onEnter === "openMobileNav") {
          header.openMobileNav();
          await new Promise((r) => setTimeout(r, 320));
        }
      }

      if (step.id === "addresses" && typeof window !== "undefined") {
        window.scrollTo(0, 0);
      }

      void steps;
    },
    [applyCheckoutSubStep, bootstrap, locale, session?.user, updateSession],
  );

  const navigateToStep = useCallback(
    async (
      index: number,
      currentPersona: DemoPersona,
      currentFlow: DemoFlow,
      data?: DemoBootstrap | null,
      modeOverride?: DemoPlaybackMode,
    ) => {
      const steps = getDemoSteps(currentPersona, currentFlow, surface);
      const b = data ?? bootstrap;
      const step = steps[index];
      if (!step) return;
      const mode = modeOverride ?? playbackMode;

      if (navigatingRef.current) return;
      navigatingRef.current = true;
      setIsNavigating(true);
      try {
        beginStepTransition();
        setStepIndex(index);
        saveStep(index, currentPersona, currentFlow, mode, surface);

        const path = resolveStepPath(step, b);
        if (
          currentPersona === "seller" &&
          (path.startsWith("/account") || path.startsWith("/seller")) &&
          !session?.user
        ) {
          const res = await signInDemoSeller(`/${locale}/seller/dashboard`);
          if (!res?.error) await updateSession({ portalMode: "seller", role: "SELLER" });
        } else if (path.startsWith("/account") && !session?.user) {
          const res = await signInDemoBuyer(`/${locale}/account/personal`);
          if (!res?.error) await updateSession();
        }
        router.push(path);
        if (isTopFirstDemoStep(step.id)) {
          window.scrollTo(0, 0);
        }

        await new Promise((r) => setTimeout(r, 150));
        setIsTransitioning(false);
        await runOnEnter(step, steps);
        if (surface === "mobile") {
          setIsResolvingTarget(false);
          markStepReady();
        }
      } finally {
        navigatingRef.current = false;
        setIsNavigating(false);
      }
    },
    [beginStepTransition, bootstrap, locale, markStepReady, playbackMode, router, runOnEnter, saveStep, session?.user, surface, updateSession],
  );

  const resolveFlow = useCallback((): DemoFlow => {
    if (sessionStatus === "loading") return "guest";
    return session?.user ? "authenticated" : "guest";
  }, [session?.user, sessionStatus]);

  const startDemo = useCallback(
    async (mode: DemoPlaybackMode = "manual", chosenPersona: DemoPersona = "buyer") => {
      const chosenFlow = resolveFlow();
      const chosenSurface = detectDemoSurface();
      const b = await fetchBootstrap();
      setBootstrap(b);
      setPersona(chosenPersona);
      setFlow(chosenFlow);
      setSurface(chosenSurface);
      setPocketExpanded(false);
      setPlaybackModeState(mode);
      setScrollSpeedState(loadPreferredScrollSpeed());
      setAutoPaused(false);
      setIsActive(true);
      setCheckoutStepState(1);
      setStepIndex(0);
      prevStepRef.current = null;
      await navigateToStep(0, chosenPersona, chosenFlow, b);
    },
    [fetchBootstrap, navigateToStep, resolveFlow],
  );

  const exitDemo = useCallback(() => {
    setIsActive(false);
    setPersona(null);
    setFlow(null);
    setStepIndex(0);
    setStepReady(false);
    setIsTransitioning(false);
    setIsResolvingTarget(false);
    setIsNavigating(false);
    setActiveDemoTargetIdState(null);
    setAutoPaused(false);
    setPocketExpanded(false);
    prevStepRef.current = null;
    closeHeaderDemoUi();
    savePersisted(null);
  }, [closeHeaderDemoUi]);

  const setPlaybackMode = useCallback((mode: DemoPlaybackMode) => {
    setPlaybackModeState(mode);
    if (mode === "auto") setAutoPaused(false);
    if (isActive && flow && persona) {
      saveStep(stepIndex, persona, flow, mode, surface);
    }
  }, [flow, isActive, persona, saveStep, stepIndex, surface]);

  const pauseAuto = useCallback(() => setAutoPaused(true), []);
  const resumeAuto = useCallback(() => setAutoPaused(false), []);

  const setScrollSpeed = useCallback((speed: DemoScrollSpeed) => {
    setScrollSpeedState(speed);
    savePreferredScrollSpeed(speed);
  }, []);

  const goNext = useCallback(async () => {
    if (!flow || !persona || navigatingRef.current) return;
    if (!autoAdvancingRef.current) {
      setAutoPaused(true);
    }
    autoAdvancingRef.current = false;

    const steps = getDemoSteps(persona, flow, surface);
    const step = steps[stepIndex];
    if (!step) return;

    if (step.id === "checkout-review" && checkoutHandlersRef.current && !checkoutHandlersRef.current.isDone()) {
      checkoutHandlersRef.current.confirmOrder();
    }

    const nextIndex = stepIndex + 1;
    if (nextIndex >= steps.length) {
      exitDemo();
      return;
    }

    const next = steps[nextIndex]!;

    if (isSamePathSubSteps(step, next, bootstrap)) {
      beginStepTransition();
      prevStepRef.current = step;
      setStepIndex(nextIndex);
      saveStep(nextIndex, persona, flow, playbackMode, surface);
      if (next.checkoutSubStep) applyCheckoutSubStep(next.checkoutSubStep);
      await runOnEnter(next, steps);
      if (surface === "mobile") {
        setIsResolvingTarget(false);
        markStepReady();
      }
      return;
    }

    prevStepRef.current = step;
    await navigateToStep(nextIndex, persona, flow);
  }, [applyCheckoutSubStep, beginStepTransition, bootstrap, exitDemo, flow, markStepReady, navigateToStep, persona, playbackMode, runOnEnter, saveStep, stepIndex, surface]);

  const goPrev = useCallback(async () => {
    if (!flow || !persona || stepIndex <= 0) return;

    const steps = getDemoSteps(persona, flow, surface);
    const step = steps[stepIndex];
    const prev = steps[stepIndex - 1];
    if (!step || !prev) return;

    if (isSamePathSubSteps(step, prev, bootstrap)) {
      const prevIndex = stepIndex - 1;
      beginStepTransition();
      setAutoPaused(true);
      prevStepRef.current = step;
      setStepIndex(prevIndex);
      saveStep(prevIndex, persona, flow, playbackMode, surface);
      if (prev.checkoutSubStep) applyCheckoutSubStep(prev.checkoutSubStep);
      if (prev.onEnter === "prefillRegister" && prev.registerPhase && registerPrefillRef.current) {
        registerPrefillRef.current(prev.registerPhase);
      }
      await runOnEnter(prev, steps);
      if (surface === "mobile") {
        setIsResolvingTarget(false);
        markStepReady();
      }
      return;
    }

    if (navigatingRef.current) return;

    setAutoPaused(true);
    prevStepRef.current = step;
    await navigateToStep(stepIndex - 1, persona, flow);
  }, [applyCheckoutSubStep, beginStepTransition, bootstrap, flow, markStepReady, navigateToStep, persona, playbackMode, runOnEnter, saveStep, stepIndex, surface]);

  useEffect(() => {
    const persisted = loadPersisted();
    if (!persisted?.active) return;

    void (async () => {
      const b = await fetchBootstrap();
      setBootstrap(b);
      setPersona(persisted.persona);
      setFlow(persisted.flow);
      setSurface(persisted.surface);
      setPlaybackModeState(persisted.playbackMode);
      setIsActive(true);
      setStepIndex(persisted.stepIndex);
      const steps = getDemoSteps(persisted.persona, persisted.flow, persisted.surface);
      const step = steps[persisted.stepIndex];
      if (step?.checkoutSubStep) applyCheckoutSubStep(step.checkoutSubStep);
    })();
  }, [applyCheckoutSubStep, fetchBootstrap]);

  useEffect(() => {
    if (!isActive || navigatingRef.current || !bootstrap || !flow || !persona) return;
    const steps = getDemoSteps(persona, flow, surface);
    const idx = findStepIndexByPathname(pathname, steps, bootstrap, stepIndex);
    if (idx >= 0 && idx !== stepIndex) {
      beginStepTransition();
      setStepIndex(idx);
      saveStep(idx, persona, flow, playbackMode, surface);
      const step = steps[idx];
      if (step?.checkoutSubStep) applyCheckoutSubStep(step.checkoutSubStep);
      if (step?.registerPhase && registerPrefillRef.current) {
        registerPrefillRef.current(step.registerPhase);
      }
      if (surface === "mobile") {
        setIsResolvingTarget(false);
        markStepReady();
      }
    }
  }, [pathname, isActive, bootstrap, flow, persona, stepIndex, applyCheckoutSubStep, beginStepTransition, markStepReady, playbackMode, saveStep, surface]);

  useEffect(() => {
    if (!isActive || playbackMode !== "auto" || autoPaused || !stepReady || !flow || !persona) return;

    const steps = getDemoSteps(persona, flow, surface);
    const step = steps[stepIndex];
    const previous = prevStepRef.current;
    if (!step) return;
    if (step.id === "finish" || step.id === "seller-finish") return;

    const samePath = previous ? isSamePathSubSteps(previous, step, bootstrap) : false;
    const delay = getAutoAdvanceDelay(step, samePath, scrollSpeed, surface);

    const timer = window.setTimeout(() => {
      autoAdvancingRef.current = true;
      void goNext();
    }, delay);

    return () => window.clearTimeout(timer);
  }, [autoPaused, bootstrap, flow, goNext, isActive, persona, playbackMode, scrollSpeed, stepIndex, stepReady, surface]);

  useEffect(() => {
    if (!isActive || !flow || !persona) return;
    const steps = getDemoSteps(persona, flow, surface);
    const step = steps[stepIndex];
    if (step?.checkoutSubStep) {
      applyCheckoutSubStep(step.checkoutSubStep);
    }
  }, [isActive, flow, persona, stepIndex, applyCheckoutSubStep]);

  const registerCheckoutHandlers = useCallback(
    (handlers: CheckoutDemoHandlers | null) => {
      checkoutHandlersRef.current = handlers;
      if (handlers && isActive && flow && persona) {
        const steps = getDemoSteps(persona, flow, surface);
        const step = steps[stepIndex];
        if (step?.checkoutSubStep) handlers.setStep(step.checkoutSubStep);
        if (step?.onEnter === "prefillCheckout") handlers.prefill();
      }
    },
    [isActive, flow, stepIndex],
  );

  const registerCartSeeder = useCallback(
    (fn: ((item: Omit<CartLine, "lineId" | "quantity"> & { quantity?: number }) => void) | null) => {
      cartSeederRef.current = fn;
    },
    [],
  );

  const registerPrefillHandler = useCallback((handler: RegisterPrefillHandler | null) => {
    registerPrefillRef.current = handler;
    if (handler && isActive && flow && persona) {
      const steps = getDemoSteps(persona, flow, surface);
      const step = steps[stepIndex];
      if (step?.registerPhase) handler(step.registerPhase);
    }
  }, [isActive, flow, persona, stepIndex, surface]);

  const registerHeaderHandlers = useCallback((handlers: HeaderDemoHandlers | null) => {
    headerHandlersRef.current = handlers;
  }, []);

  const isAutoPlaying = playbackMode === "auto" && !autoPaused;

  const value = useMemo<DemoContextValue>(
    () => ({
      isActive,
      persona,
      flow,
      stepIndex,
      totalSteps: activeSteps.length,
      currentStep: activeSteps[stepIndex] ?? activeSteps[0]!,
      activeSteps,
      bootstrap,
      checkoutStep,
      isLoggedIn: sessionStatus === "authenticated" && isLoggedIn,
      isGuestFlow: flow === "guest",
      playbackMode,
      scrollSpeed,
      isAutoPlaying,
      autoPaused,
      stepReady,
      isTransitioning,
      isResolvingTarget,
      isNavigating,
      navigationEpoch,
      activeDemoTargetId,
      surface,
      pocketExpanded,
      setPocketExpanded,
      startDemo,
      exitDemo,
      goNext,
      goPrev,
      setPlaybackMode,
      setScrollSpeed,
      pauseAuto,
      resumeAuto,
      markStepReady,
      setActiveDemoTargetId,
      setResolvingTarget,
      registerCheckoutHandlers,
      registerCartSeeder,
      registerPrefillHandler,
      registerHeaderHandlers,
    }),
    [
      isActive,
      persona,
      flow,
      stepIndex,
      activeSteps,
      bootstrap,
      checkoutStep,
      sessionStatus,
      isLoggedIn,
      playbackMode,
      scrollSpeed,
      isAutoPlaying,
      autoPaused,
      stepReady,
      isTransitioning,
      isResolvingTarget,
      isNavigating,
      navigationEpoch,
      activeDemoTargetId,
      surface,
      pocketExpanded,
      startDemo,
      exitDemo,
      goNext,
      goPrev,
      setPlaybackMode,
      setScrollSpeed,
      pauseAuto,
      resumeAuto,
      markStepReady,
      setActiveDemoTargetId,
      setResolvingTarget,
      registerCheckoutHandlers,
      registerCartSeeder,
      registerPrefillHandler,
      registerHeaderHandlers,
    ],
  );

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

export function useDemoTour() {
  const ctx = useContext(DemoContext);
  if (!ctx) throw new Error("useDemoTour must be used within DemoTourProvider");
  return ctx;
}

export function useDemoTourOptional() {
  return useContext(DemoContext);
}
