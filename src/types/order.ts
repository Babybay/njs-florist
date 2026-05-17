export type Role =
  | "SUPER_ADMIN"
  | "ADMIN"
  | "FLORIST_STAFF"
  | "DELIVERY_STAFF"
  | "CUSTOMER"
  | "GUEST";

export type OrderStatus =
  | "DRAFT"
  | "PENDING_PAYMENT"
  | "PAID"
  | "PREPARING"
  | "READY_FOR_DELIVERY"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "COMPLETED"
  | "PAYMENT_FAILED"
  | "EXPIRED"
  | "CANCELLED"
  | "REFUNDED";
