"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

export default function HomePage() {
  const slides = useMemo(
    () => [
      "/slides/slide1.jpg",
      "/slides/slide2.jpg",
      "/slides/slide3.jpg",
      "slides/slide4.jpg",
    ],
    []
  );

  const [index, setIndex] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, 3500);
    return () => clearInterval(t);
  }, [slides.length]);

  return (
    <main>
      <div className="card" style={{ padding: 22 }}>
        <h1 className="h1" style={{ fontSize: 34 }}>
          Evidencija zaposlenih
        </h1>
        <p className="h2" style={{ marginTop: 6 }}>
          Jednostavan sistem za praćenje dolazaka, odlazaka i aktivnosti.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            gap: 12,
            marginTop: 15,
          }}
        >
          <Link href="/login" className="menuCard">
            <div className="menuTitle">Login</div>
            <div className="muted">Uloguj se i pristupi sistemu</div>
          </Link>

          <Link href="/attendance" className="menuCard">
            <div className="menuTitle">Attendance</div>
            <div className="muted">Evidentiraj dolazak/odlazak</div>
          </Link>

          <Link href="/calendar" className="menuCard">
            <div className="menuTitle">Calendar</div>
            <div className="muted">Pregled aktivnosti po nedelji</div>
          </Link>

          <Link
            href="/admin"
            className="menuCard"
            style={{ gridColumn: "span 3" }}
          >
            <div className="menuTitle">Admin</div>
            <div className="muted">Upravljanje korisnicima</div>
          </Link>
        </div>
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

          {/* kontrole */}
          <div className="slideshowControls">
            <button
              className="btn"
              onClick={() =>
                setIndex((i) => (i - 1 + slides.length) % slides.length)
              }
            >
              ◀
            </button>
            <button
              className="btn"
              onClick={() => setIndex((i) => (i + 1) % slides.length)}
            >
              ▶
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
      </div>

      {/* ABOUT */}
      <div className="card" style={{ marginTop: 16 }}>
        <div className="sectionTitle">O kompaniji</div>
        <p className="muted" style={{ marginTop: 6 }}>
          Naša kompanija pruža jednostavno rešenje za evidenciju prisustva i
          organizaciju rada zaposlenih. Sistem omogućava uloge korisnika,
          transparentnu istoriju dolazaka/odlazaka i pregled aktivnosti u
          kalendaru.
        </p>
        <p className="muted" style={{ marginTop: 6 }}>
          Fokus je na pouzdanosti, brzini korišćenja i jasnom prikazu podataka,
          tako da menadžeri imaju uvid, a zaposleni jednostavan način
          evidencije.
        </p>
      </div>
    </main>
  );
}
