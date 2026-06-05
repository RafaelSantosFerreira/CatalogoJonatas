import type { OrderStatus } from "@/db/schema";

const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending:    ["confirmed", "cancelled"],
  confirmed:  ["processing", "cancelled"],
  processing: ["completed", "cancelled"],
  completed:  [],
  cancelled:  [],
};

export function isValidTransition(from: OrderStatus, to: OrderStatus): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

export function isFinalStatus(status: OrderStatus): boolean {
  return VALID_TRANSITIONS[status]?.length === 0;
}

export function getAllowedNextStatuses(current: OrderStatus): OrderStatus[] {
  return VALID_TRANSITIONS[current] ?? [];
}
