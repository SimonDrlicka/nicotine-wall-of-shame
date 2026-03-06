"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import styles from "./page.module.css";

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

const productOptions = [
  { value: "CIGARETTE", label: "Cigareta" },
  { value: "CIGAR", label: "Cigarenka" },
  { value: "CHEW", label: "Žuvačik" },
  { value: "SHISHA", label: "Šiša" },
  { value: "VAPE", label: "Vapinka" },
] as const;

const productUnit: Record<Slip["productType"], string> = {
  CIGARETTE: "cig",
  CIGAR: "ks",
  CHEW: "ks",
  SHISHA: "min",
  VAPE: "ťahov",
};

const productLabel: Record<Slip["productType"], string> = {
  CIGARETTE: "Cigareta",
  CIGAR: "Cigarenka",
  CHEW: "Žuvačik",
  SHISHA: "Šiša",
  VAPE: "Vapinka",
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

export default function Home() {
  const [people, setPeople] = useState<Person[]>([]);
  const [slips, setSlips] = useState<Slip[]>([]);
  const [loading, setLoading] = useState(true);
  const [personName, setPersonName] = useState("");
  const [selectedPerson, setSelectedPerson] = useState<string>("");
  const [productType, setProductType] =
    useState<Slip["productType"]>("CIGARETTE");
  const [amount, setAmount] = useState(1);
  const [occurredAt, setOccurredAt] = useState(getLocalDateTimeValue());
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showShamePopup, setShowShamePopup] = useState(false);

  const totalCount = useMemo(
    () => slips.reduce((sum, slip) => sum + slip.amount, 0),
    [slips]
  );

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

      const nextPeople = peopleJson.people ?? [];
      const nextSlips = slipsJson.slips ?? [];

      setPeople(nextPeople);
      setSlips(nextSlips);

      if (!selectedPerson && nextPeople.length) {
        setSelectedPerson(nextPeople[0].id);
      }
      return { people: nextPeople, slips: nextSlips };
    } catch (err) {
      setError("Nepodarilo sa načítať dáta. Skús to znova.");
      return { people: [], slips: [] };
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const handleCreatePerson = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (personName.trim().length < 2) {
      setError("Meno musí mať aspoň 2 znaky.");
      return;
    }

    const response = await fetch("/api/people", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: personName.trim() }),
    });

    const result = await response.json();

    if (!response.ok) {
      setError(result.error ?? "Chyba pri vytváraní mena.");
      return;
    }

    setPersonName("");
    setSuccess("Človek pridaný do tabule hanby.");
    await refresh();
  };

  const handleCreateSlip = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!selectedPerson) {
      setError("Vyber človeka.");
      return;
    }

    const previousCount = slips.filter(
      (slip) => slip.personId === selectedPerson
    ).length;

    if (!amount || amount <= 0) {
      setError("Zadaj platný počet.");
      return;
    }

    const response = await fetch("/api/slips", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        personId: selectedPerson,
        productType,
        amount,
        occurredAt,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      setError(result.error ?? "Chyba pri zázname relapsu.");
      return;
    }

    setAmount(1);
    setOccurredAt(getLocalDateTimeValue());
    setSuccess("Relaps zapísaný.");
    const { slips: refreshedSlips } = await refresh();

    const updatedCount = refreshedSlips.filter(
      (slip: { personId: string }) => slip.personId === selectedPerson
    ).length;

    if (previousCount === 2 && updatedCount === 3) {
      setShowShamePopup(true);
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <div>
          <p className={styles.kicker}>Wall of Shame</p>
          <h1>Hanba je záznam. Záznam je pravda.</h1>
          <p className={styles.subtitle}>
            Sleduj pošmyknutia bez výhovoriek. Nikotín sem, hanba sem.
          </p>
          <p className={styles.description}>
            Každý nikotínový prehrešok zapíš hneď. Je to verejná tabuľa hanby,
            ktorú uvidia všetci. Máš sa za čo hanbiť? Tak to aspoň priznaj.
          </p>
          <Link className={styles.statsLink} href="/stats">
            Pozrieť štatistiky
          </Link>
        </div>
        <div className={styles.stats}>
          <div>
            <span className={styles.statLabel}>Total relapsov</span>
            <strong className={styles.statValue}>
              {countFormatter.format(slips.length)}
            </strong>
          </div>
          <div>
            <span className={styles.statLabel}>Total spotreba</span>
            <strong className={styles.statValue}>
              {countFormatter.format(totalCount)}
            </strong>
          </div>
          <div>
            <span className={styles.statLabel}>Ľudia</span>
            <strong className={styles.statValue}>
              {countFormatter.format(people.length)}
            </strong>
          </div>
        </div>
      </header>

      <section className={styles.forms}>
        <form className={styles.card} onSubmit={handleCreatePerson}>
          <h2>Pridaj človeka</h2>
          <label>
            Meno
            <input
              type="text"
              placeholder="Tvoje meno"
              value={personName}
              onChange={(event) => setPersonName(event.target.value)}
            />
          </label>
          <button type="submit">Pridať do tabule</button>
        </form>

        <form className={styles.card} onSubmit={handleCreateSlip}>
          <h2>Zaznamenaj relaps</h2>
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
            Typ produktu
            <select
              value={productType}
              onChange={(event) =>
                setProductType(event.target.value as Slip["productType"])
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
            Počet
            <input
              type="number"
              min={1}
              step={1}
              value={amount}
              onChange={(event) => setAmount(Number(event.target.value))}
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
          <button type="submit">Zapísať hanbu</button>
        </form>
      </section>

      <section className={styles.board}>
        <div className={styles.boardHeader}>
          <h2>Tabuľa hanby</h2>
          {loading ? <span>načítam...</span> : null}
        </div>

        {error ? <div className={styles.alert}>{error}</div> : null}
        {success ? <div className={styles.success}>{success}</div> : null}

        <div className={styles.list}>
          {slips.length === 0 && !loading ? (
            <div className={styles.empty}>
              Zatiaľ nič. Drž sa, alebo to sem zapíš.
            </div>
          ) : null}
          {slips.map((slip) => (
            <article key={slip.id} className={styles.row}>
              <div>
                <strong>{slip.person.name}</strong>
                <span>
                  {dateFormatter.format(new Date(slip.occurredAt))}
                </span>
              </div>
              <div className={styles.rowMeta}>
                <span className={styles.tag}>
                  {productLabel[slip.productType]}
                </span>
                <span className={styles.amount}>
                  {countFormatter.format(slip.amount)} {productUnit[slip.productType]}
                </span>
              </div>
            </article>
          ))}
        </div>
      </section>

      {showShamePopup ? (
        <div className={styles.modalBackdrop} role="dialog" aria-modal="true">
          <div className={styles.modal}>
            <div>
              <h3>Tlsté piče čakajú</h3>
              <p>
                Toto už je tvoj tretí záznam. Tvoja hanba je veľká. Tvoje tajomstvo je odhalené. Ľudia ťa vidia takého, aký si, bozkávajúceho sa s tou tlstou pičatlou a už v živote tvoje meno neupadne do zabudnutia. 
              </p>
            </div>
            <div className={styles.modalMedia}>
              <img
                src="https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExaDF0Ym5lanppeHBjeGJqeHYzNzZ5Zm85ODhobjRhbG1wamUwOHA1ZSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/DDqnnZCKrpF0ctocT9/giphy.gif"
                alt="Shame gif"
              />
            </div>
            <button
              type="button"
              className={styles.modalClose}
              onClick={() => setShowShamePopup(false)}
            >
              Zavrieť
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
