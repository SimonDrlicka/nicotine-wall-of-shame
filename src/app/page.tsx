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
  productType: "CIGARETTE" | "CHEW" | "VAPE";
  createdAt: string;
  person: Person;
};

const productOptions = [
  { value: "CIGARETTE", label: "Cigareta" },
  { value: "CHEW", label: "Žuvačik" },
  { value: "VAPE", label: "Vapinka" },
] as const;

const productUnit: Record<Slip["productType"], string> = {
  CIGARETTE: "cig",
  CHEW: "ks",
  VAPE: "ťahov",
};

const productLabel: Record<Slip["productType"], string> = {
  CIGARETTE: "Cigareta",
  CHEW: "Žuvačik",
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

      setPeople(peopleJson.people ?? []);
      setSlips(slipsJson.slips ?? []);

      if (!selectedPerson && peopleJson.people?.length) {
        setSelectedPerson(peopleJson.people[0].id);
      }
    } catch (err) {
      setError("Nepodarilo sa nacitat data. Skus to znova.");
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
      setError("Meno musi mat aspon 2 znaky.");
      return;
    }

    const response = await fetch("/api/people", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: personName.trim() }),
    });

    const result = await response.json();

    if (!response.ok) {
      setError(result.error ?? "Chyba pri vytvarani mena.");
      return;
    }

    setPersonName("");
    setSuccess("Clovek pridany do tabule hanby.");
    await refresh();
  };

  const handleCreateSlip = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!selectedPerson) {
      setError("Vyber cloveka.");
      return;
    }

    if (!amount || amount <= 0) {
      setError("Zadaj platny pocet.");
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
      setError(result.error ?? "Chyba pri zazname relapsu.");
      return;
    }

    setAmount(1);
    setOccurredAt(getLocalDateTimeValue());
    setSuccess("Relaps zapisany.");
    await refresh();
  };

  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <div>
          <p className={styles.kicker}>Wall of Shame</p>
          <h1>Hanba je zaznam. Zaznam je pravda.</h1>
          <p className={styles.subtitle}>
            Sleduj posmyknutia bez vyhovoriek. Nikotin sem, hanba sem.
          </p>
          <p className={styles.description}>
            Kazdy nikotinovy prehresok zapis hned. Je to verejna tabula hanby,
            ktoru uvidia vsetci. Mas sa za co hanbit? Tak to aspon priznaj.
          </p>
          <Link className={styles.statsLink} href="/stats">
            Pozriet statistiky
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
            <span className={styles.statLabel}>Ludia</span>
            <strong className={styles.statValue}>
              {countFormatter.format(people.length)}
            </strong>
          </div>
        </div>
      </header>

      <section className={styles.forms}>
        <form className={styles.card} onSubmit={handleCreatePerson}>
          <h2>Pridaj cloveka</h2>
          <label>
            Meno
            <input
              type="text"
              placeholder="Tvoje meno"
              value={personName}
              onChange={(event) => setPersonName(event.target.value)}
            />
          </label>
          <button type="submit">Pridat do tabule</button>
        </form>

        <form className={styles.card} onSubmit={handleCreateSlip}>
          <h2>Zaznamenaj relaps</h2>
          <label>
            Clovek
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
            Pocet
            <input
              type="number"
              min={1}
              step={1}
              value={amount}
              onChange={(event) => setAmount(Number(event.target.value))}
            />
          </label>
          <label>
            Datum a cas
            <input
              type="datetime-local"
              value={occurredAt}
              onChange={(event) => setOccurredAt(event.target.value)}
            />
          </label>
          <button type="submit">Zapisat hanbu</button>
        </form>
      </section>

      <section className={styles.board}>
        <div className={styles.boardHeader}>
          <h2>Tabula hanby</h2>
          {loading ? <span>nacitam...</span> : null}
        </div>

        {error ? <div className={styles.alert}>{error}</div> : null}
        {success ? <div className={styles.success}>{success}</div> : null}

        <div className={styles.list}>
          {slips.length === 0 && !loading ? (
            <div className={styles.empty}>
              Zatial nic. Drz sa, alebo to sem zapis.
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
    </div>
  );
}
