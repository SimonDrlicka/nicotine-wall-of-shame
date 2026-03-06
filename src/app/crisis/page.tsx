"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import styles from "./crisis.module.css";

type Person = {
  id: string;
  name: string;
  createdAt: string;
};

type Crisis = {
  id: string;
  personId: string;
  occurredAt: string;
  amount: number;
  cravingType: "CIGARETTE" | "CIGAR" | "CHEW" | "SHISHA" | "VAPE";
  note: string;
  rewardType: "BADGE" | "TREAT" | "STREAK";
  rewardLabel: string;
  createdAt: string;
  person: Person;
};

const productOptions = [
  { value: "CIGARETTE", label: "Cigareta" },
  { value: "CIGAR", label: "Cigarenka" },
  { value: "CHEW", label: "Žuvačik" },
  { value: "SHISHA", label: "Šiša" },
  { value: "VAPE", label: "Vapinka" },
] as const;

const productUnit: Record<Crisis["cravingType"], string> = {
  CIGARETTE: "cig",
  CIGAR: "ks",
  CHEW: "ks",
  SHISHA: "min",
  VAPE: "ťahov",
};

const productLabel: Record<Crisis["cravingType"], string> = {
  CIGARETTE: "Cigareta",
  CIGAR: "Cigarenka",
  CHEW: "Žuvačik",
  SHISHA: "Šiša",
  VAPE: "Vapinka",
};

const defaultNotes: Record<Crisis["cravingType"], string> = {
  CIGARETTE: "Kríza na cigaretu. Telo si pýtalo dym.",
  CIGAR: "Cigarenková chuť. Chcel som si to ospravedlniť.",
  CHEW: "Strašne som sa potreboval naložiť.",
  SHISHA: "Šiša v hlave. Potreboval som ten rituál.",
  VAPE: "Vapinka volala. Ruky hľadali návyk.",
};

const dateFormatter = new Intl.DateTimeFormat("sk-SK", {
  dateStyle: "medium",
  timeStyle: "short",
});

const countFormatter = new Intl.NumberFormat("sk-SK");

const getLocalDateTimeValue = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  const local = new Date(now.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
};

