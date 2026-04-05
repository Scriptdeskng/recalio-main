"use client";

import { Menu, Swords, BarChart3, User } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type { ScreenState } from "@/lib/types";
import { useState } from "react";

interface MenuSheetProps {
  historyCount: number;
  challengeCount: number;
  onNavigate: (screen: ScreenState) => void;
}

const menuItems = [
  { screen: "my-challenges" as ScreenState, icon: Swords, label: "My Challenges", countKey: "challengeCount" as const },
  { screen: "history" as ScreenState, icon: BarChart3, label: "History", countKey: "historyCount" as const },
  { screen: "profile" as ScreenState, icon: User, label: "Profile", countKey: null },
];

export default function MenuSheet({ historyCount, challengeCount, onNavigate }: MenuSheetProps) {
  const [open, setOpen] = useState(false);

  const counts: Record<string, number> = { historyCount, challengeCount };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button className="w-10 h-10 rounded-xl bg-card flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors border border-border">
          <Menu className="w-5 h-5" />
        </button>
      </SheetTrigger>
      <SheetContent side="bottom" className="rounded-t-3xl pb-8 bg-background border-border">
        <SheetHeader className="mb-4">
          <SheetTitle className="font-display text-lg font-700 text-foreground">Menu</SheetTitle>
        </SheetHeader>
        <div className="space-y-1">
          {menuItems.map((item) => {
            const count = item.countKey ? counts[item.countKey] : 0;
            return (
              <button
                key={item.screen}
                onClick={() => {
                  setOpen(false);
                  onNavigate(item.screen);
                }}
                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-foreground hover:bg-card transition-colors"
              >
                <item.icon className="w-5 h-5 text-muted-foreground" />
                <span className="font-display text-sm font-600 flex-1 text-left">{item.label}</span>
                {item.countKey && count > 0 && (
                  <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                    {count > 99 ? "99+" : count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}
