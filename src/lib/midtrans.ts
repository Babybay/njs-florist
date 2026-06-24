import crypto from "node:crypto";

export type MidtransStatus =
  | "settlement"
  | "capture"
  | "pending"
  | "deny"
  | "expire"
  | "cancel"
  | "refund";

export type SnapItemDetail = {
  id: string;
  price: number;
  quantity: number;
  name: string;
};

export type SnapTransactionInput = {
  orderNumber: string;
  total: number;
  items: SnapItemDetail[];
  customer?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
  };
  callbacks?: {
    finish?: string;
  };
};

function isProduction() {
  return process.env.MIDTRANS_IS_PRODUCTION === "true";
}

function snapBaseUrl() {
  return isProduction()
    ? "https://app.midtrans.com/snap/v1/transactions"
    : "https://app.sandbox.midtrans.com/snap/v1/transactions";
}

export function snapScriptUrl() {
  return isProduction()
    ? "https://app.midtrans.com/snap/snap.js"
    : "https://app.sandbox.midtrans.com/snap/snap.js";
}

function basicAuthHeader() {
  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  if (!serverKey) {
    throw new Error("MIDTRANS_SERVER_KEY missing");
  }
  return `Basic ${Buffer.from(`${serverKey}:`).toString("base64")}`;
}

function apiBaseUrl() {
  return isProduction()
    ? "https://api.midtrans.com"
    : "https://api.sandbox.midtrans.com";
}

export type MidtransStatusResponse = {
  order_id: string;
  transaction_status: MidtransStatus;
  status_code: string;
  gross_amount: string;
  signature_key: string;
  payment_type?: string;
  fraud_status?: string;
  transaction_time?: string;
  settlement_time?: string;
};

export async function fetchMidtransTransactionStatus(
  orderId: string,
): Promise<MidtransStatusResponse> {
  const response = await fetch(`${apiBaseUrl()}/v2/${encodeURIComponent(orderId)}/status`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: basicAuthHeader(),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Midtrans status error (${response.status}): ${text}`);
  }

  return (await response.json()) as MidtransStatusResponse;
}

export function verifyMidtransSignature(payload: {
  order_id?: string;
  status_code?: string;
  gross_amount?: string;
  signature_key?: string;
}) {
  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  if (!serverKey) return false;

  const source = `${payload.order_id ?? ""}${payload.status_code ?? ""}${payload.gross_amount ?? ""}${serverKey}`;
  const signature = crypto.createHash("sha512").update(source).digest("hex");
  return signature === payload.signature_key;
}

export async function createMidtransSnapTransaction(input: SnapTransactionInput) {
  const itemSum = input.items.reduce((s, i) => s + i.price * i.quantity, 0);
  if (itemSum !== input.total) {
    throw new Error(
      `Midtrans item_details sum (${itemSum}) must equal transaction_details.gross_amount (${input.total}).`,
    );
  }

  const body = {
    transaction_details: {
      order_id: input.orderNumber,
      gross_amount: input.total,
    },
    item_details: input.items,
    customer_details: input.customer
      ? {
          first_name: input.customer.firstName,
          last_name: input.customer.lastName,
          email: input.customer.email,
          phone: input.customer.phone,
        }
      : undefined,
    callbacks: input.callbacks?.finish
      ? { finish: input.callbacks.finish }
      : undefined,
  };

  const response = await fetch(snapBaseUrl(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: basicAuthHeader(),
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Midtrans Snap error (${response.status}): ${text}`);
  }

  const json = (await response.json()) as {
    token: string;
    redirect_url: string;
  };

  return {
    providerOrderId: input.orderNumber,
    token: json.token,
    redirectUrl: json.redirect_url,
  };
}
