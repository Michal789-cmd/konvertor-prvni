(() => {
  const screens = Array.from(document.querySelectorAll(".screen"));
  const progressBar = document.getElementById("progressBar");

  const state = {
    history: ["intro"],
    answers: {},
    maxStep: 6
  };

  const getActive = () => document.querySelector(".screen.is-active");
  const setProgress = (step) => {
    const pct = Math.round((step - 1) / (state.maxStep - 1) * 100);
    progressBar.style.width = `${Math.max(0, Math.min(100, pct))}%`;
  };

  const show = (name, pushHistory = true) => {
    screens.forEach(s => s.classList.remove("is-active"));
    const target = document.querySelector(`.screen[data-screen="${name}"]`);
    if (!target) return;

    target.classList.add("is-active");
    const step = Number(target.dataset.step || 1);
    setProgress(step);

    if (pushHistory) {
      const last = state.history[state.history.length - 1];
      if (last !== name) state.history.push(name);
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // INTRO -> START
  document.addEventListener("click", (e) => {
    const go = e.target?.dataset?.go;
    if (go === "start") show("step1");
  });

  // BACK buttons
  document.addEventListener("click", (e) => {
    if (!e.target.hasAttribute("data-back")) return;
    state.history.pop(); // remove current
    const prev = state.history[state.history.length - 1] || "intro";
    show(prev, false);
  });

  // NEXT buttons
  document.addEventListener("click", (e) => {
    if (!e.target.hasAttribute("data-next")) return;
    const active = getActive()?.dataset?.screen;

    if (active === "step1") show("step2");
    if (active === "step2") show("step3");
    if (active === "step3") show("step4");
    if (active === "step4") show("final");
  });

  // Choice logic
  const bindChoice = (screenName, noteId, nextBtnSelector, messages) => {
    const screen = document.querySelector(`.screen[data-screen="${screenName}"]`);
    if (!screen) return;

    const note = document.getElementById(noteId);
    const nextBtn = screen.querySelector(nextBtnSelector);

    screen.addEventListener("click", (e) => {
      const choice = e.target?.dataset?.choice;
      if (!choice) return;

      state.answers[screenName] = choice;

      // UI: highlight selected
      screen.querySelectorAll("[data-choice]").forEach(btn => btn.classList.remove("btn--primary"));
      e.target.classList.add("btn--primary");

      // message
      note.textContent = messages[choice] || "";

      // enable next
      if (nextBtn) nextBtn.disabled = false;
    });
  };

  bindChoice("step1", "note1", '[data-next]', {
    ignore: "Hezký pokus… stejně bych tě nakonec našel. 😄",
    date: "Tohle bylo nejlepší rozhodnutí posledních 8 let. ❤️"
  });

  bindChoice("step2", "note2", '[data-next]', {
    run: "Naštěstí jsem neutekl. (I když někdy jsem se tvářil, že přemýšlím.) 😅",
    stay: "Zůstal jsem. A z domu se stal domov. ❤️"
  });

  bindChoice("step3", "note3", '[data-next]', {
    panic: "Lehká panika… a pak láska, kterou člověk nečeká. 😄",
    both: "Přesně. Chaos i štěstí. A všechno je to naše. 😅",
    joy: "Největší štěstí. A ty jsi v tom ten nejdůležitější člověk. ❤️"
  });

  bindChoice("step4", "note4", '[data-next]', {
    chaos: "Je to občas divoké… ale s tebou má i chaos smysl. 😄",
    worth: "Stojí to za to. Každý den. Díky tobě. ❤️"
  });

  // FINAL choice -> reveal final box + confetti
  const finalBox = document.getElementById("finalBox");
  const finalText = document.getElementById("finalText");
  const audioWrap = document.getElementById("audioWrap");
  const audioEl = document.getElementById("audioEl");
  const playAudio = document.getElementById("playAudio");

  const tryEnableAudio = () => {
    // If audio file exists it will play; if missing, keep hidden.
    audioEl.addEventListener("error", () => {
      audioWrap.hidden = true;
    }, { once: true });

    // Attempt to load; if the file is missing, error event triggers
    audioEl.load();
    audioWrap.hidden = false;
  };

  document.addEventListener("click", (e) => {
    const v = e.target?.dataset?.final;
    if (!v) return;

    finalBox.hidden = false;

    if (v === "yes1") {
      finalText.textContent =
        "A vždycky bych si vybral tebe. Děkuju, že jsi moje žena a máma našich dětí. ❤️";
    }
    if (v === "yes2") {
      finalText.textContent =
        "A milionkrát znovu. S tebou, s našima dětma, s tímhle naším životem. Miluju tě. ❤️";
    }

    // Optional audio
    tryEnableAudio();

    // confetti
    burstConfetti();

    // scroll to reveal
    finalBox.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  // Play audio button
  if (playAudio && audioEl) {
    playAudio.addEventListener("click", async () => {
      try {
        if (audioEl.paused) {
          await audioEl.play();
          playAudio.textContent = "⏸ Pozastavit";
        } else {
          audioEl.pause();
          playAudio.textContent = "▶ Pustit hlasovku";
        }
      } catch {
        // ignore autoplay restrictions; user click should work, but just in case
      }
    });

    audioEl.addEventListener("ended", () => {
      playAudio.textContent = "▶ Pustit hlasovku";
    });
  }

  // Close phone CTA
  const closePhoneBtn = document.getElementById("closePhone");
  if (closePhoneBtn) {
    closePhoneBtn.addEventListener("click", () => {
      alert("❤️");
    });
  }

  // Restart
  const restartBtn = document.getElementById("restart");
  if (restartBtn) {
    restartBtn.addEventListener("click", () => {
      // reset notes + buttons
      ["step1","step2","step3","step4"].forEach(name => {
        const s = document.querySelector(`.screen[data-screen="${name}"]`);
        if (!s) return;
        s.querySelectorAll("[data-choice]").forEach(b => b.classList.remove("btn--primary"));
        const next = s.querySelector("[data-next]");
        if (next) next.disabled = true;
      });

      document.getElementById("note1").textContent = "";
      document.getElementById("note2").textContent = "";
      document.getElementById("note3").textContent = "";
      document.getElementById("note4").textContent = "";

      finalBox.hidden = true;
      if (audioEl) { audioEl.pause(); audioEl.currentTime = 0; }
      if (playAudio) playAudio.textContent = "▶ Pustit hlasovku";

      state.history = ["intro"];
      state.answers = {};
      show("intro", false);
    });
  }

  // Confetti (tiny, dependency-free)
  const canvas = document.getElementById("confetti");
  const ctx = canvas?.getContext("2d");
  let confettiPieces = [];
  let confettiTimer = null;

  function resizeCanvas() {
    if (!canvas) return;
    const active = getActive();
    if (!active) return;
    const rect = active.getBoundingClientRect();
    canvas.width = Math.floor(rect.width * devicePixelRatio);
    canvas.height = Math.floor(rect.height * devicePixelRatio);
    canvas.style.width = rect.width + "px";
    canvas.style.height = rect.height + "px";
    if (ctx) ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
  }

  function burstConfetti() {
    if (!canvas || !ctx) return;
    resizeCanvas();

    confettiPieces = Array.from({ length: 120 }, () => ({
      x: Math.random() * canvas.clientWidth,
      y: -10 - Math.random() * 200,
      r: 3 + Math.random() * 4,
      vy: 2 + Math.random() * 4,
      vx: -1.5 + Math.random() * 3,
      rot: Math.random() * Math.PI,
      vr: (-0.2 + Math.random() * 0.4)
    }));

    const start = performance.now();
    const duration = 2200;

    const tick = (t) => {
      const elapsed = t - start;
      ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);

      confettiPieces.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vr;

        // no explicit colors requested; keep default black? we’ll draw using current fillStyle variants
        // We can vary using alpha via HSL without "specific colors" in a chart sense; here it's visual effect.
        const hue = (p.x + p.y) % 360;
        ctx.fillStyle = `hsla(${hue}, 90%, 60%, .85)`;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillRect(-p.r, -p.r, p.r * 2, p.r * 2);
        ctx.restore();
      });

      if (elapsed < duration) {
        requestAnimationFrame(tick);
      } else {
        ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
      }
    };

    requestAnimationFrame(tick);

    clearTimeout(confettiTimer);
    confettiTimer = setTimeout(() => {
      if (ctx) ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
    }, duration + 200);
  }

  window.addEventListener("resize", resizeCanvas);

  // Init
  show("intro", false);
})();
