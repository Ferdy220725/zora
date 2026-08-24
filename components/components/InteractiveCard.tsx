"use client";

import { motion, useMotionValue, useTransform } from "framer-motion";
import React from "react";

export default function InteractiveCard({ children }: { children: React.ReactNode }) {
  // Koordinat mouse
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Transformasi rotasi berdasarkan koordinat mouse
  const rotateX = useTransform(y, [-100, 100], [10, -10]); // Rotasi vertikal
  const rotateY = useTransform(x, [-100, 100], [-10, 10]); // Rotasi horizontal

  function handleMouseMove(event: React.MouseEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    // Hitung jarak mouse dari tengah card
    x.set(event.clientX - centerX);
    y.set(event.clientY - centerY);
  }

  function handleMouseLeave() {
    // Kembalikan ke posisi awal saat mouse keluar
    x.set(0);
    y.set(0);
  }

  return (
    <motion.div
      style={{
        perspective: 1000, // Memberikan efek 3D
        rotateX,
        rotateY,
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="w-full h-full"
      transition={{ type: "spring", stiffness: 300, damping: 20 }} // Gerakan pegas yang halus
    >
      {children}
    </motion.div>
  );
}