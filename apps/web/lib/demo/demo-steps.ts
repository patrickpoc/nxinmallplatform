import type { DemoSurface } from "@/lib/demo/demo-surface";
import {
  DEMO_STEPS_MOBILE_AUTHENTICATED,
  DEMO_STEPS_MOBILE_GUEST,
  DEMO_STEPS_MOBILE_SELLER,
  MOBILE_HOME_OVERLAY_STEP_IDS,
} from "@/lib/demo/demo-steps-mobile";
import { DEMO_STEPS_SELLER } from "@/lib/demo/demo-steps-seller";

export type { DemoSurface } from "@/lib/demo/demo-surface";

export type DemoFlow = "guest" | "authenticated";

export type DemoPersona = "buyer" | "seller";

export type DemoOnEnter =
  | "signInDemo"
  | "signInDemoSeller"
  | "seedCart"
  | "prefillCheckout"
  | "confirmCheckout"
  | "prefillRegister"
  | "openCategories"
  | "openLocaleMenu"
  | "openProfileMenu"
  | "openMobileNav"
  | "openProductsSort";

export type RegisterPhase = "intro" | "credentials" | "role" | "review";

export type SellerProfilePhase = "overview" | "categories" | "catalog";

export type DemoStep = {
  id: string;
  /** Path template; use `/products/[id]` or `/sellers/[id]` for dynamic routes */
  path: string;
  titleKey: string;
  bodyKey: string;
  /** Short label for the current page (pocket UI); defaults from titleKey → `.pageName` */
  pageNameKey?: string;
  target?: string;
  checkoutSubStep?: 1 | 2 | 3 | 4;
  checkoutDone?: boolean;
  registerPhase?: RegisterPhase;
  sellerPhase?: SellerProfilePhase;
  onEnter?: DemoOnEnter;
};

export type DemoBootstrap = {
  productId: string;
  categoryId: string;
  variantId: string;
  name: string;
  priceAmount: number;
  priceCurrency: "USD" | "BRL";
  imageUrl?: string;
  unit?: string;
  companyId: string;
  companyName?: string;
};

const DISCOVERY_CORE: DemoStep[] = [
  {
    id: "welcome",
    path: "/",
    titleKey: "steps.welcome.title",
    bodyKey: "steps.welcome.body",
    target: "hero",
  },
  {
    id: "search",
    path: "/",
    titleKey: "steps.search.title",
    bodyKey: "steps.search.body",
    target: "search",
  },
];

const HEADER_DEMO_STEPS: DemoStep[] = [
  {
    id: "category-nav",
    path: "/",
    titleKey: "steps.categoryNav.title",
    bodyKey: "steps.categoryNav.body",
    target: "category-sidebar",
    onEnter: "openCategories",
  },
  {
    id: "locale-settings",
    path: "/",
    titleKey: "steps.localeSettings.title",
    bodyKey: "steps.localeSettings.body",
    target: "locale-settings-zone",
    onEnter: "openLocaleMenu",
  },
];

const PROFILE_MENU_STEP: DemoStep = {
  id: "profile-menu",
  path: "/",
  titleKey: "steps.profileMenu.title",
  bodyKey: "steps.profileMenu.body",
  target: "profile-menu-panel",
  onEnter: "openProfileMenu",
};

const DISCOVERY_CATALOG: DemoStep[] = [
  {
    id: "categories",
    path: "/categories",
    titleKey: "steps.categories.title",
    bodyKey: "steps.categories.body",
    target: "categories-page",
  },
  {
    id: "products",
    path: "/products",
    titleKey: "steps.products.title",
    bodyKey: "steps.products.body",
    target: "products-sort",
    onEnter: "openProductsSort",
  },
  {
    id: "sellers",
    path: "/sellers",
    titleKey: "steps.sellers.title",
    bodyKey: "steps.sellers.body",
    target: "sellers-page",
  },
  {
    id: "seller-overview",
    path: "/sellers/[id]",
    titleKey: "steps.sellerOverview.title",
    bodyKey: "steps.sellerOverview.body",
    target: "seller-profile-sidebar",
    sellerPhase: "overview",
  },
  {
    id: "seller-categories",
    path: "/sellers/[id]",
    titleKey: "steps.sellerCategories.title",
    bodyKey: "steps.sellerCategories.body",
    target: "seller-profile-categories",
    sellerPhase: "categories",
  },
  {
    id: "seller-catalog",
    path: "/sellers/[id]",
    titleKey: "steps.sellerCatalog.title",
    bodyKey: "steps.sellerCatalog.body",
    target: "seller-profile-catalog",
    sellerPhase: "catalog",
  },
  {
    id: "pdp",
    path: "/products/[id]",
    titleKey: "steps.pdp.title",
    bodyKey: "steps.pdp.body",
    target: "pdp-showcase",
  },
  {
    id: "add-cart",
    path: "/products/[id]",
    titleKey: "steps.addCart.title",
    bodyKey: "steps.addCart.body",
    target: "add-to-cart",
    onEnter: "seedCart",
  },
  {
    id: "wishlist",
    path: "/wishlist",
    titleKey: "steps.wishlist.title",
    bodyKey: "steps.wishlist.body",
    target: "wishlist-list",
  },
  {
    id: "cart",
    path: "/cart",
    titleKey: "steps.cart.title",
    bodyKey: "steps.cart.body",
    target: "cart-summary",
  },
];