export default function CrisisPage() {
  const [people, setPeople] = useState<Person[]>([]);
  const [crises, setCrises] = useState<Crisis[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPerson, setSelectedPerson] = useState<string>("");
  const [cravingType, setCravingType] =
    useState<Crisis["cravingType"]>("CIGARETTE");
  const [amount, setAmount] = useState(() =>
    Math.floor(12 + Math.random() * 39)
  );
  const [note, setNote] = useState(defaultNotes.CIGARETTE);
  const [occurredAt, setOccurredAt] = useState(getLocalDateTimeValue());
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const filteredCrises = useMemo(
    () =>
      selectedPerson
        ? crises.filter((crisis) => crisis.personId === selectedPerson)
        : [],
    [crises, selectedPerson]
  );

  const totalCrises = useMemo(
    () => filteredCrises.reduce((sum, crisis) => sum + crisis.amount, 0),
    [filteredCrises]
  );

  const currentReward = filteredCrises.length
    ? filteredCrises[0].rewardLabel
    : null;

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const [peopleRes, crisesRes] = await Promise.all([
        fetch("/api/people"),
        fetch("/api/crises"),
      ]);

      const peopleJson = await peopleRes.json();
      const crisesJson = await crisesRes.json();

      const nextPeople = peopleJson.people ?? [];
      const nextCrises = crisesJson.crises ?? [];

      setPeople(nextPeople);
      setCrises(nextCrises);

      if (!selectedPerson && nextPeople.length) {
        setSelectedPerson(nextPeople[0].id);
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

  useEffect(() => {
    setAmount(Math.floor(12 + Math.random() * 39));
    setNote(defaultNotes[cravingType]);
  }, [cravingType]);

  const handleCreateCrisis = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!selectedPerson) {
      setError("Vyber človeka.");
      return;
    }

    if (!amount || amount <= 0) {
      setError("Zadaj platný počet.");
      return;
    }

    const response = await fetch("/api/crises", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        personId: selectedPerson,
        cravingType,
        amount,
        occurredAt,
        note,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      setError(result.error ?? "Chyba pri zápise krízy.");
      return;
    }

    setAmount(Math.floor(12 + Math.random() * 39));
    setNote(defaultNotes[cravingType]);
    setOccurredAt(getLocalDateTimeValue());
    setSuccess(`Kríza prekonaná. Odmena: ${result.crisis.rewardLabel}`);
    await refresh();
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.kicker}>Wall of Shame</p>
          <h1>Prekonané krízy</h1>
          <p className={styles.subtitle}>
            Keď to zvládneš, zapíš to sem. Dostaneš odmenu a uvidíš, že to ide.
          </p>
        </div>
        <Link className={styles.back} href="/">
          Späť na tabuľu
        </Link>
      </header>

      <section className={styles.stats}>
        <div>
          <span>Prekonané krízy</span>
          <strong>{countFormatter.format(filteredCrises.length)}</strong>
        </div>
        <div>
          <span>Odolaté množstvo</span>
          <strong>{countFormatter.format(totalCrises)}</strong>
        </div>
        <div>
          <span>Aktuálna odmena</span>
          <strong>{currentReward ?? "—"}</strong>
        </div>
      </section>

      <section className={styles.formWrap}>
        <form className={styles.card} onSubmit={handleCreateCrisis}>
          <h2>Zapíš krízu</h2>
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
          <label>
            Na čo si mal chuť
            <select
              value={cravingType}
              onChange={(event) =>
                setCravingType(event.target.value as Crisis["cravingType"])
              }
            >
              {productOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Množstvo
            <input
              type="number"
              min={1}
              step={1}
              value={amount}
              onChange={(event) => setAmount(Number(event.target.value))}
            />
          </label>
          <label>
            Poznámka
            <textarea
              rows={3}
              value={note}
              onChange={(event) => setNote(event.target.value)}
            />
          </label>
          <label>
            Dátum a čas
            <input
              type="datetime-local"
              value={occurredAt}
              onChange={(event) => setOccurredAt(event.target.value)}
            />
          </label>
          <button type="submit">Kríza prekonaná</button>
        </form>

        <div className={styles.rewards}>
          <h3>Odmeny v obehu</h3>
          <ul>
            <li>🛡️ Železná vôľa: +1 odolnosť</li>
            <li>🍵 Malá odmena: teplý čaj bez nikotínu</li>
            <li>🔥 Streak boost: jedna kríza bez pádu</li>
            <li>🏴 Čierna známka disciplíny</li>
            <li>🧘 Reward drop: 10 min chill</li>
          </ul>
        </div>
      </section>

      {loading ? <div className={styles.note}>načítam...</div> : null}
      {error ? <div className={styles.alert}>{error}</div> : null}
      {success ? <div className={styles.success}>{success}</div> : null}

      <section className={styles.board}>
        <div className={styles.boardHeader}>
          <h2>Prekonané krízy</h2>
        </div>
        <div className={styles.filterRow}>
          <label>
            Filter osoby
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
        </div>
        <div className={styles.list}>
          {filteredCrises.length === 0 && !loading ? (
            <div className={styles.empty}>
              Zatiaľ nič. Daj si cieľ a splň ho.
            </div>
          ) : null}
          {filteredCrises.map((crisis) => (
            <article key={crisis.id} className={styles.row}>
              <div>
                <strong>{crisis.person.name}</strong>
                <span>
                  {dateFormatter.format(new Date(crisis.occurredAt))}
                </span>
              </div>
              <div className={styles.rowMeta}>
                <span className={styles.tag}>
                  {productLabel[crisis.cravingType]}
                </span>
                <span className={styles.amount}>
                  {countFormatter.format(crisis.amount)} {productUnit[crisis.cravingType]}
                </span>
              </div>
              <div className={styles.noteLine}>{crisis.note}</div>
              <div className={styles.reward}>
                <span>Odmena</span>
                <strong>{crisis.rewardLabel}</strong>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
