// biome-ignore-all lint/style/noNonNullAssertion: ported GSP source; lookups are guarded by the scene lifecycle
import { SCENES } from "../game/scenes";
import { MAX_MISSING, MIN_MISSING, parseMissing } from "../game/settings";
import { COPY, type GameLocale } from "../i18n";

interface Actions {
  start(scene: number, missing: number): void;
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
  private scene = 0;
  private missing = MIN_MISSING;
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
    this.root.className = "sticker-scene-ui";
    document.body.append(this.root);
    this.root.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && this.visible && this.resumable && !this.paused)
        this.actions.resume();
    });
  }

  open(scene: number, missing: number, resumable: boolean, hasRound: boolean) {
    this.scene = scene;
    this.missing = missing;
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
          <div class="menu-top"><span class="brand-mark" aria-hidden="true">● ● ●</span>
          </div>
          <header class="menu-heading"><h1 id="menu-title">${t.title}</h1><p>${t.subtitle}</p></header>
          <div class="sticker-preview" aria-hidden="true"><img src="assets/stickers/sea/turtle.png" alt=""/><img src="assets/stickers/jungle/parrot.png" alt=""/><img src="assets/stickers/farm/cow.png" alt=""/></div>
          <div class="start-actions">
            ${this.resumable ? `<button id="resume-game" class="primary-button"><span aria-hidden="true">▶</span><span>${t.resume}</span></button>` : ""}
            <button id="start-game" class="${this.resumable ? "secondary-button" : "primary-button"}"><span aria-hidden="true">▶</span><span>${this.hasRound ? t.newRound : t.start}</span></button>
          </div>
          <section class="settings-panel" aria-labelledby="settings-title">
            <h2 id="settings-title">${t.settings}</h2>
            <fieldset class="scene-picker"><legend>${t.location}</legend><div class="scene-options">
              ${SCENES.map((scene, index) => `<label class="scene-option"><input id="scene-${scene.id}" type="radio" name="scene" value="${index}" ${index === this.scene ? "checked" : ""}/><img alt="" src="assets/scenes/${scene.id}.png"/><span>${t.scenes[scene.id as keyof typeof t.scenes]}</span></label>`).join("")}
            </div></fieldset>
            <div class="slider-group"><label for="missing">${t.missing}<output for="missing">${this.missing}</output></label>
              <input id="missing" type="range" min="${MIN_MISSING}" max="${MAX_MISSING}" step="1" value="${this.missing}" />
              <div class="slider-ticks" aria-hidden="true">${Array.from({ length: 4 }, (_, i) => `<span>${i + 3}</span>`).join("")}</div>
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
      ?.addEventListener("click", () => this.actions.start(this.scene, this.missing));
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
    this.root.querySelector<HTMLInputElement>("#missing")?.addEventListener("input", (event) => {
      this.missing = parseMissing(Number((event.target as HTMLInputElement).value));
      this.updatePreview();
    });
    for (const radio of this.root.querySelectorAll<HTMLInputElement>('input[name="scene"]')) {
      radio.addEventListener("change", () => {
        if (radio.checked) this.scene = Number(radio.value);
      });
    }
    if (this.visible) this.updatePreview();
    this.setState(this.completed, this.paused);
  }

  private updatePreview() {
    const t = COPY[this.locale];
    this.root.querySelector("output")!.textContent = String(this.missing);
    this.root
      .querySelector<HTMLInputElement>("#missing")!
      .style.setProperty(
        "--fill",
        `${((this.missing - MIN_MISSING) / (MAX_MISSING - MIN_MISSING)) * 100}%`,
      );
    this.root.querySelector(".round-total")!.textContent = t.summary
      .replace("{missing}", String(this.missing))
      .replace("{placed}", String(12 - this.missing));
    this.root.querySelector(".example-note")!.textContent = t.note;
  }

  destroy() {
    this.root.remove();
  }
}
