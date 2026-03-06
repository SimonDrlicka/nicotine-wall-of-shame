"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import styles from "./stats.module.css";

type Person = {
  id: string;
  name: string;
  createdAt: string;
};

type Slip = {
  id: string;
  personId: string;
  occurredAt: string;
  amount: number;
  productType: "CIGARETTE" | "CIGAR" | "CHEW" | "SHISHA" | "VAPE";
  createdAt: string;
  person: Person;
};

const productLabel: Record<Slip["productType"], string> = {
  CIGARETTE: "Cigareta",
  CIGAR: "Cigarenka",
  CHEW: "Žuvačik",
  SHISHA: "Shisha",
  VAPE: "Vapinka",
};

const dateFormatter = new Intl.DateTimeFormat("sk-SK", {
  dateStyle: "medium",
});

const countFormatter = new Intl.NumberFormat("sk-SK");

const toDayKey = (value: string) => value.slice(0, 10);

export default function StatsPage() {
  const [people, setPeople] = useState<Person[]>([]);
  const [slips, setSlips] = useState<Slip[]>([]);
  const [selectedPerson, setSelectedPerson] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const [peopleRes, slipsRes] = await Promise.all([
        fetch("/api/people"),
        fetch("/api/slips"),
      ]);

      const peopleJson = await peopleRes.json();
      const slipsJson = await slipsRes.json();

      setPeople(peopleJson.people ?? []);
      setSlips(slipsJson.slips ?? []);

      if (!selectedPerson && peopleJson.people?.length) {
        setSelectedPerson(peopleJson.people[0].id);
      }
    } catch (err) {
      setError("Nepodarilo sa načítať dáta. Skús to znova.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const stats = useMemo(() => {
    if (!selectedPerson) {
      return null;
    }

    const personSlips = slips.filter(
      (slip) => slip.personId === selectedPerson
    );

    if (personSlips.length === 0) {
      return {
        personSlips,
        totalRelapses: 0,
        totalAmount: 0,
        uniqueDays: 0,
        mostCommonProduct: null,
        averagePerRelapse: 0,
        mostIntenseDay: null,
        lastRelapseDate: null,
      };
    }

    const totalRelapses = personSlips.length;
    const totalAmount = personSlips.reduce((sum, slip) => sum + slip.amount, 0);

    const dayMap = new Map<string, number>();
    const productMap = new Map<Slip["productType"], number>();

    for (const slip of personSlips) {
      const dayKey = toDayKey(slip.occurredAt);
      dayMap.set(dayKey, (dayMap.get(dayKey) ?? 0) + slip.amount);
      productMap.set(
        slip.productType,
        (productMap.get(slip.productType) ?? 0) + slip.amount
      );
    }

    const uniqueDays = dayMap.size;
    const averagePerRelapse = totalAmount / totalRelapses;

    let mostCommonProduct: Slip["productType"] | null = null;
    let mostCommonCount = 0;

    for (const [type, count] of productMap.entries()) {
      if (count > mostCommonCount) {
        mostCommonProduct = type;
        mostCommonCount = count;
      }
    }

    let mostIntenseDay: { date: string; amount: number } | null = null;
    for (const [date, amount] of dayMap.entries()) {
      if (!mostIntenseDay || amount > mostIntenseDay.amount) {
        mostIntenseDay = { date, amount };
      }
    }

    const lastRelapse = personSlips[0];

    return {
      personSlips,
      totalRelapses,
      totalAmount,
      uniqueDays,
      mostCommonProduct,
      averagePerRelapse,
      mostIntenseDay,
      lastRelapseDate: lastRelapse ? new Date(lastRelapse.occurredAt) : null,
    };
  }, [selectedPerson, slips]);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.kicker}>Wall of Shame</p>
          <h1>Štatistika relapsov</h1>
          <p className={styles.subtitle}>
            Vyber si človeka a pozri brutálne čísla.
          </p>
        </div>
        <Link className={styles.back} href="/">
          Späť na tabuľu
        </Link>
      </header>

      <section className={styles.selector}>
        <label>
          Človek
          <select
            value={selectedPerson}
            onChange={(event) => setSelectedPerson(event.target.value)}
          >
            <option value="">-- vyber --</option>
            {people.map((person) => (
              <option key={person.id} value={person.id}>
                {person.name}
              </option>
            ))}
          </select>
        </label>
      </section>

      {loading ? <div className={styles.note}>načítam...</div> : null}
      {error ? <div className={styles.alert}>{error}</div> : null}

      {!loading && stats && stats.personSlips.length === 0 ? (
        <div className={styles.empty}>
          Zatiaľ žiadny relaps pre tohto človeka.
        </div>
      ) : null}

      {!loading && stats && stats.personSlips.length > 0 ? (
        <section className={styles.grid}>
          <article>
            <span>Počet relapsov</span>
            <strong>{countFormatter.format(stats.totalRelapses)}</strong>
          </article>
          <article>
            <span>Porusene dni</span>
            <strong>{countFormatter.format(stats.uniqueDays)}</strong>
          </article>
          <article>
            <span>Najčastejšie</span>
            <strong>
              {stats.mostCommonProduct
                ? productLabel[stats.mostCommonProduct]
                : "-"}
            </strong>
          </article>
          <article>
            <span>Priemer na relaps</span>
            <strong>{stats.averagePerRelapse.toFixed(1)}</strong>
          </article>
          <article>
            <span>Najhoršia noc</span>
            <strong>
              {stats.mostIntenseDay
                ? `${countFormatter.format(stats.mostIntenseDay.amount)} / ${dateFormatter.format(
                    new Date(stats.mostIntenseDay.date)
                  )}`
                : "-"}
            </strong>
          </article>
          <article>
            <span>Posledný relaps</span>
            <strong>
              {stats.lastRelapseDate
                ? dateFormatter.format(stats.lastRelapseDate)
                : "-"}
            </strong>
          </article>
        </section>
      ) : null}
    </div>
  );
}
