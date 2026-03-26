(() => {
  const CHOICE_SELECTOR = ".quiz-room__choices .quiz-choice-slot";
  const SHUFFLE_CONTAINER = ".quiz-room__choices--shuffle";
  const pageId = location.pathname.split("/").pop() || "quiz";

  /** Strip "A. " … "D. " prefix so we can re-label after shuffle */
  const stripChoiceLabel = (text) => String(text).replace(/^[A-D]\.\s*/i, "").trim();

  const shuffleInPlace = (arr) => {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  /** Randomize order of the four answer buttons; re-label A–D */
  const shuffleQuizChoices = () => {
    const container = document.querySelector(SHUFFLE_CONTAINER);
    if (!container) return;

    const slots = Array.from(container.querySelectorAll(".quiz-choice-slot"));
    if (slots.length !== 4) return;

    const items = slots.map((el) => ({
      el,
      body: stripChoiceLabel(el.textContent),
      correct: el.dataset.correct === "true",
    }));

    shuffleInPlace(items);

    items.forEach((item, i) => {
      const letter = String.fromCharCode(65 + i);
      item.el.textContent = `${letter}. ${item.body}`;
      if (item.correct) item.el.setAttribute("data-correct", "true");
      else item.el.removeAttribute("data-correct");
      container.appendChild(item.el);
    });
  };

  const saveSelection = (choiceText, isCorrect) => {
    let answers = {};
    try {
      answers = JSON.parse(sessionStorage.getItem("quizAnswers") || "{}");
    } catch {
      answers = {};
    }
    answers[pageId] = { choice: choiceText, correct: Boolean(isCorrect) };
    sessionStorage.setItem("quizAnswers", JSON.stringify(answers));
  };

  const goNext = () => {
    const links = Array.from(document.querySelectorAll(".quiz-nav a"));
    const current = pageId.toLowerCase();
    const nextLink =
      links.find((a) => /next|finish/i.test((a.textContent || "").trim())) ||
      links.find((a) => {
        const href = (a.getAttribute("href") || "").toLowerCase();
        return href.startsWith("quiz") && !href.includes(current);
      });

    if (nextLink?.href) {
      window.location.href = nextLink.href;
    }
  };

  const choose = (slot, slots) => {
    slots.forEach((item) => {
      item.classList.remove("is-selected");
      item.setAttribute("aria-pressed", "false");
    });

    slot.classList.add("is-selected");
    slot.setAttribute("aria-pressed", "true");

    const isCorrect = slot.dataset.correct === "true";
    saveSelection(slot.textContent?.trim() || "", isCorrect);

    window.setTimeout(goNext, 240);
  };

  window.addEventListener("DOMContentLoaded", () => {
    shuffleQuizChoices();

    const slots = Array.from(document.querySelectorAll(CHOICE_SELECTOR));
    if (!slots.length) return;

    slots.forEach((slot) => {
      slot.setAttribute("role", "button");
      slot.setAttribute("tabindex", "0");
      slot.setAttribute("aria-pressed", "false");
      slot.addEventListener("click", () => choose(slot, slots));
      slot.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          choose(slot, slots);
        }
      });
    });
  });
})();
