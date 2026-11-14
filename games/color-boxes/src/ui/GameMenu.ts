// biome-ignore-all lint/style/noNonNullAssertion: ported GSP source; lookups are guarded by the scene lifecycle
import { parseSettings, type SortSettings } from "../game/settings";
import { COPY, type GameLocale } from "../i18n";

interface MenuActions {
  start(settings: SortSettings): void;
  resume(): void;
  menu(): void;
  hint(): void;
  sound(enabled: boolean): void;
  language(locale: GameLocale): void;
}

/** Native controls keep sliders, focus, keyboard input and translations accessible. */
export class GameMenu {
  readonly root = document.createElement("div");
  private locale: GameLocale;
  private sound: boolean;
  private settings: SortSettings = { boxes: 2, perBox: 2 };
  private visible = true;
  private resumable = false;
  private hasRound = false;
  private readonly actions: MenuActions;

  constructor(locale: GameLocale, sound: boolean, actions: MenuActions) {
    this.locale = locale;
    this.sound = sound;
    this.actions = actions;
    this.root.className = "color-sort-ui";
    document.body.append(this.root);
    this.root.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && this.visible && this.resumable) this.actions.resume();
    });
  }

  open(settings: SortSettings, resumable: boolean, hasRound: boolean) {
    this.settings = { ...settings };
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

  buttonView(id: string) {
    const button = this.root.querySelector<HTMLButtonElement>(`#${id}`);
    if (!button) return null;
    const rect = button.getBoundingClientRect();
    return {
      x: rect.x + rect.width / 2,
      y: rect.y + rect.height / 2,
      visible: !this.visible,
      enabled: !button.disabled,
    };
  }

  private render() {
    const t = COPY[this.locale];
    this.root.innerHTML = this.visible
      ? `
      <main class="sort-menu" aria-labelledby="menu-title">
        <div class="menu-card">
          <div class="menu-top"><span class="brand-mark" aria-hidden="true">● ● ●</span>
          </div>
          <header class="menu-heading"><h1 id="menu-title">${t.title}</h1><p>${t.subtitle}</p></header>
          <div class="basket-preview" aria-hidden="true"></div>
          <div class="start-actions">
            ${this.resumable ? `<button id="resume-game" class="primary-button"><span aria-hidden="true">▶</span><span>${t.resume}</span></button>` : ""}
            <button id="start-game" class="${this.resumable ? "secondary-button" : "primary-button"}"><span aria-hidden="true">▶</span><span>${this.hasRound ? t.newRound : t.start}</span></button>
          </div>
          <section class="settings-panel" aria-labelledby="settings-title">
            <h2 id="settings-title">${t.settings}</h2>
            ${this.slider("boxes", t.baskets, this.settings.boxes)}
            ${this.slider("perBox", t.pictures, this.settings.perBox)}
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
      ?.addEventListener("click", () => this.actions.start({ ...this.settings }));
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
    for (const key of ["boxes", "perBox"] as const) {
      this.root.querySelector<HTMLInputElement>(`#${key}`)?.addEventListener("input", (event) => {
        this.settings = parseSettings({
          ...this.settings,
          [key]: Number((event.target as HTMLInputElement).value),
        });
        this.updatePreview();
      });
    }
    if (this.visible) this.updatePreview();
  }

  private slider(id: keyof SortSettings, label: string, value: number) {
    return `<div class="slider-group"><label for="${id}">${label}<output for="${id}">${value}</output></label>
      <input id="${id}" type="range" min="2" max="4" step="1" value="${value}" />
      <div class="slider-ticks" aria-hidden="true"><span>2</span><span>3</span><span>4</span></div></div>`;
  }

  private updatePreview() {
    const t = COPY[this.locale];
    for (const key of ["boxes", "perBox"] as const) {
      this.root.querySelector(`output[for="${key}"]`)!.textContent = String(this.settings[key]);
      this.root
        .querySelector<HTMLInputElement>(`#${key}`)!
        .style.setProperty("--fill", `${(this.settings[key] - 2) * 50}%`);
    }
    const preview = [
      ["red", "apple"],
      ["yellow", "banana"],
      ["blue", "whale"],
      ["green", "green_apple"],
    ].slice(0, this.settings.boxes);
    this.root.querySelector(".basket-preview")!.innerHTML = preview
      .map(
        ([color, item]) =>
          `<div class="preview-box ${color}"><img alt="" src="assets/items/${color}/${item}.png"/><div class="basket-body"><span></span></div></div>`,
      )
      .join("");
    this.root.querySelector(".round-total")!.textContent = t.total.replace(
      "{count}",
      String(this.settings.boxes * this.settings.perBox),
    );
    this.root.querySelector(".example-note")!.textContent =
      this.settings.perBox === 2 ? t.examples : t.noExamples;
  }

  destroy() {
    this.root.remove();
  }
}
