/** Prop animations a film may use (`cls` in art.tsx). */
export const FILM_MOTIONS = [
  "swim",
  "bob",
  "sway",
  "fly",
  "buzz",
  "spin",
  "drift",
  "rise",
  "twinkle",
  "pop",
] as const;
export type FilmMotion = (typeof FILM_MOTIONS)[number];

// Plain CSS so the stage works in any React host. Animations run only while playing and
// switch off for reduced motion (docs/dev/ui.md).
export const FILM_CSS = `
[data-film-stage] svg{display:block;width:100%;height:auto;overflow:visible}
[data-film-stage] .film-bg{height:100%}
[data-film-stage] .film-loop{animation-play-state:paused}
[data-film-stage][data-playing] .film-loop{animation-play-state:running}
.film-enter{animation:film-enter .5s cubic-bezier(.2,.8,.2,1) both}
.film-swim{animation:film-swim 6s ease-in-out infinite}
.film-bob{animation:film-bob 2.4s ease-in-out infinite}
.film-sway{animation:film-sway 3s ease-in-out infinite;transform-origin:50% 100%}
.film-fly{animation:film-fly 5s ease-in-out infinite}
.film-buzz{animation:film-buzz .5s linear infinite}
.film-spin{animation:film-spin 18s linear infinite}
.film-drift{animation:film-drift 9s ease-in-out infinite}
.film-rise{animation:film-rise 4s ease-in-out infinite}
.film-twinkle{animation:film-twinkle 1.8s ease-in-out infinite}
.film-pop{animation:film-pop 1.6s cubic-bezier(.2,.8,.2,1) infinite}
.film-talker{animation:film-bob 3s ease-in-out infinite}
.film-caption{background:rgba(43,35,80,.78);color:#fff;border-radius:14px;padding:.35em .8em;font-size:clamp(12px,2.2vw,20px);line-height:1.3;text-align:center}
@keyframes film-enter{from{opacity:0;transform:scale(.6)}to{opacity:1;transform:none}}
@keyframes film-swim{0%,100%{transform:translateX(-8%)}50%{transform:translateX(8%) translateY(-4%)}}
@keyframes film-bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-6%)}}
@keyframes film-sway{0%,100%{transform:rotate(-6deg)}50%{transform:rotate(6deg)}}
@keyframes film-fly{0%,100%{transform:translate(-10%,0)}25%{transform:translate(0,-10%)}50%{transform:translate(10%,0)}75%{transform:translate(0,8%)}}
@keyframes film-buzz{0%,100%{transform:translate(0,0)}25%{transform:translate(2%,-2%)}75%{transform:translate(-2%,2%)}}
@keyframes film-spin{to{transform:rotate(360deg)}}
@keyframes film-drift{0%,100%{transform:translateX(-12%)}50%{transform:translateX(12%)}}
@keyframes film-rise{0%{transform:translateY(8%);opacity:.6}50%{transform:translateY(-8%);opacity:1}100%{transform:translateY(8%);opacity:.6}}
@keyframes film-twinkle{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.45;transform:scale(.85)}}
@keyframes film-pop{0%,100%{transform:scale(1)}40%{transform:scale(1.12)}}
@media (prefers-reduced-motion: reduce){[data-film-stage] *{animation:none!important;transition:none!important}}
`;
