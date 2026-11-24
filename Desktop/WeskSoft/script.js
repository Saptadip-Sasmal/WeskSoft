// ===== রিফ্রেশে সবসময় উপর থেকে শুরু =====
if ("scrollRestoration" in history) history.scrollRestoration = "manual";
window.addEventListener("load", () => window.scrollTo(0, 0));
window.addEventListener("pageshow", (e) => { if (e.persisted) window.scrollTo(0, 0); });

// ===== Footer year =====
document.getElementById("year").textContent = new Date().getFullYear();

// ===== Back-to-top =====
const toTop = document.getElementById("toTop");

let ticking = false;
function onScroll() {
  const y = window.scrollY;
  toTop.classList.toggle("show", y > 500);
  ticking = false;
}
window.addEventListener("scroll", () => {
  if (!ticking) {
    requestAnimationFrame(onScroll);
    ticking = true;
  }
});
onScroll();

toTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

// ===== Reveal on scroll =====
const io = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add("visible");
        io.unobserve(e.target);
      }
    });
  },
  { threshold: 0.15 }
);
document.querySelectorAll(".reveal").forEach((el, i) => {
  el.style.transitionDelay = (i % 3) * 0.12 + "s";
  io.observe(el);
});