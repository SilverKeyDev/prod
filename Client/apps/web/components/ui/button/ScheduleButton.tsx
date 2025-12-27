import React, { useState } from "react";

import Button from "./Button";
import SchedulingModal from "../../modals/SchedulingModal";

interface ScheduleButtonProps {
  buyerName?: string;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  children?: React.ReactNode;
  className?: string;
}

export default function ScheduleButton({
  buyerName,
  variant = "primary",
  size = "md",
  children = "Schedule",
  className = "",
}: ScheduleButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={() => setIsModalOpen(true)}
        className={className}
      >
        {children}
      </Button>
      <SchedulingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        buyerName={buyerName}
      />
    </>
  );
}

