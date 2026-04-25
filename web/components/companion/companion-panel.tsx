"use client";

import { useCallback, useState } from "react";
import { CompanionInventory, type CompanionItem } from "@/components/companion/companion-inventory";
import { CompanionPublishForm } from "@/components/companion/companion-publish-form";

type CompanionPanelProps = {
  token: string;
};

export function CompanionPanel({ token }: CompanionPanelProps) {
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeCount, setActiveCount] = useState(0);
  const [maxActive, setMaxActive] = useState(4);

  const handleInventoryChange = useCallback(
    (items: CompanionItem[], cap: number) => {
      const live = items.filter(
        (item) => item.status === "active" || item.status === "locked",
      ).length;
      setActiveCount(live);
      setMaxActive(cap);
    },
    [],
  );

  const handlePublished = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  const slotsLeft = Math.max(0, maxActive - activeCount);
  const isFull = slotsLeft === 0;

  return (
    <div className="space-y-5">
      <CompanionPublishForm
        token={token}
        onPublished={handlePublished}
        disabledReason={
          isFull
            ? `You have ${activeCount}/${maxActive} live items. Remove one below before publishing more.`
            : undefined
        }
      />
      <CompanionInventory
        token={token}
        refreshKey={refreshKey}
        onChange={handleInventoryChange}
      />
    </div>
  );
}
