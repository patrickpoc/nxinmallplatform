import type { DemoStep } from "@/lib/demo/demo-steps";

const MOBILE_DISCOVERY: DemoStep[] = [
  {
    id: "welcome",
    path: "/",
    pageNameKey: "steps.welcome.pageName",
    titleKey: "steps.welcome.title",
    bodyKey: "steps.welcome.body",
    target: "hero",
  },
  {
    id: "search",
    path: "/",
    pageNameKey: "steps.search.pageName",
    titleKey: "steps.search.title",
    bodyKey: "steps.search.body",
    target: "search",
  },
  {
    id: "category-nav",
    path: "/",
    pageNameKey: "steps.categoryNav.pageName",
    titleKey: "steps.categoryNav.title",
    bodyKey: "steps.categoryNav.body",
    target: "category-sidebar",
    onEnter: "openCategories",
  },
  {
    id: "mobile-menu-settings",
    path: "/",
    pageNameKey: "steps.localeSettings.pageName",
    titleKey: "steps.localeSettings.title",
    bodyKey: "steps.localeSettings.body",
    target: "mobile-nav-settings",
    onEnter: "openMobileNav",
  },
];

const MOBILE_MENU_ACCOUNT: DemoStep = {
  id: "mobile-menu-account",
  path: "/",
  pageNameKey: "steps.profileMenu.pageName",
  titleKey: "steps.profileMenu.title",
  bodyKey: "steps.profileMenu.body",
  target: "mobile-nav-account",
  onEnter: "openMobileNav",
};

const MOBILE_CATALOG: DemoStep[] = [
  {
    id: "products",
    path: "/products",
    pageNameKey: "steps.products.pageName",
    titleKey: "steps.products.title",
    bodyKey: "steps.products.body",
    target: "products-sort",
    onEnter: "openProductsSort",
  },
  {
    id: "pdp",
    path: "/products/[id]",
    pageNameKey: "steps.pdp.pageName",
    titleKey: "steps.pdp.title",
    bodyKey: "steps.pdp.body",
    target: "pdp-showcase",
  },
  {
    id: "add-cart",
    path: "/products/[id]",
    pageNameKey: "steps.addCart.pageName",
    titleKey: "steps.addCart.title",
    bodyKey: "steps.addCart.body",
    target: "add-to-cart",
    onEnter: "seedCart",
  },
  {
    id: "cart",
    path: "/cart",
    pageNameKey: "steps.cart.pageName",
    titleKey: "steps.cart.title",
    bodyKey: "steps.cart.body",
    target: "cart-summary",
  },
];

const MOBILE_CHECKOUT: DemoStep[] = [
  {
    id: "checkout-address",
    path: "/checkout",
    pageNameKey: "steps.checkoutAddress.pageName",
    titleKey: "steps.checkoutAddress.title",
    bodyKey: "steps.checkoutAddress.body",
    target: "checkout-address-form",
    checkoutSubStep: 1,
    onEnter: "prefillCheckout",
  },
  {
    id: "checkout-freight",
    path: "/checkout",
    pageNameKey: "steps.checkoutFreight.pageName",
    titleKey: "steps.checkoutFreight.title",
    bodyKey: "steps.checkoutFreight.body",
    target: "checkout-freight-options",
    checkoutSubStep: 2,
  },
  {
    id: "checkout-payment",
    path: "/checkout",
    pageNameKey: "steps.checkoutPayment.pageName",
    titleKey: "steps.checkoutPayment.title",
    bodyKey: "steps.checkoutPayment.body",
    target: "checkout-payment",
    checkoutSubStep: 3,
  },
  {
    id: "checkout-review",
    path: "/checkout",
    pageNameKey: "steps.checkoutReview.pageName",
    titleKey: "steps.checkoutReview.title",
    bodyKey: "steps.checkoutReview.body",
    target: "checkout-review-body",
    checkoutSubStep: 4,
  },
  {
    id: "checkout-done",
    path: "/checkout",
    pageNameKey: "steps.checkoutDone.pageName",
    titleKey: "steps.checkoutDone.title",
    bodyKey: "steps.checkoutDone.body",
    target: "checkout-done",
    checkoutDone: true,
    onEnter: "confirmCheckout",
  },
  {
    id: "finish",
    path: "/",
    pageNameKey: "steps.finish.pageName",
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

/** Condensed seller tour for mobile (same routes as desktop seller flow). */
export const DEMO_STEPS_MOBILE_SELLER: DemoStep[] = [
  {
    id: "seller-welcome",
    path: "/",
    pageNameKey: "steps.sellerWelcome.pageName",
    titleKey: "steps.sellerWelcome.title",
    bodyKey: "steps.sellerWelcome.body",
    target: "hero",
  },
  {
    id: "seller-sign-in",
    path: "/",
    pageNameKey: "steps.sellerSignIn.pageName",
    titleKey: "steps.sellerSignIn.title",
    bodyKey: "steps.sellerSignIn.body",
    target: "demo-start-button",
    onEnter: "signInDemoSeller",
  },
  {
    id: "seller-account-dashboard",
    path: "/account/dashboard",
    pageNameKey: "steps.sellerAccountDashboard.pageName",
    titleKey: "steps.sellerAccountDashboard.title",
    bodyKey: "steps.sellerAccountDashboard.body",
    target: "seller-account-dashboard",
  },
  {
    id: "seller-company",
    path: "/account/company",
    pageNameKey: "steps.sellerCompany.pageName",
    titleKey: "steps.sellerCompany.title",
    bodyKey: "steps.sellerCompany.body",
    target: "seller-company-status",
  },
  {
    id: "seller-portal-dashboard",
    path: "/seller/dashboard",
    pageNameKey: "steps.sellerPortalDashboard.pageName",
    titleKey: "steps.sellerPortalDashboard.title",
    bodyKey: "steps.sellerPortalDashboard.body",
    target: "seller-dashboard-overview",
  },
  {
    id: "seller-store",
    path: "/seller/store",
    pageNameKey: "steps.sellerStore.pageName",
    titleKey: "steps.sellerStore.title",
    bodyKey: "steps.sellerStore.body",
    target: "seller-store-form",
  },
  {
    id: "seller-products",
    path: "/seller/products",
    pageNameKey: "steps.sellerProducts.pageName",
    titleKey: "steps.sellerProducts.title",
    bodyKey: "steps.sellerProducts.body",
    target: "seller-products-list",
  },
  {
    id: "seller-finish",
    path: "/",
    pageNameKey: "steps.sellerFinish.pageName",
    titleKey: "steps.sellerFinish.title",
    bodyKey: "steps.sellerFinish.body",
    target: "hero",
  },
];

/** Home steps that share `/` without route change (mobile menu + overlays). */
export const MOBILE_HOME_OVERLAY_STEP_IDS = new Set([
  "welcome",
  "search",
  "category-nav",
  "mobile-menu-settings",
  "mobile-menu-account",
]);

export function getDemoPageNameKey(step: { pageNameKey?: string; titleKey: string }): string {
  return step.pageNameKey ?? step.titleKey.replace(/\.title$/, ".pageName");
}
