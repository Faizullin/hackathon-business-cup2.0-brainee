// biome-ignore-all lint/style/noNonNullAssertion: ported GSP source; lookups are guarded by the scene lifecycle
import { levelFor, MAX_LEVEL } from "../game/levels";
import { type ShapeId, shapePath } from "../game/shapes";
import { COPY, type GameLocale } from "../i18n";

interface Actions {
  start(level: number): void;
  resume(): void;
  menu(): void;
  hint(): void;
  sound(enabled: boolean): void;
  language(locale: GameLocale): void;
}

/** Native controls provide keyboard/touch sliders and translated accessible names. */
export class GameMenu {
  readonly root = document.createElement("div");
  private locale: GameLocale;
  private sound: boolean;
  private level = 1;
  private visible = true;
  private resumable = false;
  private hasRound = false;
  private paused = false;
  private completed = false;
  private readonly actions: Actions;

  constructor(locale: GameLocale, sound: boolean, actions: Actions) {
    this.locale = locale;
    this.sound = sound;
    this.actions = actions;
    this.root.className = "shape-pairs-ui";
    document.body.append(this.root);
    this.root.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && this.visible && this.resumable && !this.paused)
        this.actions.resume();
    });
  }

  open(level: number, resumable: boolean, hasRound: boolean) {
    this.level = level;
    this.visible = true;
    this.resumable = resumable;
    this.hasRound = hasRound;
    this.render();
    this.root
      .querySelector<HTMLButtonElement>(resumable ? "#resume-game" : "#start-game")
      ?.focus({ preventScroll: true });
  }

  close() {
    this.visible = false;
    this.render();
    this.root.querySelector<HTMLButtonElement>("#open-menu")?.focus({ preventScroll: true });
  }

  setLocale(locale: GameLocale) {
    this.locale = locale;
    const focused = this.root.contains(document.activeElement) ? document.activeElement?.id : null;
    this.render();
    if (focused)
      this.root.querySelector<HTMLElement>(`#${focused}`)?.focus({ preventScroll: true });
  }

  setState(completed: boolean, paused: boolean) {
    this.completed = completed;
    this.paused = paused;
    for (const control of this.root.querySelectorAll<
      HTMLButtonElement | HTMLInputElement | HTMLSelectElement
    >("button,input,select")) {
      control.disabled = paused || (control.id === "game-hint" && completed);
    }
  }

  buttonView(id: string) {
    const button = this.root.querySelector<HTMLButtonElement>(`#${id}`);
    if (!button) return null;
    const r = button.getBoundingClientRect();
    return {
      x: r.x + r.width / 2,
      y: r.y + r.height / 2,
      visible: !this.visible,
      enabled: !button.disabled,
      size: r.width,
    };
  }

  private render() {
    const t = COPY[this.locale];
    this.root.innerHTML = this.visible
      ? `
      <main class="sort-menu" aria-labelledby="menu-title">
        <div class="menu-card">
          <div class="menu-top"><span class="brand-mark" aria-hidden="true">● ▲ ■</span>
          </div>
          <header class="menu-heading"><h1 id="menu-title">${t.title}</h1><p>${t.subtitle}</p></header>
          <div class="shape-preview" aria-hidden="true">${this.preview()}</div>
          <div class="start-actions">
            ${this.resumable ? `<button id="resume-game" class="primary-button"><span aria-hidden="true">▶</span><span>${t.resume}</span></button>` : ""}
            <button id="start-game" class="${this.resumable ? "secondary-button" : "primary-button"}"><span aria-hidden="true">▶</span><span>${this.hasRound ? t.newRound : t.start}</span></button>
          </div>
          <section class="settings-panel" aria-labelledby="settings-title">
            <h2 id="settings-title">${t.settings}</h2>
            <div class="slider-group"><label for="level">${t.level}<output for="level">${this.level}</output></label>
              <input id="level" type="range" min="1" max="${MAX_LEVEL}" step="1" value="${this.level}" />
              <div class="slider-ticks" aria-hidden="true">${Array.from({ length: MAX_LEVEL }, (_, i) => `<span>${i + 1}</span>`).join("")}</div>
            </div>
            <p class="round-total" aria-live="polite"></p>
            <p class="example-note"></p>
            ${this.resumable ? `<p class="change-note">${t.changed}</p>` : ""}
            <label class="sound-control"><span>${t.sound}</span><input id="menu-sound" type="checkbox" role="switch" ${this.sound ? "checked" : ""}/></label>
          </section>
          <footer class="how-to"><h2>${t.how}</h2><p>${t.instructions}</p><span>${t.gentle}</span></footer>
        </div>
      </main>`
      : `
      <nav class="game-toolbar" aria-label="${t.settings}">
        <button id="open-menu"><span aria-hidden="true">☰</span><span>${t.menu}</span></button>
        <div><button id="game-hint" aria-label="${t.hint}" title="${t.hint}">?</button>
        <button id="game-sound" aria-label="${this.sound ? t.soundOn : t.soundOff}" title="${this.sound ? t.soundOn : t.soundOff}" aria-pressed="${this.sound}">${this.sound ? "♫" : "♪̸"}</button></div>
      </nav>`;

    this.root
      .querySelector<HTMLSelectElement>("#game-language")
      ?.addEventListener("change", (event) => {
        this.actions.language((event.target as HTMLSelectElement).value as GameLocale);
      });
    this.root
      .querySelector("#start-game")
      ?.addEventListener("click", () => this.actions.start(this.level));
    this.root.querySelector("#resume-game")?.addEventListener("click", () => this.actions.resume());
    this.root.querySelector("#open-menu")?.addEventListener("click", () => this.actions.menu());
    this.root.querySelector("#game-hint")?.addEventListener("click", () => this.actions.hint());
    this.root
      .querySelector<HTMLInputElement>("#menu-sound")
      ?.addEventListener("change", (event) => {
        this.sound = (event.target as HTMLInputElement).checked;
        this.actions.sound(this.sound);
      });
    this.root.querySelector("#game-sound")?.addEventListener("click", () => {
      this.sound = !this.sound;
      this.actions.sound(this.sound);
      this.render();
      this.root.querySelector<HTMLButtonElement>("#game-sound")?.focus();
    });
    this.root.querySelector<HTMLInputElement>("#level")?.addEventListener("input", (event) => {
      this.level = levelFor(Number((event.target as HTMLInputElement).value)).level;
      this.updatePreview();
    });
    if (this.visible) this.updatePreview();
    this.setState(this.completed, this.paused);
  }

  private updatePreview() {
    const t = COPY[this.locale],
      level = levelFor(this.level);
    this.root.querySelector("output")!.textContent = String(this.level);
    this.root
      .querySelector<HTMLInputElement>("#level")!
      .style.setProperty("--fill", `${((this.level - 1) / (MAX_LEVEL - 1)) * 100}%`);
    this.root.querySelector(".round-total")!.textContent = t.total.replace(
      "{count}",
      String(level.count),
    );
    this.root.querySelector(".example-note")!.textContent = level.mixGroups ? t.hard : t.easy;
  }

  private preview() {
    const shapes: [ShapeId, string][] = [
      ["circle", "#ff6e7c"],
      ["star", "#ffd65a"],
      ["triangle", "#67b4ef"],
    ];
    return `<svg viewBox="0 0 300 170" focusable="false">${shapes
      .map(([id, color], index) => {
        const x = 55 + index * 95;
        const polygon = (y: number, fill: string) =>
          `<polygon points="${shapePath(id)
            .map((p) => `${x + p.x * 56},${y + p.y * 56}`)
            .join(
              " ",
            )}" fill="${fill}" stroke="#425c70" stroke-width="3" stroke-linejoin="round"/>`;
        return `<path d="M${x} 60 Q${x + 15} 90 ${x} 120" fill="none" stroke="#8ea5b5" stroke-width="2"/>${polygon(38, "#fff")}${polygon(137, color)}`;
      })
      .join("")}</svg>`;
  }

  destroy() {
    this.root.remove();
  }
}
