/* ==========================================================================
   Diyah Solutions: site interactions (vanilla JS, no dependencies)
   ========================================================================== */
(function () {
  "use strict";

  /* ---------------------------------------------------------------------
     SETTINGS: edit in ONE place
     --------------------------------------------------------------------- */
  const CONTACT = {
    email: "diyahsolutions@gmail.com",
    whatsapp: "2347088202285", // international format, digits only
    waMessage: "Hi Diyah Solutions! I found your website and I'd like to talk about automating my CRM."
  };

  const BOOKING = {
    // Where form submissions go. Leave "" to send by WhatsApp / email (works today).
    // Paste a GoHighLevel Inbound Webhook URL, a Formspree URL or a Web3Forms URL to
    // capture leads straight into your CRM. See README > "Lead capture".
    leadEndpoint: "",
    // Your calendar link (GoHighLevel calendar, Calendly...). When set, the booking
    // flow offers "Pick an exact time" with the visitor's name and email pre-filled.
    bookingUrl: "",
    popupDelay: 400,       // ms after the intro animation before the pop-up opens
    cooldownDays: 0        // after closing it, wait this many days before auto-opening again (0 = every new visit)
  };

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const root = document.documentElement;
  const store = {
    get(k, s = localStorage) { try { return s.getItem(k); } catch (e) { return null; } },
    set(k, v, s = localStorage) { try { s.setItem(k, v); } catch (e) {} }
  };
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const ICON = {
    check: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>',
    arrow: '<svg class="icon arrow" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></svg>',
    back: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H5"/><path d="m11 18-6-6 6-6"/></svg>',
    wa: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9z"/></svg>',
    mail: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="2" y="4" width="20" height="16" rx="3"/><path d="m22 7-10 6L2 7"/></svg>',
    cal: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>',
    lock: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>',
    globe: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></svg>'
  };

  /* ---------------------------------------------------------------------
     Theme toggle (initial theme is set inline in <head> to avoid a flash)
     --------------------------------------------------------------------- */
  function setTheme(t) {
    root.setAttribute("data-theme", t);
    store.set("diyah-theme", t);
    $$(".theme-toggle").forEach(b => {
      b.setAttribute("aria-label", t === "dark" ? "Switch to light mode" : "Switch to dark mode");
      const l = $(".tt-label", b); if (l) l.textContent = t === "dark" ? "Light mode" : "Dark mode";
    });
    const meta = $('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", t === "dark" ? "#050a18" : "#f6f8fd");
  }
  $$(".theme-toggle").forEach(btn => btn.addEventListener("click", () => setTheme(root.getAttribute("data-theme") === "light" ? "dark" : "light")));
  setTheme(root.getAttribute("data-theme") || "dark");

  /* ---------------------------------------------------------------------
     Intro animation: once per visit, then hands over to the pop-up
     --------------------------------------------------------------------- */
  (function playIntro() {
    const el = $(".intro");
    if (!el || !root.classList.contains("show-intro")) return;
    store.set("diyah-intro", "1", sessionStorage);
    const finish = () => {
      el.classList.add("leave");
      setTimeout(() => {
        root.classList.remove("show-intro");
        document.dispatchEvent(new CustomEvent("diyah:intro-done"));
      }, 750);
    };
    const t = setTimeout(finish, 2700);
    el.addEventListener("click", () => { clearTimeout(t); finish(); }, { once: true }); // tap to skip
  })();

  /* ---------------------------------------------------------------------
     Page transition veil
     --------------------------------------------------------------------- */
  const veil = document.createElement("div");
  veil.className = "veil";
  document.body.appendChild(veil);
  document.addEventListener("click", e => {
    const a = e.target.closest("a");
    if (!a || reduceMotion || e.defaultPrevented) return;
    if (a.closest("[data-open-booking], [data-case-link]")) return; // these open the pop-up / a case study instead
    const href = a.getAttribute("href");
    if (!href || href.startsWith("#") || a.target === "_blank" || a.hasAttribute("download") ||
        e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin || /^(mailto|tel)/.test(href)) return;
    if (url.pathname === location.pathname && url.hash) return;
    e.preventDefault();
    veil.classList.add("on");
    setTimeout(() => { location.href = a.href; }, 260);
  });
  window.addEventListener("pageshow", ev => { if (ev.persisted) veil.classList.remove("on"); });

  /* ---------------------------------------------------------------------
     Header: border on scroll, hide on scroll down
     --------------------------------------------------------------------- */
  const header = $(".site-header");
  let lastY = window.scrollY;
  function onScroll() {
    const y = window.scrollY;
    if (header) {
      header.classList.toggle("is-scrolled", y > 10);
      const menuOpen = document.body.classList.contains("menu-open");
      if (!menuOpen && y > 520 && y > lastY + 4) header.classList.add("is-hidden");
      if (y < lastY - 4 || y < 520) header.classList.remove("is-hidden");
    }
    lastY = y;
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* Mobile menu */
  const menuBtn = $(".menu-toggle");
  function closeMenu() { document.body.classList.remove("menu-open"); if (menuBtn) menuBtn.setAttribute("aria-expanded", "false"); }
  if (menuBtn) {
    menuBtn.addEventListener("click", () => {
      const open = !document.body.classList.contains("menu-open");
      document.body.classList.toggle("menu-open", open);
      menuBtn.setAttribute("aria-expanded", String(open));
    });
    $$(".mobile-nav a").forEach(a => a.addEventListener("click", closeMenu));
    document.addEventListener("keydown", e => { if (e.key === "Escape") closeMenu(); });
  }

  /* ---------------------------------------------------------------------
     Reveal on scroll + stagger groups
     --------------------------------------------------------------------- */
  $$("[data-stagger]").forEach(group => {
    $$(":scope > *", group).forEach((el, i) => {
      if (!el.hasAttribute("data-reveal")) el.setAttribute("data-reveal", group.dataset.stagger || "");
      el.style.setProperty("--i", i);
    });
  });
  const revealEls = $$("[data-reveal]");
  if ("IntersectionObserver" in window && !reduceMotion) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
    }, { rootMargin: "0px 0px -6% 0px", threshold: 0.06 });
    revealEls.forEach(el => io.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add("in"));
  }

  /* ---------------------------------------------------------------------
     Rail: stages light up as you scroll through "What we automate"
     --------------------------------------------------------------------- */
  const rail = $("[data-rail]");
  if (rail) {
    const stages = $$(".stage", rail);
    const update = () => {
      const r = rail.getBoundingClientRect();
      const mid = innerHeight * 0.55;
      const p = Math.max(0, Math.min(1, (mid - r.top) / r.height));
      rail.style.setProperty("--rail-fill", (p * 100).toFixed(1) + "%");
      stages.forEach(s => s.classList.toggle("is-on", s.getBoundingClientRect().top < mid));
    };
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    update();
  }

  /* ---------------------------------------------------------------------
     Hero pipeline board: leads move across stages; switch CRM label set
     --------------------------------------------------------------------- */
  const board = $("[data-board]");
  if (board) {
    const CRMS = {
      ghl: {
        cols: ["New lead", "Contacted", "Qualified", "Booked"],
        log: ["Workflow “Speed to lead”: SMS + email sent", "Opportunity moved → Qualified", "Calendar booking confirmed + reminders set", "New lead captured → owner assigned", "Missed call → text-back sent"]
      },
      hubspot: {
        cols: ["New", "Attempted", "Qualified", "Meeting booked"],
        log: ["Contact enrolled in sequence", "Deal stage → Qualified", "Meeting booked via scheduling link", "Form submission → owner rotated", "Task created for sales rep"]
      },
      zoho: {
        cols: ["New", "Contacted", "Qualified", "Booked"],
        log: ["Workflow rule: welcome email sent", "Blueprint transition → Qualified", "Zoho Bookings: appointment confirmed", "Lead assignment rule → owner set", "Zoho Flow → lead synced"]
      }
    };
    const SOURCES = ["Facebook lead form", "Website form", "Website chat", "Missed call", "Google Ads", "Referral"];
    const NAMES = ["Ada N.", "Tom W.", "Grace K.", "Daniel M.", "Ife O.", "Maria L.", "Sam B.", "Nora H.", "Kofi A.", "Ella J."];
    const NEXT = ["SMS + email sent", "Qualified by AI", "Thu · 2:30 PM"];
    let crm = "ghl", tick = 0, nameI = 0;
    const cols = $$(".board-col", board);
    const log = $(".board-log", board);
    const time = () => new Date().toTimeString().slice(0, 8);

    function addLog(text, ok) {
      const p = document.createElement("p");
      p.innerHTML = `<time>${time()}</time><span${ok ? ' class="ok"' : ""}>${esc(text)}</span>`;
      log.appendChild(p);
      while (log.children.length > 3) log.firstElementChild.remove();
    }
    function counts() { cols.forEach(c => { $("h5 i", c).textContent = $$(".lead-card", c).length; }); }
    function setCrm(k) {
      crm = k;
      $$(".crm-switch button", board).forEach(b => b.setAttribute("aria-pressed", String(b.dataset.crm === k)));
      cols.forEach((c, i) => { $("h5 span", c).textContent = CRMS[k].cols[i]; });
      addLog(`Running in ${$(`[data-crm="${k}"]`, board).textContent}`, true);
    }
    $$(".crm-switch button", board).forEach(b => b.addEventListener("click", () => setCrm(b.dataset.crm)));

    function step() {
      // move the oldest card in a random non-empty column (not the last) one stage right
      let from = [2, 1, 0][tick % 3];
      for (let k = 0; k < 3 && !$(".lead-card", cols[from]); k++) from = (from + 2) % 3;
      const card = $$(".lead-card", cols[from])[0];
      const L = CRMS[crm].log;
      if (card) {
        card.classList.add("is-moving");
        setTimeout(() => {
          card.classList.remove("is-moving");
          $("span", card).textContent = NEXT[from];
          card.classList.remove("enter"); void card.offsetWidth; card.classList.add("enter");
          cols[from + 1].insertBefore(card, $(".lead-card", cols[from + 1]));
          const extra = $$(".lead-card", cols[from + 1]);
          if (extra.length > 3) extra[extra.length - 1].remove();
          counts();
          addLog(L[from], from === 2);
        }, 700);
      }
      if (tick % 3 === 2) { // a fresh lead arrives
        const c = document.createElement("div");
        c.className = "lead-card enter";
        c.innerHTML = `<b>${NAMES[nameI++ % NAMES.length]}</b><span>${SOURCES[tick % SOURCES.length]}</span>`;
        cols[0].insertBefore(c, $(".lead-card", cols[0]));
        const extra = $$(".lead-card", cols[0]);
        if (extra.length > 3) extra[extra.length - 1].remove();
        counts();
        setTimeout(() => addLog(L[3]), 900);
      }
      tick++;
    }
    if (!reduceMotion) {
      let timer = null, visible = false;
      const run = () => { clearInterval(timer); timer = setInterval(() => { if (visible && !document.hidden) step(); }, 2200); };
      new IntersectionObserver(([en]) => { visible = en.isIntersecting; }, { threshold: .2 }).observe(board);
      run();
    }
  }

  /* ---------------------------------------------------------------------
     FAQ: smooth open/close for <details>
     --------------------------------------------------------------------- */
  $$("details.faq").forEach(d => {
    const summary = $("summary", d), body = $(".faq-body", d);
    if (!summary || !body || reduceMotion) return;
    summary.addEventListener("click", e => {
      e.preventDefault();
      if (d.open) {
        body.animate([{ height: body.scrollHeight + "px", opacity: 1 }, { height: "0px", opacity: 0 }], { duration: 340, easing: "cubic-bezier(.65,0,.35,1)" }).onfinish = () => { d.open = false; };
      } else {
        d.open = true;
        body.animate([{ height: "0px", opacity: 0 }, { height: body.scrollHeight + "px", opacity: 1 }], { duration: 460, easing: "cubic-bezier(.16,1,.3,1)" });
      }
    });
  });

  /* ---------------------------------------------------------------------
     Lead delivery: endpoint (CRM webhook / Formspree) or WhatsApp / email
     --------------------------------------------------------------------- */
  function composeText(title, rows, note) {
    return [title, "", ...rows.filter(r => r[1]).map(([k, v]) => `${k}: ${v}`), note ? `\n${note}` : ""].join("\n").trim();
  }
  async function postLead(payload) {
    if (!BOOKING.leadEndpoint) return false;
    try {
      const res = await fetch(BOOKING.leadEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload)
      });
      return res.ok;
    } catch (e) { return false; }
  }
  function openWhatsApp(text) { window.open(`https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent(text)}`, "_blank", "noopener"); }
  function openEmail(subject, text) { location.href = `mailto:${CONTACT.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`; }

  /* ---------------------------------------------------------------------
     Discovery-call flow (used in the pop-up AND on the contact page)
     --------------------------------------------------------------------- */
  const GOALS = [
    { v: "leads", t: "Capture & manage leads", s: "Forms, routing, lead scoring" },
    { v: "followup", t: "Automate follow-up & email", s: "Sequences, nurture, email marketing" },
    { v: "fix", t: "Fix or clean up my CRM", s: "Broken workflows, messy data" },
    { v: "build", t: "Set up a CRM system properly", s: "New build or migration" },
    { v: "integrate", t: "Connect my tools", s: "Zapier, Make, APIs, AI" },
    { v: "unsure", t: "Not sure yet", s: "Let’s work it out together" }
  ];
  const CRMS_LIST = ["GoHighLevel", "HubSpot", "Zoho CRM", "Follow Up Boss", "Other", "No CRM yet"];
  const INSIGHT = {
    followup: "Follow-up automation is our most requested build, and usually the fastest win.",
    leads: "Good call. Most lost revenue starts in the first hour after a lead comes in.",
    fix: "We untangle messy CRMs every week. You’re in good hands.",
    build: "A proper foundation now saves months of patching later.",
    integrate: "We’ll get your tools talking so nothing is copied by hand again.",
    unsure: "That’s what the call is for. We’ll map it out together."
  };
  const WINDOWS = [{ v: "Morning", s: "9am to 12pm" }, { v: "Afternoon", s: "12pm to 4pm" }, { v: "Evening", s: "4pm to 7pm" }];
  const goalLabel = v => (GOALS.find(g => g.v === v) || {}).t || v;
  const tz = (() => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone || ""; } catch (e) { return ""; } })();

  function nextWeekdays(n) {
    const out = []; const d = new Date(); d.setHours(12, 0, 0, 0);
    while (out.length < n) { d.setDate(d.getDate() + 1); const w = d.getDay(); if (w !== 0 && w !== 6) out.push(new Date(d)); }
    return out;
  }

  let flowCount = 0;
  function LeadFlow(host, opts = {}) {
    const P = "lf" + (++flowCount);
    const KEY = "diyah-flow";
    let state = { step: 0, goals: [], crm: "", crmOther: "", name: "", email: "", business: "", phone: "", notes: "", day: "", window: "", context: "" };
    try { Object.assign(state, JSON.parse(store.get(KEY, sessionStorage) || "{}"), { step: 0 }); } catch (e) {}
    const save = () => store.set(KEY, JSON.stringify(state), sessionStorage);
    const first = () => (state.name.trim().split(/\s+/)[0] || "");
    const TOTAL = 4; // steps with a progress bar (review & done come after)
    let dir = 1;

    host.innerHTML = `
      <div class="flow">
        <div class="flow-top">
          <div class="flow-meta"><span class="fm-step"></span><span>Free 30-min discovery call</span></div>
          <div class="flow-steps" aria-hidden="true">${"<i></i>".repeat(TOTAL)}</div>
        </div>
        <div class="flow-stage" aria-live="polite"></div>
        <div class="flow-foot">${ICON.lock}<span>No spam, no obligation. We reply within one business day.</span></div>
      </div>`;
    const stage = $(".flow-stage", host);
    const bars = $$(".flow-steps i", host);
    const meta = $(".fm-step", host);

    const opt = (o, sel, role, simple) => `<button type="button" class="opt${role === "radio" ? " radio" : ""}${simple ? " simple" : ""}" role="${role}" aria-checked="${sel}" data-v="${esc(o.v)}"><span class="box">${ICON.check}</span><b>${esc(o.t || o.v)}</b>${o.s ? `<small>${esc(o.s)}</small>` : ""}</button>`;
    const nav = (canBack, label, extra = "") => `<div class="flow-nav"><button type="button" class="flow-back" data-back ${canBack ? "" : "hidden"}>${ICON.back} Back</button>${extra}<button type="button" class="btn btn-primary" data-next>${label} ${ICON.arrow}</button></div>`;

    const VIEWS = [
      // 0: goals
      () => `<div class="flow-pane">
          <h3 id="${opts.titleId || ""}">What should your CRM be doing for you?</h3>
          <p class="sub">Pick everything that applies. It takes about a minute.</p>
          <div class="opts" role="group" aria-label="Goals">${GOALS.map(g => opt(g, state.goals.includes(g.v), "checkbox")).join("")}</div>
          ${nav(false, "Continue")}
        </div>`,
      // 1: crm
      () => `<div class="flow-pane">
          <h3>Which CRM are you using today?</h3>
          <p class="sub">No need to switch. We automate the one you already have.</p>
          <div class="opts cols-3" role="radiogroup" aria-label="Current CRM">${CRMS_LIST.map(c => opt({ v: c }, state.crm === c, "radio", true)).join("")}</div>
          <div class="field" ${state.crm === "Other" ? "" : "hidden"} data-other><label for="${P}-crm-other">Which one?</label><input id="${P}-crm-other" name="crmOther" value="${esc(state.crmOther)}" placeholder="e.g. Salesforce, Pipedrive, Keap"></div>
          ${nav(true, "Continue")}
        </div>`,
      // 2: details
      () => {
        const g = state.goals.find(x => INSIGHT[x]);
        return `<div class="flow-pane">
          <h3>${g ? esc(INSIGHT[g]) : "Great. Where should we send the details?"}</h3>
          <p class="sub">Tell us who you are and we&rsquo;ll come prepared.</p>
          <div class="fields">
            <div class="field"><label for="${P}-name">Your name</label><input id="${P}-name" name="name" autocomplete="name" value="${esc(state.name)}" required><span class="err">Please add your name.</span></div>
            <div class="field"><label for="${P}-email">Work email</label><input id="${P}-email" name="email" type="email" autocomplete="email" value="${esc(state.email)}" required><span class="err">Please add a valid email.</span></div>
            <div class="field"><label for="${P}-biz">Business or website <small>Optional</small></label><input id="${P}-biz" name="business" autocomplete="organization" value="${esc(state.business)}"></div>
            <div class="field"><label for="${P}-phone">Phone / WhatsApp <small>Optional</small></label><input id="${P}-phone" name="phone" type="tel" autocomplete="tel" value="${esc(state.phone)}"></div>
            <div class="field full"><label for="${P}-notes">Anything we should know? <small>Optional</small></label><textarea id="${P}-notes" name="notes" rows="3" placeholder="e.g. Leads from Facebook aren't getting followed up">${esc(state.notes)}</textarea></div>
          </div>
          ${nav(true, "Continue")}
        </div>`;
      },
      // 3: time
      () => {
        const days = nextWeekdays(5);
        const cal = BOOKING.bookingUrl ? `<button type="button" class="btn btn-ghost w-full" data-calendar>${ICON.cal} Pick an exact time in our calendar</button><p class="tz-note">Or tell us what generally suits you:</p>` : "";
        return `<div class="flow-pane">
          <h3>When suits you for a quick call${first() ? `, ${esc(first())}` : ""}?</h3>
          <p class="sub">Choose a day and a time window. We&rsquo;ll confirm an exact slot in your time zone.</p>
          ${cal}
          <div class="days" role="radiogroup" aria-label="Preferred day">${days.map(d => {
            const v = d.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" });
            return `<button type="button" class="day-btn" role="radio" aria-pressed="${state.day === v}" aria-checked="${state.day === v}" data-day="${esc(v)}"><small>${d.toLocaleDateString(undefined, { weekday: "short" })}</small><b>${d.getDate()}</b><small>${d.toLocaleDateString(undefined, { month: "short" })}</small></button>`;
          }).join("")}</div>
          <div class="opts cols-3" role="radiogroup" aria-label="Preferred time">${WINDOWS.map(w => opt({ v: w.v, s: w.s }, state.window === w.v, "radio")).join("")}</div>
          ${tz ? `<p class="tz-note">${ICON.globe} Times shown for ${esc(tz.replace(/_/g, " "))}</p>` : ""}
          ${nav(true, "Review my request")}
        </div>`;
      },
      // 4: review & send
      () => {
        const rows = summaryRows();
        const sendBtns = BOOKING.leadEndpoint
          ? `<button type="button" class="btn btn-primary btn-lg w-full" data-submit>Confirm my discovery call ${ICON.arrow}</button>`
          : `<div class="send-row"><button type="button" class="btn btn-primary btn-lg" data-send="whatsapp">${ICON.wa} Send on WhatsApp</button><button type="button" class="btn btn-ghost btn-lg" data-send="email">${ICON.mail} Send by email</button></div>`;
        return `<div class="flow-pane">
          <h3>Here&rsquo;s your request${first() ? `, ${esc(first())}` : ""}.</h3>
          <p class="sub">${BOOKING.leadEndpoint ? "Check the details, then confirm." : "Check the details, then send it in one tap. Your message is written for you."}</p>
          <dl class="summary">${rows.filter(r => r[1]).map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join("")}</dl>
          ${sendBtns}
          <div class="flow-nav"><button type="button" class="flow-back" data-back>${ICON.back} Edit</button><span class="flow-hint">Step 5 of 5</span></div>
        </div>`;
      },
      // 5: done
      () => `<div class="flow-pane flow-done">
          <span class="ok-ring">${ICON.check}</span>
          <h3>You&rsquo;re on the calendar list${first() ? `, ${esc(first())}` : ""}.</h3>
          <p class="sub">${BOOKING.leadEndpoint ? "We’ve received your request" : "Once you hit send, we’ll have your request"} and will confirm an exact time within one business day. In the meantime, have a look at some recent builds.</p>
          <div class="btn-row" style="justify-content:center"><a class="btn btn-ghost" href="portfolio.html">See case studies</a>${opts.inModal ? '<button type="button" class="btn btn-primary" data-dc-close>Done</button>' : ""}</div>
        </div>`
    ];

    function summaryRows() {
      return [
        ["Name", state.name], ["Email", state.email], ["Business", state.business], ["Phone", state.phone],
        ["Wants to", state.goals.map(goalLabel).join(", ")],
        ["Current CRM", state.crm === "Other" ? (state.crmOther || "Other") : state.crm],
        ["Preferred time", [state.day, state.window].filter(Boolean).join(", ") + (tz && (state.day || state.window) ? ` (${tz})` : "")],
        ["Notes", state.notes], ["Context", state.context]
      ];
    }

    function render() {
      stage.innerHTML = VIEWS[state.step]();
      const pane = $(".flow-pane", stage);
      if (dir < 0) pane.classList.add("back");
      bars.forEach((b, i) => b.classList.toggle("done", i < Math.min(state.step + 1, TOTAL) && state.step < 5 || state.step >= 4));
      meta.textContent = state.step < 4 ? `Step ${state.step + 1} of 5` : state.step === 4 ? "Review" : "Done";
      $(".flow-top", host).style.display = state.step === 5 ? "none" : "";
      bind();
      refreshNext();
      if (opts.autofocus !== false && state.step > 0) {
        const f = $("input, .opt, .day-btn, button[data-next], button[data-send], button[data-submit]", stage);
        if (f) f.focus({ preventScroll: true });
      }
    }

    function valid(silent) {
      if (state.step === 0) return state.goals.length > 0;
      if (state.step === 1) return !!state.crm;
      if (state.step === 2) {
        const okName = state.name.trim().length > 1;
        const okMail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(state.email.trim());
        if (!silent) {
          $("[name=name]", stage).closest(".field").classList.toggle("has-error", !okName);
          $("[name=email]", stage).closest(".field").classList.toggle("has-error", !okMail);
          if (!okName) $("[name=name]", stage).focus(); else if (!okMail) $("[name=email]", stage).focus();
        }
        return okName && okMail;
      }
      if (state.step === 3) return !!(state.day && state.window);
      return true;
    }
    function refreshNext() {
      const n = $("[data-next]", stage);
      if (!n) return;
      const ok = state.step === 2 ? true : valid(true); // details step validates on click, with messages
      n.disabled = !ok;
    }
    function go(to) { dir = to > state.step ? 1 : -1; state.step = to; save(); render(); if (opts.onStep) opts.onStep(to); }

    function bind() {
      $$(".opt", stage).forEach(b => b.addEventListener("click", () => {
        const v = b.dataset.v;
        if (state.step === 0) {
          state.goals = state.goals.includes(v) ? state.goals.filter(x => x !== v) : [...state.goals, v];
          if (v === "unsure" && state.goals.includes("unsure")) state.goals = ["unsure"];
          else state.goals = state.goals.filter(x => x !== "unsure" || v === "unsure");
          $$(".opt", stage).forEach(o => o.setAttribute("aria-checked", String(state.goals.includes(o.dataset.v))));
        } else if (state.step === 1) {
          state.crm = v;
          $$(".opt", stage).forEach(o => o.setAttribute("aria-checked", String(o.dataset.v === v)));
          const other = $("[data-other]", stage);
          other.hidden = v !== "Other";
          if (v === "Other") $("input", other).focus();
          else setTimeout(() => go(2), 260); // single choice: advance automatically
        } else if (state.step === 3) {
          state.window = v;
          $$(".opt", stage).forEach(o => o.setAttribute("aria-checked", String(o.dataset.v === v)));
        }
        save(); refreshNext();
      }));
      $$(".day-btn", stage).forEach(b => b.addEventListener("click", () => {
        state.day = b.dataset.day;
        $$(".day-btn", stage).forEach(o => { const on = o === b; o.setAttribute("aria-pressed", String(on)); o.setAttribute("aria-checked", String(on)); });
        save(); refreshNext();
      }));
      $$("input, textarea", stage).forEach(inp => inp.addEventListener("input", () => {
        state[inp.name] = inp.value;
        const f = inp.closest(".field");
        if (f) {
          f.classList.remove("has-error");
          if (inp.name === "email") f.classList.toggle("valid", /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inp.value.trim()));
          if (inp.name === "name") f.classList.toggle("valid", inp.value.trim().length > 1);
        }
        save();
      }));
      $$("input", stage).forEach(inp => inp.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); next(); } }));
      const n = $("[data-next]", stage); if (n) n.addEventListener("click", next);
      const bk = $("[data-back]", stage); if (bk) bk.addEventListener("click", () => go(Math.max(0, state.step - 1)));
      const cal = $("[data-calendar]", stage);
      if (cal) cal.addEventListener("click", () => {
        const u = new URL(BOOKING.bookingUrl);
        const [fn, ...ln] = state.name.trim().split(/\s+/);
        u.searchParams.set("name", state.name); u.searchParams.set("email", state.email);
        u.searchParams.set("first_name", fn || ""); u.searchParams.set("last_name", ln.join(" "));
        window.open(u.toString(), "_blank", "noopener");
      });
      $$("[data-send]", stage).forEach(b => b.addEventListener("click", () => {
        const text = composeText(`Hi Diyah Solutions, I'd like to book a discovery call.`, summaryRows());
        if (b.dataset.send === "whatsapp") openWhatsApp(text);
        else openEmail(`Discovery call request: ${state.name}`, text);
        finish();
      }));
      const sub = $("[data-submit]", stage);
      if (sub) sub.addEventListener("click", async () => {
        sub.disabled = true; sub.innerHTML = "Sending…";
        const ok = await postLead({ type: "discovery_call", ...Object.fromEntries(summaryRows()), timezone: tz, page: location.pathname, submitted_at: new Date().toISOString() });
        if (ok) finish();
        else {
          sub.outerHTML = `<p class="sub" style="margin:0">Couldn&rsquo;t reach our server. Send it directly instead:</p><div class="send-row"><button type="button" class="btn btn-primary btn-lg" data-send="whatsapp">${ICON.wa} WhatsApp</button><button type="button" class="btn btn-ghost btn-lg" data-send="email">${ICON.mail} Email</button></div>`;
          bind();
        }
      });
    }
    function next() {
      if (!valid(false)) return;
      if (state.step === 1 && state.crm === "Other") state.crmOther = ($("[name=crmOther]", stage) || {}).value || state.crmOther;
      go(state.step + 1);
    }
    function finish() {
      store.set("diyah-dc-done", "1");
      go(5);
      if (opts.onDone) opts.onDone();
    }

    render();
    return {
      preset(goal) {
        const map = { fix: "fix", build: "build", partner: "followup" };
        if (goal === "partner") state.context = "Interested in the Automation Partner plan";
        const g = map[goal] || (GOALS.some(x => x.v === goal) ? goal : "");
        if (g && !state.goals.includes(g)) state.goals = [...state.goals.filter(x => x !== "unsure"), g];
        save(); if (state.step === 0) render();
      },
      reset() { if (state.step === 5) { state.step = 0; render(); } },
      focusFirst() { const f = $(".opt, input", stage); if (f) f.focus({ preventScroll: true }); }
    };
  }

  /* ---------------------------------------------------------------------
     Discovery-call pop-up: opens 5s after load, from any [data-open-booking]
     --------------------------------------------------------------------- */
  const dc = $("#discovery");
  const isContact = document.body.dataset.page === "contact";
  let popupFlow = null;
  if (dc) {
    const video = $("video", dc);
    const soundBtn = $(".dc-sound", dc);
    const bar = $(".dc-progress i", dc);
    const tab = $(".dc-tab");
    let lastFocus = null;
    popupFlow = LeadFlow($("[data-flow]", dc), { inModal: true, titleId: "dc-title", autofocus: false });

    const setSound = on => {
      video.muted = !on;
      soundBtn.setAttribute("aria-pressed", String(on));
      $("span", soundBtn).textContent = on ? "Sound on" : "Tap for sound";
      $("svg", soundBtn).innerHTML = on ? '<path d="M11 5 6 9H2v6h4l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14"/>' : '<path d="M11 5 6 9H2v6h4l5 4z"/><path d="m23 9-6 6M17 9l6 6"/>';
    };
    soundBtn.addEventListener("click", () => { setSound(video.muted); if (video.paused) video.play().catch(() => {}); });
    video.addEventListener("timeupdate", () => { if (video.duration) bar.style.width = (video.currentTime / video.duration * 100) + "%"; });
    video.addEventListener("click", () => { video.paused ? video.play().catch(() => {}) : video.pause(); });

    function open({ withSound = false, goal = "" } = {}) {
      if (dc.classList.contains("is-open")) return;
      lastFocus = document.activeElement;
      closeMenu();
      popupFlow.reset();
      if (goal) popupFlow.preset(goal);
      dc.hidden = false;
      dc.classList.add("is-open");
      document.body.style.overflow = "hidden";
      requestAnimationFrame(() => requestAnimationFrame(() => dc.classList.add("is-visible")));
      store.set("diyah-dc-seen", "1", sessionStorage);
      if (tab) tab.classList.remove("show");
      if (!reduceMotion || withSound) {
        setSound(withSound);
        if (withSound) video.currentTime = 0;
        video.play().catch(() => { setSound(false); video.play().catch(() => {}); });
      }
      setTimeout(() => (withSound ? soundBtn : $(".dc-close", dc)).focus({ preventScroll: true }), 60);
    }
    function close() {
      dc.classList.remove("is-visible");
      document.body.style.overflow = "";
      video.pause();
      store.set("diyah-dc-closed", String(Date.now()));
      setTimeout(() => { dc.classList.remove("is-open"); dc.hidden = true; }, reduceMotion ? 0 : 420);
      if (tab && !isContact && store.get("diyah-dc-done") !== "1") setTimeout(() => tab.classList.add("show"), 1200);
      if (lastFocus) lastFocus.focus({ preventScroll: true });
    }
    dc.addEventListener("click", e => { if (e.target.closest("[data-dc-close]")) close(); });
    document.addEventListener("keydown", e => {
      if (!dc.classList.contains("is-open")) return;
      if (e.key === "Escape") close();
      if (e.key === "Tab") {
        const f = $$('a[href], button:not([disabled]), input, textarea, [tabindex]:not([tabindex="-1"])', dc).filter(el => el.offsetParent !== null);
        if (!f.length) return;
        const a = f[0], z = f[f.length - 1];
        if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); }
        else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
      }
    });

    // Every "Book a discovery call" button opens the pop-up (contact page uses its inline form)
    document.addEventListener("click", e => {
      const t = e.target.closest("[data-open-booking]");
      if (!t || e.metaKey || e.ctrlKey) return;
      if (isContact && !t.hasAttribute("data-play-video")) {
        e.preventDefault();
        const b = $("#book"); if (b) { selectTab("book"); b.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" }); }
        return;
      }
      e.preventDefault();
      open({ withSound: t.hasAttribute("data-play-video"), goal: t.dataset.goal || "" });
    });

    // Auto-open once per visit: right after the intro animation (or shortly after load if there is no intro)
    const closedAt = parseInt(store.get("diyah-dc-closed") || "0", 10);
    const coolingDown = BOOKING.cooldownDays > 0 && Date.now() - closedAt < BOOKING.cooldownDays * 864e5;
    const eligible = document.body.dataset.autopopup !== "off" && !isContact && store.get("diyah-dc-done") !== "1" &&
      store.get("diyah-dc-seen", sessionStorage) !== "1" && !coolingDown && !/[?&]nopopup/.test(location.search);
    const tryOpen = () => {
      const busy = document.body.classList.contains("menu-open") || $(".modal.is-open") ||
        (document.activeElement && /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName));
      if (busy) return setTimeout(tryOpen, 2500);
      open();
    };
    if (eligible) {
      if (root.classList.contains("show-intro")) document.addEventListener("diyah:intro-done", () => setTimeout(tryOpen, BOOKING.popupDelay), { once: true });
      else setTimeout(tryOpen, 1200);
    } else if (tab && !isContact && store.get("diyah-dc-done") !== "1") {
      setTimeout(() => tab.classList.add("show"), 2500);
    }
  }

  /* ---------------------------------------------------------------------
     Contact page: "Book a discovery call" / "Send a message"
     --------------------------------------------------------------------- */
  const tabs = $$(".seg [role=tab]");
  function selectTab(id) {
    if (!tabs.length) return;
    tabs.forEach(t => {
      const on = t.getAttribute("aria-controls") === `panel-${id}`;
      t.setAttribute("aria-selected", String(on)); t.tabIndex = on ? 0 : -1;
      $("#" + t.getAttribute("aria-controls")).hidden = !on;
    });
  }
  if (tabs.length) {
    tabs.forEach((t, i) => {
      t.addEventListener("click", () => { selectTab(t.getAttribute("aria-controls").replace("panel-", "")); history.replaceState(null, "", t.dataset.hash); });
      t.addEventListener("keydown", e => {
        if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
        const n = tabs[(i + (e.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length];
        n.focus(); n.click();
      });
    });
    selectTab(location.hash === "#message" ? "message" : "book");
    const inline = $("[data-flow='inline']");
    if (inline) LeadFlow(inline, { autofocus: true });

    const mf = $("#message-form");
    if (mf) {
      const topics = new Set();
      $$(".opt", mf).forEach(b => b.addEventListener("click", () => {
        const v = b.dataset.v; topics.has(v) ? topics.delete(v) : topics.add(v);
        b.setAttribute("aria-checked", String(topics.has(v)));
      }));
      const check = () => {
        let ok = true;
        $$("[required]", mf).forEach(inp => {
          const good = inp.type === "email" ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inp.value.trim()) : inp.value.trim().length > 1;
          inp.closest(".field").classList.toggle("has-error", !good);
          if (!good && ok) { inp.focus(); ok = false; }
        });
        return ok;
      };
      $$("[required]", mf).forEach(inp => inp.addEventListener("input", () => inp.closest(".field").classList.remove("has-error")));
      const rows = () => { const d = new FormData(mf); return [["Name", d.get("name")], ["Email", d.get("email")], ["Business", d.get("business")], ["About", [...topics].join(", ")]]; };
      const done = () => {
        const s = $(".msg-status", mf); s.hidden = false;
        s.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "nearest" });
      };
      $$("[data-msg]", mf).forEach(b => b.addEventListener("click", async () => {
        if (!check()) return;
        const d = new FormData(mf);
        if (b.dataset.msg === "endpoint") {
          b.disabled = true;
          const ok = await postLead({ type: "message", ...Object.fromEntries(rows()), message: d.get("message"), page: location.pathname, submitted_at: new Date().toISOString() });
          b.disabled = false;
          if (ok) return done();
        }
        const text = composeText(`Hi Diyah Solutions, I'm ${d.get("name")}.`, rows().slice(1), d.get("message"));
        if (b.dataset.msg === "email") openEmail(`New message from ${d.get("name")}`, text); else openWhatsApp(text);
        done();
      }));
      mf.addEventListener("submit", e => e.preventDefault());
      // Show the right send buttons for the current setup
      $$("[data-msg]", mf).forEach(b => { b.hidden = BOOKING.leadEndpoint ? b.dataset.msg !== "endpoint" : b.dataset.msg === "endpoint"; });
    }
  }

  /* ---------------------------------------------------------------------
     Portfolio: filters, case-study drawer, lightbox, deep links (#case-id)
     --------------------------------------------------------------------- */
  const filters = $$(".filter");
  const cases = $$(".case");
  if (filters.length && cases.length) {
    filters.forEach(f => {
      const cat = f.dataset.filter;
      const n = cat === "all" ? cases.length : cases.filter(c => (c.dataset.cat || "").split(" ").includes(cat)).length;
      const cnt = $(".count", f); if (cnt) cnt.textContent = n;
      f.addEventListener("click", () => {
        filters.forEach(x => x.setAttribute("aria-pressed", String(x === f)));
        cases.forEach((c, i) => {
          const match = cat === "all" || (c.dataset.cat || "").split(" ").includes(cat);
          c.classList.toggle("is-hidden", !match);
          if (match && !reduceMotion) c.animate([{ opacity: 0, transform: "translateY(14px)" }, { opacity: 1, transform: "none" }], { duration: 520, delay: (i % 6) * 50, easing: "cubic-bezier(.16,1,.3,1)", fill: "backwards" });
        });
      });
    });
  }

  const modal = $("#case-modal");
  if (modal) {
    const content = $(".modal-content", modal);
    const panel = $(".modal-panel", modal);
    const lb = $("#lightbox");
    let openId = null, lastFocus = null;
    const visibleCases = () => cases.filter(c => !c.classList.contains("is-hidden"));

    function openCase(id, push = true) {
      const art = document.getElementById(id);
      if (!art) return;
      content.innerHTML = $(".case-detail", art).innerHTML;
      openId = id; lastFocus = document.activeElement;
      modal.classList.add("is-open");
      document.body.style.overflow = "hidden";
      requestAnimationFrame(() => modal.classList.add("is-visible"));
      panel.scrollTop = 0;
      $(".modal-close", modal).focus({ preventScroll: true });
      if (push) history.replaceState(null, "", "#" + id);
      bindGallery();
      const t = $("h2", content);
      modal.setAttribute("aria-label", t ? t.textContent : "Case study");
    }
    function closeCase() {
      modal.classList.remove("is-visible");
      setTimeout(() => { modal.classList.remove("is-open"); content.innerHTML = ""; }, reduceMotion ? 0 : 450);
      document.body.style.overflow = "";
      history.replaceState(null, "", location.pathname + location.search);
      openId = null;
      if (lastFocus) lastFocus.focus({ preventScroll: true });
    }
    function step(dir) {
      const list = visibleCases();
      const i = list.findIndex(c => c.id === openId);
      const nx = list[(i + dir + list.length) % list.length];
      if (nx) openCase(nx.id);
    }
    $$(".case-card").forEach(btn => btn.addEventListener("click", () => openCase(btn.closest(".case").id)));
    $(".modal-close", modal).addEventListener("click", closeCase);
    $(".modal-backdrop", modal).addEventListener("click", closeCase);
    $(".mb-prev", modal).addEventListener("click", () => step(-1));
    $(".mb-next", modal).addEventListener("click", () => step(1));
    // the booking pop-up opens on top of a case study: close the case first
    content.addEventListener("click", e => { if (e.target.closest("[data-open-booking]")) closeCase(); });
    document.addEventListener("keydown", e => {
      if (!modal.classList.contains("is-open") || lb.classList.contains("is-open") || (dc && dc.classList.contains("is-open"))) return;
      if (e.key === "Escape") closeCase();
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
      if (e.key === "Tab") {
        const f = $$('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])', panel);
        if (!f.length) return;
        if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
      }
    });

    const lbImg = $("img", lb), lbCount = $(".lb-count", lb);
    let gallery = [], gi = 0;
    function bindGallery() {
      gallery = $$("[data-full]", content).map(el => ({ src: el.dataset.full, alt: el.dataset.alt || "" }));
      $$("[data-full]", content).forEach((el, i) => el.addEventListener("click", () => showLb(i)));
    }
    function showLb(i) {
      gi = (i + gallery.length) % gallery.length;
      lbImg.src = gallery[gi].src; lbImg.alt = gallery[gi].alt;
      lbCount.textContent = `${gi + 1} / ${gallery.length}`;
      lb.classList.add("is-open");
      $(".lb-close", lb).focus({ preventScroll: true });
    }
    const hideLb = () => lb.classList.remove("is-open");
    $(".lb-close", lb).addEventListener("click", hideLb);
    $(".lb-prev", lb).addEventListener("click", () => showLb(gi - 1));
    $(".lb-next", lb).addEventListener("click", () => showLb(gi + 1));
    lb.addEventListener("click", e => { if (e.target === lb) hideLb(); });
    document.addEventListener("keydown", e => {
      if (!lb.classList.contains("is-open")) return;
      if (e.key === "Escape") hideLb();
      if (e.key === "ArrowRight") showLb(gi + 1);
      if (e.key === "ArrowLeft") showLb(gi - 1);
    });

    const hash = location.hash.slice(1);
    if (hash && document.getElementById(hash) && document.getElementById(hash).classList.contains("case")) setTimeout(() => openCase(hash, false), 300);
  }

  /* ---------------------------------------------------------------------
     Work page: rotating stack of screenshots (click opens the case study)
     --------------------------------------------------------------------- */
  const stack = $("[data-shot-stack]");
  if (stack) {
    const shots = $$(".shot", stack), dots = $$(".shot-dots i", stack);
    const order = shots.map((_, i) => i);
    let timer = null;
    const paint = () => {
      order.forEach((idx, pos) => shots[idx].setAttribute("data-pos", String(Math.min(pos, 3))));
      dots.forEach((d, i) => d.classList.toggle("on", i === order[0]));
    };
    const next = () => {
      shots[order[0]].setAttribute("data-pos", "out");
      setTimeout(() => { order.push(order.shift()); paint(); }, 450);
    };
    paint();
    if (!reduceMotion) {
      const run = () => { clearInterval(timer); timer = setInterval(() => { if (!document.hidden) next(); }, 3200); };
      stack.addEventListener("mouseenter", () => clearInterval(timer));
      stack.addEventListener("mouseleave", run);
      run();
    }
    shots.forEach(a => a.addEventListener("click", e => {
      const art = document.getElementById(a.dataset.caseLink);
      const card = art && $(".case-card", art);
      if (card) { e.preventDefault(); card.click(); }
    }));
  }

  /* ---------------------------------------------------------------------
     Counters: <b data-count="9" data-suffix="+" data-decimals="1">
     --------------------------------------------------------------------- */
  const counters = $$("[data-count]");
  if (counters.length && !reduceMotion && "IntersectionObserver" in window) {
    const runCount = el => {
      const end = parseFloat(el.dataset.count), dec = parseInt(el.dataset.decimals || "0", 10), suf = el.dataset.suffix || "";
      const t0 = performance.now(), dur = 1400;
      const tick = now => {
        const p = Math.min(1, (now - t0) / dur), v = end * (1 - Math.pow(1 - p, 4));
        el.textContent = v.toFixed(dec) + suf;
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };
    const cio = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) { runCount(en.target); cio.unobserve(en.target); } }), { threshold: .6 });
    counters.forEach(c => cio.observe(c));
  }

  /* WhatsApp links get the default message */
  $$("a[data-wa]").forEach(a => {
    a.href = `https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent(a.dataset.wa || CONTACT.waMessage)}`;
    a.target = "_blank"; a.rel = "noopener";
  });

  $$("[data-year]").forEach(el => { el.textContent = new Date().getFullYear(); });
})();
