"use client";

import { useState } from "react";

const faqs = [
  {
    id: "instalar",
    question: "¿Necesito instalar algo para jugar?",
    answer:
      "No. Todos los juegos pueden jugarse directamente desde el navegador, sin necesidad de instalar ningún programa.",
  },
  {
    id: "dispositivos",
    question: "¿Los juegos funcionan en navegadores y dispositivos móviles?",
    answer:
      "Actualmente los juegos están optimizados para jugarse desde desktop. La compatibilidad con dispositivos móviles se irá agregando próximamente.",
  },
  {
    id: "creados",
    question: "¿Cómo fueron creados los juegos?",
    answer:
      "Los juegos fueron desarrollados utilizando Unity. Me encargué del diseño, programación y arte de los proyectos. En algunos casos también utilicé assets disponibles en la Unity Asset Store.",
  },
  {
    id: "gratuitos",
    question: "¿Los juegos son gratuitos?",
    answer:
      "Sí. Todos los juegos disponibles en esta página pueden jugarse de forma gratuita.",
  },
  {
    id: "quien",
    question: "¿Quién desarrolla estos juegos?",
    answer:
      "Soy desarrollador de videojuegos y me encargo de crear estos proyectos de principio a fin, incluyendo diseño, programación, integración de arte y publicación.",
  },
];

export function Faq() {
  const [open, setOpen] = useState<string[]>([]);

  const toggle = (id: string) =>
    setOpen((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  return (
    <section className="faq" aria-label="Preguntas frecuentes">
      <h2 className="faq-title">Preguntas frecuentes</h2>
      <div className="faq-grid">
        {faqs.map((faq) => {
          const isOpen = open.includes(faq.id);
          return (
            <div key={faq.id} className="faq-card">
              <button
                type="button"
                className="faq-question"
                aria-expanded={isOpen}
                aria-controls={`faq-panel-${faq.id}`}
                onClick={() => toggle(faq.id)}
              >
                <span>{faq.question}</span>
                <svg
                  viewBox="0 0 16 16"
                  width="18"
                  height="18"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  className={`faq-chevron${isOpen ? " is-open" : ""}`}
                  aria-hidden="true"
                >
                  <path d="m4 6 4 4 4-4" />
                </svg>
              </button>
              <div
                id={`faq-panel-${faq.id}`}
                className={`faq-answer${isOpen ? " is-open" : ""}`}
              >
                <p>{faq.answer}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}