"use client";

import React from "react";
import { FloatingDock } from "@/components/ui/floating-dock";
import {
  IconHome,
  IconMessage,
  IconWallet,
  IconBolt,
  IconScale,
  IconSettings,
} from "@tabler/icons-react";

export function FloatingNav() {
  const links = [
    {
      title: "Home",
      icon: (
        <IconHome className="h-full w-full text-neutral-500 dark:text-neutral-300" />
      ),
      href: "/",
    },
    {
      title: "Gift Messages",
      icon: (
        <IconMessage className="h-full w-full text-neutral-500 dark:text-neutral-300" />
      ),
      href: "/nostr",
    },
    {
      title: "P2PK Tokens",
      icon: (
        <IconWallet className="h-full w-full text-neutral-500 dark:text-neutral-300" />
      ),
      href: "/cashu",
    },
    {
      title: "HODL Invoices",
      icon: (
        <IconBolt className="h-full w-full text-neutral-500 dark:text-neutral-300" />
      ),
      href: "/lightning",
    },
    {
      title: "Disputes",
      icon: (
        <IconScale className="h-full w-full text-neutral-500 dark:text-neutral-300" />
      ),
      href: "/disputes",
    },
    {
      title: "Settings",
      icon: (
        <IconSettings className="h-full w-full text-neutral-500 dark:text-neutral-300" />
      ),
      href: "/settings",
    },
  ];
  
  return (
    <div className="fixed bottom-8 left-0 right-0 z-50 mx-auto flex justify-center">
      <FloatingDock
        items={links}
        desktopClassName="shadow-xl"
        mobileClassName="shadow-xl"
      />
    </div>
  );
} 