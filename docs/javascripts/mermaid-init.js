(function () {
  function renderMermaidDiagrams() {
    if (typeof mermaid === "undefined") return;

    mermaid.initialize({
      startOnLoad: false,
      theme: 'neutral',
      securityLevel: 'loose',
      flowchart: {
        htmlLabels: true,
        curve: 'basis',
        useMaxWidth: true
      }
    });

    const uninitialized = document.querySelectorAll(".mermaid:not([data-processed='true'])");
    if (uninitialized.length > 0) {
      const nodesToRender = Array.from(uninitialized);
      nodesToRender.forEach(function (node) {
        node.setAttribute("data-processed", "true");
      });

      mermaid.run({
        nodes: nodesToRender
      }).then(function () {
        initDiagramControls();
      }).catch(function (err) {
        console.warn("Mermaid notice:", err);
        initDiagramControls();
      });
    } else {
      initDiagramControls();
    }
  }

  function initDiagramControls() {
    document.querySelectorAll(".mermaid").forEach(function (el) {
      const svg = el.querySelector("svg");
      if (!svg) return;

      let wrapper = el.closest(".diagram-wrapper");
      if (!wrapper) {
        wrapper = document.createElement("div");
        wrapper.className = "diagram-wrapper";
        el.parentNode.insertBefore(wrapper, el);
        wrapper.appendChild(el);
      }

      if (wrapper.querySelector(".diagram-toolbar")) return;

      const toolbar = document.createElement("div");
      toolbar.className = "diagram-toolbar";
      toolbar.innerHTML = `
        <button class="diagram-btn zoom-in" title="Zoom In (+)"><i class="fa-solid fa-magnifying-glass-plus"></i><span class="btn-symbol">+</span></button>
        <button class="diagram-btn zoom-out" title="Zoom Out (-)"><i class="fa-solid fa-magnifying-glass-minus"></i><span class="btn-symbol">−</span></button>
        <button class="diagram-btn zoom-reset" title="Reset Zoom (↺)"><i class="fa-solid fa-rotate-left"></i><span class="btn-symbol">↺</span></button>
      `;
      wrapper.insertBefore(toolbar, el);

      let scale = 1.0;
      let translateX = 0;
      let translateY = 0;
      let isDragging = false;
      let startX = 0;
      let startY = 0;

      function applyTransform() {
        el.style.transformOrigin = "50% 50%";
        el.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
        el.style.transition = isDragging ? "none" : "transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)";
      }

      toolbar.querySelector(".zoom-in").addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        scale = Math.min(scale * 1.3, 5.0);
        applyTransform();
      });

      toolbar.querySelector(".zoom-out").addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        scale = Math.max(scale / 1.3, 0.3);
        applyTransform();
      });

      toolbar.querySelector(".zoom-reset").addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        scale = 1.0;
        translateX = 0;
        translateY = 0;
        applyTransform();
      });

      wrapper.addEventListener("wheel", function (e) {
        if (e.ctrlKey || e.metaKey || wrapper.matches(":hover")) {
          e.preventDefault();
          const delta = e.deltaY < 0 ? 1.15 : 0.85;
          scale = Math.min(Math.max(scale * delta, 0.3), 5.0);
          applyTransform();
        }
      }, { passive: false });

      wrapper.addEventListener("mousedown", function (e) {
        if (e.target.closest(".diagram-toolbar")) return;
        isDragging = true;
        startX = e.clientX - translateX;
        startY = e.clientY - translateY;
        wrapper.style.cursor = "grabbing";
      });

      window.addEventListener("mousemove", function (e) {
        if (!isDragging) return;
        translateX = e.clientX - startX;
        translateY = e.clientY - startY;
        applyTransform();
      });

      window.addEventListener("mouseup", function () {
        if (isDragging) {
          isDragging = false;
          wrapper.style.cursor = "grab";
        }
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", renderMermaidDiagrams);
  } else {
    renderMermaidDiagrams();
  }

  // Observe page content changes for SPA route navigation
  const targetNode = document.querySelector(".md-content") || document.body;
  if (targetNode) {
    const observer = new MutationObserver(function () {
      renderMermaidDiagrams();
    });
    observer.observe(targetNode, { childList: true, subtree: true });
  }
})();
