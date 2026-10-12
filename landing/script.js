// 4chits landing page interactivity
// -----------------------------------------------------------------
// 1) Chit unfold demo (purely visual, no game logic lives here)
// 2) Alpha signup form submission
// -----------------------------------------------------------------

document.getElementById("year").textContent = new Date().getFullYear();

// ---- Chit demo ----
const chitStack = document.getElementById("chitStack");
const shuffleBtn = document.getElementById("shuffleBtn");

function resetChits() {
  chitStack.querySelectorAll(".chit").forEach((chit) => {
    chit.classList.remove("revealed");
    chit.textContent = "?";
    chit.setAttribute("aria-label", "Hidden chit, tap to reveal");
  });
}

function revealChit(chit) {
  if (chit.classList.contains("revealed")) return;
  const role = chit.dataset.role;
  const points = chit.dataset.points;
  chit.classList.add("revealed");
  chit.innerHTML = `${role}<span class="chit-points">${points} pts</span>`;
  chit.setAttribute("aria-label", `${role}, worth ${points} points`);
}

chitStack.addEventListener("click", (event) => {
  const chit = event.target.closest(".chit");
  if (!chit) return;
  revealChit(chit);
});

shuffleBtn.addEventListener("click", resetChits);

// ---- Alpha signup form ----
// NOTE: Replace FORM_ENDPOINT with your real Formspree (or other form backend)
// endpoint once you've created one at https://formspree.io (free tier works fine).
// Until then, submissions will show a friendly "coming soon" message instead
// of silently failing.
const FORM_ENDPOINT = "https://formspree.io/f/moejnywd";

const alphaForm = document.getElementById("alphaForm");
const formStatus = document.getElementById("formStatus");

alphaForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const emailInput = document.getElementById("alphaEmail");
  const email = emailInput.value.trim();

  formStatus.classList.remove("success", "error");

  if (!email) {
    formStatus.textContent = "Enter your email to join the alpha.";
    formStatus.classList.add("error");
    return;
  }

  if (FORM_ENDPOINT.includes("REPLACE_ME")) {
    // Form backend not configured yet — tell the site owner, not the visitor.
    formStatus.textContent = "Thanks! (Signup backend isn't wired up yet — see script.js)";
    formStatus.classList.add("success");
    console.warn("[4chits] Set FORM_ENDPOINT in script.js to a real Formspree (or similar) URL to start collecting signups.");
    return;
  }

  const submitBtn = alphaForm.querySelector("button[type='submit']");
  submitBtn.disabled = true;
  formStatus.textContent = "Sending...";

  try {
    const response = await fetch(FORM_ENDPOINT, {
      method: "POST",
      headers: { Accept: "application/json" },
      body: new FormData(alphaForm),
    });

    if (response.ok) {
      formStatus.textContent = "You're on the list! Watch your inbox.";
      formStatus.classList.add("success");
      alphaForm.reset();
    } else {
      throw new Error("Form submission failed");
    }
  } catch (err) {
    formStatus.textContent = "Something went wrong. Please try again.";
    formStatus.classList.add("error");
  } finally {
    submitBtn.disabled = false;
  }
});
