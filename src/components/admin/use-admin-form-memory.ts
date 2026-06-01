"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type FormControl = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

type StoredControl = {
  name: string;
  type: string;
  value: string;
  checked?: boolean;
};

function isFormControl(element: Element): element is FormControl {
  return (
    element instanceof HTMLInputElement ||
    element instanceof HTMLTextAreaElement ||
    element instanceof HTMLSelectElement
  );
}

function shouldRemember(control: FormControl) {
  if (control.disabled || !control.name) return false;
  if (control instanceof HTMLInputElement) {
    return !["button", "file", "hidden", "image", "reset", "submit"].includes(control.type);
  }
  return true;
}

function formControls(form: HTMLFormElement) {
  return Array.from(form.querySelectorAll("[name]")).filter(isFormControl).filter(shouldRemember);
}

export function useAdminFormMemory(storageKey: string) {
  const formRef = useRef<HTMLFormElement>(null);
  const [hasMemory, setHasMemory] = useState(false);

  const clearMemory = useCallback(() => {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(storageKey);
    setHasMemory(false);
  }, [storageKey]);

  const saveMemory = useCallback(() => {
    if (typeof window === "undefined" || !formRef.current) return;
    const payload = formControls(formRef.current).map<StoredControl>((control) => ({
      name: control.name,
      type: control instanceof HTMLInputElement ? control.type : control.tagName.toLowerCase(),
      value: control.value,
      checked: control instanceof HTMLInputElement ? control.checked : undefined,
    }));

    window.localStorage.setItem(storageKey, JSON.stringify(payload));
    setHasMemory(payload.length > 0);
  }, [storageKey]);

  useEffect(() => {
    if (typeof window === "undefined" || !formRef.current) return;
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return;

    try {
      const payload = JSON.parse(raw) as StoredControl[];
      for (const item of payload) {
        const control = formRef.current.querySelector(`[name="${CSS.escape(item.name)}"]`);
        if (!control || !isFormControl(control) || !shouldRemember(control)) continue;
        if (control instanceof HTMLInputElement && ["checkbox", "radio"].includes(control.type)) {
          control.checked = Boolean(item.checked);
        } else {
          control.value = item.value;
        }
      }
      setHasMemory(payload.length > 0);
    } catch {
      window.localStorage.removeItem(storageKey);
    }
  }, [storageKey]);

  return {
    formRef,
    hasMemory,
    saveMemory,
    clearMemory,
  };
}