function buildDiscoverySteps(flow: DemoFlow): DemoStep[] {
  const steps: DemoStep[] = [...DISCOVERY_CORE, ...HEADER_DEMO_STEPS];
  if (flow === "authenticated") {
    steps.push(PROFILE_MENU_STEP);
  }
  steps.push(...DISCOVERY_CATALOG);
  return steps;
}

const REGISTER_GUEST_STEPS: DemoStep[] = [
  {
    id: "register-intro",
    path: "/auth/register",
    titleKey: "steps.registerIntro.title",
    bodyKey: "steps.registerIntro.body",
    target: "register-form",
    registerPhase: "intro",
    onEnter: "prefillRegister",
  },
  {
    id: "register-credentials",
    path: "/auth/register",
    titleKey: "steps.registerCredentials.title",
    bodyKey: "steps.registerCredentials.body",
    target: "register-email",
    registerPhase: "credentials",
    onEnter: "prefillRegister",
  },
  {
    id: "register-role",
    path: "/auth/register",
    titleKey: "steps.registerRole.title",
    bodyKey: "steps.registerRole.body",
    target: "register-role",
    registerPhase: "role",
    onEnter: "prefillRegister",
  },
  {
    id: "register-review",
    path: "/auth/register",
    titleKey: "steps.registerReview.title",
    bodyKey: "steps.registerReview.body",
    target: "register-submit",
    registerPhase: "review",
    onEnter: "prefillRegister",
  },
  {
    id: "register-login",
    path: "/auth/register",
    titleKey: "steps.registerLogin.title",
    bodyKey: "steps.registerLogin.body",
    target: "register-form",
    onEnter: "signInDemo",
  },
];

const ACCOUNT_CHECKOUT_STEPS: DemoStep[] = [
  {
    id: "personal",
    path: "/account/personal",
    titleKey: "steps.personal.title",
    bodyKey: "steps.personal.body",
    target: "personal-form",
  },
  {
    id: "addresses",
    path: "/account/addresses",
    titleKey: "steps.addresses.title",
    bodyKey: "steps.addresses.body",
    target: "address-list",
  },
  {
    id: "checkout-address",
    path: "/checkout",
    titleKey: "steps.checkoutAddress.title",
    bodyKey: "steps.checkoutAddress.body",
    target: "checkout-address-form",
    checkoutSubStep: 1,
    onEnter: "prefillCheckout",
  },
  {
    id: "checkout-freight",
    path: "/checkout",
    titleKey: "steps.checkoutFreight.title",
    bodyKey: "steps.checkoutFreight.body",
    target: "checkout-freight-options",
    checkoutSubStep: 2,
  },
  {
    id: "checkout-payment",
    path: "/checkout",
    titleKey: "steps.checkoutPayment.title",
    bodyKey: "steps.checkoutPayment.body",
    target: "checkout-payment",
    checkoutSubStep: 3,
  },
  {
    id: "checkout-review",
    path: "/checkout",
    titleKey: "steps.checkoutReview.title",
    bodyKey: "steps.checkoutReview.body",
    target: "checkout-review-body",
    checkoutSubStep: 4,
  },
  {
    id: "checkout-done",
    path: "/checkout",
    titleKey: "steps.checkoutDone.title",
    bodyKey: "steps.checkoutDone.body",
    target: "checkout-done",
    checkoutDone: true,
    onEnter: "confirmCheckout",
  },
  {
    id: "purchases",
    path: "/account/purchases",
    titleKey: "steps.purchases.title",
    bodyKey: "steps.purchases.body",
    target: "purchases-list",
  },
  {
    id: "dashboard",
    path: "/account/dashboard",
    titleKey: "steps.dashboard.title",
    bodyKey: "steps.dashboard.body",
    target: "dashboard-page",
  },
  {
    id: "finish",
    path: "/",
    titleKey: "steps.finish.title",
    bodyKey: "steps.finish.body",
    target: "hero",
  },
];

