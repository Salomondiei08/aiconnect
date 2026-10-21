"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Révélation au défilement : observe l'élément et ajoute `.is-visible` à la première intersection.
 * Sans IntersectionObserver (anciens navigateurs) ou avec `prefers-reduced-motion`, le contenu reste visible :
 * la classe `.reveal` est neutralisée par la feuille de style globale.
 */
export function Reveal({
  children,
  className,
  delay = 0,
  as: Tag = "div",
  once = true,
  threshold = 0.12,
}: {
  children: React.ReactNode;
  className?: string;
  /** Décalage en millisecondes pour un effet en cascade. */
  delay?: number;
  as?: React.ElementType;
  once?: boolean;
  threshold?: number;
}) {
  const ref = React.useRef<HTMLElement | null>(null);
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (typeof IntersectionObserver === "undefined") {
      // Repli sans observateur : on affiche directement, sans passage par l'état React.
      node.classList.add("is-visible");
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true);
            if (once) observer.unobserve(entry.target);
          } else if (!once) {
            setVisible(false);
          }
        }
      },
      { threshold, rootMargin: "0px 0px -8% 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [once, threshold]);

  return (
    <Tag
      ref={ref as never}
      className={cn("reveal", visible && "is-visible", className)}
      style={{ ["--reveal-delay" as string]: `${delay}ms` }}
    >
      {children}
    </Tag>
  );
}

/**
 * Entrée en cascade d'une liste : chaque enfant reçoit son décalage.
 * Utile pour les cartes de fonctions, les lignes de KPI ou les tuiles de caisse.
 */
export function Stagger({
  children,
  className,
  step = 60,
  start = 0,
  as: Tag = "div",
}: {
  children: React.ReactNode;
  className?: string;
  step?: number;
  start?: number;
  as?: React.ElementType;
}) {
  const items = React.Children.toArray(children).filter(Boolean);
  return (
    <Tag className={className}>
      {items.map((child, index) => (
        <Reveal key={index} delay={start + index * step} className="h-full">
          {child}
        </Reveal>
      ))}
    </Tag>
  );
}
