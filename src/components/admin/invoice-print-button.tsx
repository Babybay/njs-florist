"use client";

import { Button } from "@/components/admin/ui";

export function InvoicePrintButton() {
  return (
    <Button type="button" variant="primary" onClick={() => window.print()}>
      Cetak invoice
    </Button>
  );
}
