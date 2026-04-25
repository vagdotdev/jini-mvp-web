// PILOT-ONLY: remove with the manual-wallet pilot.
// Single source of truth for the "Login as Ganesh" test affordance.
// One grep for `Ganesh` finds every reference when it is time to tear down.

export const GANESH_EMAIL = "ganesh@jini.test";
export const GANESH_PASSWORD = "ganesh-pilot-test";
export const GANESH_DISPLAY_NAME = "Ganesh";
export const GANESH_PHONE = "+919148917755";
export const GANESH_DEFAULT_ADDRESS = {
  line1: "Stall 21, Sarojini Nagar Market",
  city: "New Delhi",
  state: "Delhi",
  pincode: "110023",
  country: "IN",
} as const;
