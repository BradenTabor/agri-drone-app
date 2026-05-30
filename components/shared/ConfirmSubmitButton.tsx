"use client";

import { useRef, useState } from "react";

import {
  AlertDialog,
  AlertDialogBackdrop,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogPortal,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import type { ComponentProps } from "react";

type ConfirmSubmitButtonProps = ComponentProps<typeof Button> & {
  confirmMessage: string;
  confirmTitle?: string;
  confirmActionLabel?: string;
  cancelLabel?: string;
};

export function ConfirmSubmitButton({
  confirmMessage,
  confirmTitle = "Are you sure?",
  confirmActionLabel = "Confirm",
  cancelLabel = "Cancel",
  children,
  onClick,
  variant = "destructive",
  ...props
}: ConfirmSubmitButtonProps) {
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement | null>(null);

  return (
    <>
      <Button
        {...props}
        variant={variant}
        type="button"
        onClick={(event) => {
          onClick?.(event);
          if (event.defaultPrevented) {
            return;
          }

          formRef.current = event.currentTarget.form;
          if (!formRef.current) {
            return;
          }

          setOpen(true);
        }}
      >
        {children}
      </Button>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogPortal>
          <AlertDialogBackdrop />
          <AlertDialogContent>
            <AlertDialogTitle>{confirmTitle}</AlertDialogTitle>
            <AlertDialogDescription>{confirmMessage}</AlertDialogDescription>
            <div className="mt-5 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                {cancelLabel}
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={() => {
                  setOpen(false);
                  formRef.current?.requestSubmit();
                }}
              >
                {confirmActionLabel}
              </Button>
            </div>
          </AlertDialogContent>
        </AlertDialogPortal>
      </AlertDialog>
    </>
  );
}