const ACCOUNT_WELCOME_STEP: DemoStep = {
  id: "account-welcome",
  path: "/account/dashboard",
  titleKey: "steps.accountWelcome.title",
  bodyKey: "steps.accountWelcome.body",
  target: "dashboard-page",
};

export const DEMO_STEPS_GUEST: DemoStep[] = [
  ...buildDiscoverySteps("guest"),
  ...REGISTER_GUEST_STEPS,
  ...ACCOUNT_CHECKOUT_STEPS,
];

export const DEMO_STEPS_LOGGED_IN: DemoStep[] = [
  ...buildDiscoverySteps("authenticated"),
  ACCOUNT_WELCOME_STEP,
  ...ACCOUNT_CHECKOUT_STEPS,
];

/** @deprecated Use getDemoSteps(flow) */
export const DEMO_STEPS = DEMO_STEPS_GUEST;

export const DEMO_STORAGE_KEY = "nxinmall:demo";

export function getDemoSteps(
  persona: DemoPersona,
  flow: DemoFlow,
  surface: DemoSurface = "desktop",
): DemoStep[] {
  if (persona === "seller") {
    return surface === "mobile" ? DEMO_STEPS_MOBILE_SELLER : DEMO_STEPS_SELLER;
  }
  if (surface === "mobile") {
    return flow === "authenticated" ? DEMO_STEPS_MOBILE_AUTHENTICATED : DEMO_STEPS_MOBILE_GUEST;
  }
  return flow === "authenticated" ? DEMO_STEPS_LOGGED_IN : DEMO_STEPS_GUEST;
}

const HOME_OVERLAY_STEP_IDS = new Set([
  "welcome",
  "search",
  "category-nav",
  "locale-settings",
  "profile-menu",
  ...MOBILE_HOME_OVERLAY_STEP_IDS,
]);

export function resolveStepPath(step: DemoStep, bootstrap: DemoBootstrap | null): string {
  if (step.path === "/products/[id]") {
    return bootstrap?.productId ? `/products/${bootstrap.productId}` : "/products";
  }
  if (step.path === "/sellers/[id]") {
    return bootstrap?.companyId ? `/sellers/${bootstrap.companyId}` : "/sellers";
  }
  return step.path;
}

export function pathnameMatchesStep(pathname: string, step: DemoStep, bootstrap: DemoBootstrap | null): boolean {
  const resolved = resolveStepPath(step, bootstrap);
  const localePattern = /^\/(en|pt|zh)(\/|$)/;
  const normalized = pathname.replace(localePattern, "/");
  if (resolved.startsWith("/products/") && step.path === "/products/[id]") {
    const id = bootstrap?.productId;
    return id ? normalized === `/products/${id}` || normalized.startsWith(`/products/${id}/`) : false;
  }
  if (resolved.startsWith("/sellers/") && step.path === "/sellers/[id]") {
    const id = bootstrap?.companyId;
    return id ? normalized === `/sellers/${id}` || normalized.startsWith(`/sellers/${id}/`) : false;
  }
  return normalized === resolved || normalized.startsWith(`${resolved}/`);
}

export function findStepIndexByPathname(
  pathname: string,
  steps: DemoStep[],
  bootstrap: DemoBootstrap | null,
  hintIndex = 0,
): number {
  const matches: number[] = [];
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i]!;
    if (pathnameMatchesStep(pathname, step, bootstrap)) matches.push(i);
  }
  if (matches.length === 0) return -1;
  if (matches.length === 1) return matches[0]!;
  return matches.reduce((best, i) =>
    Math.abs(i - hintIndex) < Math.abs(best - hintIndex) ? i : best,
  );
}

function isSamePathSubSteps(step: DemoStep, next: DemoStep, bootstrap: DemoBootstrap | null): boolean {
  if (resolveStepPath(step, bootstrap) !== resolveStepPath(next, bootstrap)) return false;
  if (step.path === "/checkout" && next.path === "/checkout" && step.checkoutSubStep && next.checkoutSubStep) {
    return true;
  }
  if (
    step.path === "/auth/register" &&
    next.path === "/auth/register" &&
    step.registerPhase &&
    next.registerPhase
  ) {
    return true;
  }
  if (
    step.path === "/sellers/[id]" &&
    next.path === "/sellers/[id]" &&
    step.sellerPhase &&
    next.sellerPhase
  ) {
    return true;
  }
  if (
    resolveStepPath(step, bootstrap) === "/" &&
    resolveStepPath(next, bootstrap) === "/" &&
    HOME_OVERLAY_STEP_IDS.has(step.id) &&
    HOME_OVERLAY_STEP_IDS.has(next.id)
  ) {
    return true;
  }
  return false;
}

export { isSamePathSubSteps };
