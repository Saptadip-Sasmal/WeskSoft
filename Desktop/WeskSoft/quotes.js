// ===== World's best CEOs — motivational quotes (30 cards, scroll এ একে একে আসে) =====
// নতুন কার্ড যোগ/বদলাতে শুধু নিচের তালিকা এডিট করুন। সংখ্যা ৫-এর গুণিতক হলে গ্রিড সুন্দর ভরে।
(function () {
  const grid = document.getElementById("quoteGrid");
  if (!grid) return;

  const DATA = [
    ["The only way to do great work is to love what you do.", "Steve Jobs", "Co-founder, Apple"],
    ["Success is a lousy teacher. It seduces smart people into thinking they can't lose.", "Bill Gates", "Co-founder, Microsoft"],
    ["We are stubborn on vision. We are flexible on details.", "Jeff Bezos", "Founder, Amazon"],
    ["When something is important enough, you do it even if the odds are not in your favor.", "Elon Musk", "CEO, Tesla & SpaceX"],
    ["It takes 20 years to build a reputation and five minutes to ruin it.", "Warren Buffett", "Chairman, Berkshire Hathaway"],

    ["Our industry does not respect tradition — it only respects innovation.", "Satya Nadella", "CEO, Microsoft"],
    ["Wear your failure as a badge of honor.", "Sundar Pichai", "CEO, Google"],
    ["Never give up. Today is hard, tomorrow will be worse, but the day after tomorrow will be sunshine.", "Jack Ma", "Co-founder, Alibaba"],
    ["The biggest risk is not taking any risk.", "Mark Zuckerberg", "CEO, Meta"],
    ["Always deliver more than expected.", "Larry Page", "Co-founder, Google"],

    ["Greatness is not intelligence. Greatness comes from character.", "Jensen Huang", "CEO, NVIDIA"],
    ["Just because you are CEO, don't think you have landed. You must continually increase your learning.", "Indra Nooyi", "Former CEO, PepsiCo"],
    ["Business opportunities are like buses, there's always another one coming.", "Richard Branson", "Founder, Virgin Group"],
    ["Success is best when it's shared.", "Howard Schultz", "Former CEO, Starbucks"],
    ["All our dreams can come true, if we have the courage to pursue them.", "Walt Disney", "Co-founder, The Walt Disney Company"],

    ["Whether you think you can, or you think you can't — you're right.", "Henry Ford", "Founder, Ford Motor Company"],
    ["I don't believe in taking right decisions. I take decisions and then make them right.", "Ratan Tata", "Chairman Emeritus, Tata Sons"],
    ["Performance leads to recognition. Recognition brings respect. Respect enhances power.", "N. R. Narayana Murthy", "Co-founder, Infosys"],
    ["High expectations are the key to everything.", "Sam Walton", "Founder, Walmart"],
    ["When you become a leader, success is all about growing others.", "Jack Welch", "Former CEO, General Electric"],

    ["Only the paranoid survive.", "Andy Grove", "Former CEO, Intel"],
    ["Management is nothing more than motivating other people.", "Lee Iacocca", "Former CEO, Chrysler"],
    ["Success represents the 1% of your work which results from the 99% that is called failure.", "Soichiro Honda", "Founder, Honda"],
    ["I didn't get there by wishing for it or hoping for it, but by working for it.", "Estée Lauder", "Founder, Estée Lauder Companies"],
    ["You don't have to be a genius or a visionary or even a college graduate to be successful. You just need a framework and a dream.", "Michael Dell", "Founder & CEO, Dell Technologies"],

    ["Chase the vision, not the money; the money will end up following you.", "Tony Hsieh", "Former CEO, Zappos"],
    ["The cowards never started and the weak died along the way. That leaves us.", "Phil Knight", "Co-founder, Nike"],
    ["Press on. Nothing in the world can take the place of persistence.", "Ray Kroc", "Founder, McDonald's Corporation"],
    ["The riskiest thing we can do is just maintain the status quo.", "Bob Iger", "Longtime CEO, The Walt Disney Company"],
    ["If you give a mediocre idea to a brilliant team, they will either fix it or throw it away and come up with something better.", "Ed Catmull", "Co-founder, Pixar"],
  ];

  const frag = document.createDocumentFragment();
  DATA.forEach(([quote, name, role], i) => {
    const card = document.createElement("article");
    card.className = "qcard";

    const top = document.createElement("div");
    top.className = "qcard-top";
    const mark = document.createElement("span");
    mark.className = "qmark";
    mark.setAttribute("aria-hidden", "true");
    mark.textContent = "“";
    const num = document.createElement("span");
    num.className = "qnum";
    num.textContent = String(i + 1).padStart(2, "0");
    top.append(mark, num);

    const text = document.createElement("p");
    text.className = "qtext";
    text.textContent = quote;

    const who = document.createElement("div");
    who.className = "qauthor";
    const n = document.createElement("strong");
    n.textContent = name;
    const r = document.createElement("span");
    r.textContent = role;
    who.append(n, r);

    card.append(top, text, who);
    frag.appendChild(card);
  });
  grid.appendChild(frag);

  const cards = Array.from(grid.children);

  // ===== স্ক্রল করলে একে একে ভেসে ওঠা =====
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const idx = cards.indexOf(e.target);
        e.target.style.transitionDelay = (idx % 5) * 0.07 + "s";
        e.target.classList.add("in");
        io.unobserve(e.target);
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
  );
  cards.forEach((c) => io.observe(c));

  // ===== হোভারে মাউসের সঙ্গে চলা আলো (শুধু ডেস্কটপে) =====
  if (window.matchMedia("(hover: hover)").matches) {
    cards.forEach((c) => {
      c.addEventListener("mousemove", (e) => {
        const b = c.getBoundingClientRect();
        c.style.setProperty("--mx", e.clientX - b.left + "px");
        c.style.setProperty("--my", e.clientY - b.top + "px");
      });
    });
  }
})();