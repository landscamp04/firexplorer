"use client";

import { useEffect, useMemo, useState } from "react";

interface RollingNumberProps {
  value: number;
  loading: boolean;
  formatter?: (value: number) => string;
  className?: string;
}

interface RollingLabelProps {
  value: string;
  loading: boolean;
  className?: string;
}

function parseMostRecentLabel(input: string): { name: string; year: number | null } {
  const match = input.match(/^(.*)\((\d{4})\)\s*$/);
  if (!match) {
    return { name: input, year: null };
  }

  return {
    name: match[1].trim(),
    year: Number(match[2]),
  };
}

function parseLargestLabel(input: string): { name: string; acres: number | null } {
  const match = input.match(/^(.*)\(([\d,]+)\s+acres\)\s*$/i);
  if (!match) {
    return { name: input, acres: null };
  }

  return {
    name: match[1].trim(),
    acres: Number(match[2].replaceAll(",", "")),
  };
}

export function RollingNumber({
  value,
  loading,
  formatter = (input) => input.toString(),
  className,
}: RollingNumberProps) {
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    if (!loading) {
      setDisplayValue(value);
      return;
    }

    const jitterBase = Math.max(2, Math.round(Math.abs(value) * 0.08));
    const interval = setInterval(() => {
      const direction = Math.random() > 0.5 ? 1 : -1;
      const jitter = Math.floor(Math.random() * jitterBase);
      const next = Math.max(0, value + direction * jitter);
      setDisplayValue(next);
    }, 80);

    return () => {
      clearInterval(interval);
    };
  }, [loading, value]);

  const classes = useMemo(() => {
    const base = `tabular-nums transition-opacity duration-200 ${
      loading ? "opacity-90" : "opacity-100"
    }`;
    return className ? `${base} ${className}` : base;
  }, [className, loading]);

  return <span className={classes}>{formatter(displayValue)}</span>;
}

export function RollingMostRecent({
  value,
  loading,
  className,
}: RollingLabelProps) {
  const parsed = parseMostRecentLabel(value);

  if (!Number.isFinite(parsed.year)) {
    return <span className={className}>{value}</span>;
  }

  return (
    <span className={className}>
      {parsed.name} (
      <RollingNumber value={parsed.year ?? 0} loading={loading} />
      )
    </span>
  );
}

export function RollingLargestFire({
  value,
  loading,
  className,
}: RollingLabelProps) {
  const parsed = parseLargestLabel(value);

  if (!Number.isFinite(parsed.acres)) {
    return <span className={className}>{value}</span>;
  }

  return (
    <span className={className}>
      {parsed.name} (
      <RollingNumber
        value={parsed.acres ?? 0}
        loading={loading}
        formatter={(input) => Math.round(input).toLocaleString()}
      />{" "}
      acres)
    </span>
  );
}
