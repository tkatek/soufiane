const hero = document.querySelector(".hero");
const visual = hero?.querySelector(".hero__visual");

if (hero && visual && window.matchMedia("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)").matches) {
  const layers = visual.querySelectorAll(".monitor, .phone, .code-note");
  let frame = 0;

  visual.addEventListener("pointermove", (event) => {
    if (frame) return;

    frame = window.requestAnimationFrame(() => {
      const bounds = visual.getBoundingClientRect();
      const x = (event.clientX - bounds.left) / bounds.width - 0.5;
      const y = (event.clientY - bounds.top) / bounds.height - 0.5;

      layers.forEach((layer, index) => {
        const strength = (index + 1) * 2;
        layer.style.setProperty("--pointer-x", `${x * strength}px`);
        layer.style.setProperty("--pointer-y", `${y * strength}px`);
      });
      frame = 0;
    });
  });

  visual.addEventListener("pointerleave", () => {
    if (frame) window.cancelAnimationFrame(frame);
    frame = 0;
    layers.forEach((layer) => {
      layer.style.removeProperty("--pointer-x");
      layer.style.removeProperty("--pointer-y");
    });
  });
}