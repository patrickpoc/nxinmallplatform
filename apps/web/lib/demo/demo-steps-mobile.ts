import type { DemoStep } from "@/lib/demo/demo-steps";

const MOBILE_DISCOVERY: DemoStep[] = [
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
  {
    id: "category-nav",
    path: "/",
    titleKey: "steps.categoryNav.title",
    bodyKey: "steps.categoryNav.body",
    target: "category-sidebar",
    onEnter: "openCategories",
  },
  {
    id: "mobile-menu-settings",
    path: "/",
    titleKey: "steps.localeSettings.title",
    bodyKey: "steps.localeSettings.body",
    target: "mobile-nav-settings",
    onEnter: "openMobileNav",
  },
];

const MOBILE_MENU_ACCOUNT: DemoStep = {
  id: "mobile-menu-account",
  path: "/",
  titleKey: "steps.profileMenu.title",
  bodyKey: "steps.profileMenu.body",
  target: "mobile-nav-account",
  onEnter: "openMobileNav",
};

const MOBILE_CATALOG: DemoStep[] = [
  {
    id: "products",
    path: "/products",
    titleKey: "steps.products.title",
    bodyKey: "steps.products.body",
    target: "products-sort",
    onEnter: "openProductsSort",
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
    id: "cart",
    path: "/cart",
    titleKey: "steps.cart.title",
    bodyKey: "steps.cart.body",
    target: "cart-summary",
  },
];

const MOBILE_CHECKOUT: DemoStep[] = [
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
    id: "finish",
    path: "/",
    titleKey: "steps.finish.title",
    bodyKey: "steps.finish.body",
    target: "hero",
  },
];

export const DEMO_STEPS_MOBILE_GUEST: DemoStep[] = [
  ...MOBILE_DISCOVERY,
  ...MOBILE_CATALOG,
  ...MOBILE_CHECKOUT,
];

export const DEMO_STEPS_MOBILE_AUTHENTICATED: DemoStep[] = [
  ...MOBILE_DISCOVERY.slice(0, 3),
  MOBILE_MENU_ACCOUNT,
  MOBILE_DISCOVERY[3]!,
  ...MOBILE_CATALOG,
  ...MOBILE_CHECKOUT,
];

/** Home steps that share `/` without route change (mobile menu + overlays). */
export const MOBILE_HOME_OVERLAY_STEP_IDS = new Set([
  "welcome",
  "search",
  "category-nav",
  "mobile-menu-settings",
  "mobile-menu-account",
]);
