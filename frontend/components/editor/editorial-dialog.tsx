"use client";

import * as React from "react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface EditorialDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactElement;
  title: string;
  description?: string;
  children: React.ReactNode;
  footerActions?: React.ReactNode;
}

export function EditorialDialog({
  open,
  onOpenChange,
  trigger,
  title,
  description,
  children,
  footerActions,
}: EditorialDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger render={trigger} />}
      <DialogContent
        className={cn(
          "bg-card border border-border/40 rounded-3xl p-8 max-w-[calc(100%-2rem)] sm:max-w-[480px] shadow-xl outline-none ring-0 [&_[data-slot=dialog-close]]:rounded-full [&_[data-slot=dialog-close]]:size-8 [&_[data-slot=dialog-close]]:top-4 [&_[data-slot=dialog-close]]:right-4 [&_[data-slot=dialog-close]]:text-muted-foreground [&_[data-slot=dialog-close]]:hover:text-foreground",
          "data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95"
        )}
      >
        <DialogHeader className="gap-2 text-left">
          <DialogTitle className="font-serif text-2xl font-semibold text-foreground tracking-tight select-none">
            {title}
          </DialogTitle>
          {description && (
            <DialogDescription className="font-sans text-sm text-muted-foreground leading-relaxed mt-1">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>

        {/* Content Area */}
        <div className="py-4 font-sans text-foreground">
          {children}
        </div>

        {/* Footer Actions */}
        {footerActions && (
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 mt-6 pt-5 border-t border-border/20">
            {footerActions}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
