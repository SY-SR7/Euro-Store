export const USER_ROLES = {
  CUSTOMER: "customer",
  ADMIN: "admin",
  SUB_ADMIN: "sub_admin",
  HELPER: "helper",
  PARTNER: "partner",
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];
