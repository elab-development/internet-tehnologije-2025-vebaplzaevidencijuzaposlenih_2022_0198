"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/AuthProvider";

export default function HomePage() {
  const slides = useMemo(
    () => [
      "/slides/slide1.jpg",
      "/slides/slide2.jpg",
      "/slides/slide3.jpg",
      "/slides/slide4.jpg",
    ],
    []
  );

  const [index, setIndex] = useState(0);
  const { user } = useAuth();

  function greetName(user: { email?: string } | null) {
    if (!user?.email) return "korisniče";
    return user.email.split("@")[0];
  }

  useEffect(() => {
    const t = setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, 3500);
    return () => clearInterval(t);
  }, [slides.length]);

  return (
    <main>
      <div className="card" style={{ padding: 22 }}>
        {user ? (
          <div className="welcomeLine">
            Dobrodošao, <b>{greetName(user)}</b>
            <p style={{ fontSize: 14 }}>Ulogovan si kao {user.role}</p>
          </div>
        ) : null}

        <h1 className="h1" style={{ fontSize: 34 }}>
          Evidencija prisustva zaposlenih
        </h1>

        <p className="h2" style={{ marginTop: 6 }}>
          Jednostavan sistem za praćenje dolazaka, odlazaka i aktivnosti.
        </p>

        <div className="homeHighlights">
          <span className="chip">Brz check-in / check-out</span>
          <span className="chip">Plan aktivnosti (nedelja)</span>
          <span className="chip">Uloge i dozvole</span>
        </div>

        <div className="homeFeatures">
          <div className="featureCard">
            <div className="featureTitle">Prisustvo</div>
            <div className="muted">
              Jednim klikom evidentiraš dolazak i odlazak.
            </div>
          </div>

          <div className="featureCard">
            <div className="featureTitle">Aktivnosti</div>
            <div className="muted">Nedeljni pregled i organizacija rada.</div>
          </div>

          <div className="featureCard">
            <div className="featureTitle">Uloge</div>
            <div className="muted">
              Jasne dozvole za Employee / Manager / Admin.
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="sectionTitle">O kompaniji</div>
        <p className="muted" style={{ marginTop: 6 }}>
          Naša kompanija pruža jednostavno rešenje za evidenciju prisustva i
          organizaciju rada zaposlenih. Sistem omogućava uloge korisnika,
          transparentnu istoriju dolazaka/odlazaka i pregled aktivnosti u
          kalendaru.
        </p>
        <p className="muted" style={{ marginTop: 6 }}>
          Sistem je implementiran kao moderna web aplikacija sa jasno
          razdvojenim frontend i backend slojevima. Frontend je razvijen u
          Next.js (React) okruženju i fokusiran je na preglednost, brzinu i
          jednostavno korisničko iskustvo. Backend je zasnovan na API
          arhitekturi i obezbeđuje centralizovano upravljanje korisnicima,
          aktivnostima i evidencijom prisustva, uz strogu kontrolu pristupa po
          ulogama (ADMIN, MANAGER, EMPLOYEE). Svi podaci se trajno čuvaju u
          relacionoj bazi podataka, dok je komunikacija između klijenta i
          servera realizovana preko sigurnih HTTP zahteva sa autentifikacijom.
          Sistem je projektovan tako da omogući jednostavno proširenje
          funkcionalnosti i prilagođavanje različitim organizacionim
          strukturama.
        </p>
      </div>
      <div className="card" style={{ marginTop: 16, padding: 16 }}>
        <div className="sectionTitle" style={{ marginBottom: 10 }}>
          Galerija (slideshow)
        </div>

        <div className="slideshow">
          <img
            src={slides[index]}
            alt="Company slideshow"
            className="slideshowImg"
          />

          <button
            className="slideArrow slideArrowLeft"
            onClick={() =>
              setIndex((i) => (i - 1 + slides.length) % slides.length)
            }
            aria-label="Previous"
          >
            {"<"}
          </button>

          <button
            className="slideArrow slideArrowRight"
            onClick={() => setIndex((i) => (i + 1) % slides.length)}
            aria-label="Next"
          >
            {">"}
          </button>

          <div className="slideshowDots">
            {slides.map((_, i) => (
              <button
                key={i}
                className={`dot ${i === index ? "dotActive" : ""}`}
                onClick={() => setIndex(i)}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
