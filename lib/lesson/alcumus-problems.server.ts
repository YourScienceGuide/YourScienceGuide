import "server-only";

import type { AlcumusProblem } from "@/lib/lesson/alcumus-types";

export const ALCUMUS_PROBLEMS: AlcumusProblem[] = [
  {
    id: "a1",
    level: 1,
    type: "choice",
    prompt: "Which organelle is known as the powerhouse of the cell?",
    options: ["Nucleus", "Mitochondria", "Ribosome", "Vacuole"],
    correctIndex: 1,
    hint: "It produces ATP for the cell.",
  },
  {
    id: "a2",
    level: 1,
    type: "numeric",
    prompt:
      "A model cell has 3 mitochondria. You add 2 more. How many mitochondria are there now?",
    acceptedAnswers: ["5", "five"],
  },
  {
    id: "b1",
    level: 2,
    type: "choice",
    prompt: "Photosynthesis primarily takes place in which part of the plant cell?",
    options: ["Cell wall", "Chloroplasts", "Cell membrane", "Golgi body"],
    correctIndex: 1,
  },
  {
    id: "b2",
    level: 2,
    type: "numeric",
    prompt:
      "If 2/5 of a leaf cross-section is palisade tissue, what decimal is that?",
    acceptedAnswers: ["0.4", ".4", "2/5"],
  },
  {
    id: "c1",
    level: 3,
    type: "numeric",
    prompt:
      "A plant absorbs 12 g of water and releases 4 g. How many grams remain in the plant?",
    acceptedAnswers: ["8", "8.0"],
  },
  {
    id: "c2",
    level: 3,
    type: "choice",
    prompt: "Which gas do plants take in for photosynthesis?",
    options: ["Oxygen", "Nitrogen", "Carbon dioxide", "Hydrogen"],
    correctIndex: 2,
  },
  {
    id: "d1",
    level: 4,
    type: "numeric",
    prompt:
      "Light intensity doubles (×2). If sugar production was 6 g/hr at the old rate, what is it at the new rate? (Assume direct proportion.)",
    acceptedAnswers: ["12", "12.0"],
  },
  {
    id: "d2",
    level: 4,
    type: "choice",
    prompt: "Which best describes the role of chlorophyll?",
    options: [
      "Stores DNA",
      "Absorbs light energy",
      "Digests waste",
      "Builds the cell wall",
    ],
    correctIndex: 1,
  },
  {
    id: "e1",
    level: 5,
    type: "numeric",
    prompt:
      "A student mixes 1/3 L acid with 2/3 L water. What fraction of the mixture is acid? (Enter as a fraction.)",
    acceptedAnswers: ["1/3", "0.333", ".333"],
  },
  {
    id: "e2",
    level: 5,
    type: "choice",
    prompt: "Why does photosynthesis slow in very low light?",
    options: [
      "Chlorophyll stops existing",
      "Less light energy is available to drive the reaction",
      "Plants stop taking in water",
      "Oxygen becomes toxic",
    ],
    correctIndex: 1,
  },
];
