(() => {
  const canvases = [...document.querySelectorAll("canvas[data-research-figure]")];
  if (!canvases.length) return;

  const rootStyle = getComputedStyle(document.documentElement);
  const bodyStyle = getComputedStyle(document.body);
  const palette = {
    bg: rootStyle.getPropertyValue("--bg").trim() || "#f3f1ea",
    surface: rootStyle.getPropertyValue("--surface").trim() || "#fcfbf7",
    ink: rootStyle.getPropertyValue("--ink").trim() || "#182328",
    muted: rootStyle.getPropertyValue("--muted").trim() || "#586469",
    line: rootStyle.getPropertyValue("--line").trim() || "#d4d1c7",
    mechanics: rootStyle.getPropertyValue("--mechanics").trim() || "#985138",
    navigation: rootStyle.getPropertyValue("--navigation").trim() || "#397063",
    sensing: rootStyle.getPropertyValue("--sensing").trim() || "#52658f",
    accent: rootStyle.getPropertyValue("--accent").trim() || "#235c60"
  };
  const sans = bodyStyle.fontFamily || "system-ui, sans-serif";
  const serif = rootStyle.getPropertyValue("--serif").trim() || "Georgia, serif";

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  const rgba = (hex, alpha) => {
    const value = hex.replace("#", "");
    const expanded = value.length === 3 ? value.split("").map((v) => v + v).join("") : value;
    const number = Number.parseInt(expanded, 16);
    return `rgba(${(number >> 16) & 255}, ${(number >> 8) & 255}, ${number & 255}, ${alpha})`;
  };

  const font = (ctx, size, weight = 500, family = sans) => {
    ctx.font = `${weight} ${size}px ${family}`;
  };

  const text = (ctx, value, x, y, options = {}) => {
    const {
      size = 13,
      weight = 500,
      color = palette.ink,
      align = "left",
      baseline = "alphabetic",
      family = sans,
      alpha = 1
    } = options;
    ctx.save();
    font(ctx, size, weight, family);
    ctx.fillStyle = color;
    ctx.globalAlpha = alpha;
    ctx.textAlign = align;
    ctx.textBaseline = baseline;
    ctx.fillText(value, x, y);
    ctx.restore();
  };

  const label = (ctx, value, x, y, color = palette.muted) => {
    ctx.save();
    font(ctx, 12, 700, sans);
    ctx.fillStyle = color;
    ctx.textBaseline = "top";
    ctx.letterSpacing = "0.08em";
    ctx.fillText(value.toUpperCase(), x, y);
    ctx.restore();
  };

  const strokeLine = (ctx, x1, y1, x2, y2, options = {}) => {
    const { color = palette.line, width = 1, dash = [], alpha = 1 } = options;
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.globalAlpha = alpha;
    ctx.setLineDash(dash);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.restore();
  };

  const dot = (ctx, x, y, radius, color, fill = true, alpha = 1) => {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    if (fill) {
      ctx.fillStyle = color;
      ctx.fill();
    } else {
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
    ctx.restore();
  };

  const arrow = (ctx, x1, y1, x2, y2, options = {}) => {
    const { color = palette.ink, width = 1.5, dash = [], alpha = 1, head = 7 } = options;
    const angle = Math.atan2(y2 - y1, x2 - x1);
    strokeLine(ctx, x1, y1, x2, y2, { color, width, dash, alpha });
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.moveTo(x2 - head * Math.cos(angle - Math.PI / 6), y2 - head * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(x2, y2);
    ctx.lineTo(x2 - head * Math.cos(angle + Math.PI / 6), y2 - head * Math.sin(angle + Math.PI / 6));
    ctx.stroke();
    ctx.restore();
  };

  const cubicArrow = (ctx, start, control1, control2, end, options = {}) => {
    const { color = palette.ink, width = 1.5, dash = [], alpha = 1, head = 7 } = options;
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.globalAlpha = alpha;
    ctx.setLineDash(dash);
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.bezierCurveTo(control1.x, control1.y, control2.x, control2.y, end.x, end.y);
    ctx.stroke();
    ctx.restore();
    const angle = Math.atan2(end.y - control2.y, end.x - control2.x);
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.moveTo(end.x - head * Math.cos(angle - Math.PI / 6), end.y - head * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(end.x, end.y);
    ctx.lineTo(end.x - head * Math.cos(angle + Math.PI / 6), end.y - head * Math.sin(angle + Math.PI / 6));
    ctx.stroke();
    ctx.restore();
  };

  const phaseLoop = (ctx, cx, cy, rx, ry, color, options = {}) => {
    const { axes = true, nested = false } = options;
    if (axes) {
      strokeLine(ctx, cx - rx - 11, cy, cx + rx + 11, cy, { color: palette.muted, alpha: 0.42 });
      strokeLine(ctx, cx, cy + ry + 9, cx, cy - ry - 9, { color: palette.muted, alpha: 0.42 });
      text(ctx, "q", cx + rx + 9, cy + 4, { size: 12, color: palette.muted, family: serif });
      text(ctx, "q̇", cx - 4, cy - ry - 12, { size: 12, color: palette.muted, family: serif });
    }

    const count = nested ? 3 : 1;
    for (let layer = 0; layer < count; layer += 1) {
      const scale = nested ? 0.62 + layer * 0.19 : 1;
      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = layer === count - 1 ? 2 : 1.25;
      ctx.globalAlpha = nested ? 0.38 + layer * 0.24 : 1;
      ctx.beginPath();
      for (let i = 0; i <= 96; i += 1) {
        const t = (i / 96) * Math.PI * 2;
        const radial = 1 + 0.1 * Math.sin(3 * t + 0.4);
        const x = cx + rx * scale * radial * Math.cos(t);
        const y = cy + ry * scale * (0.92 + 0.08 * Math.cos(t)) * Math.sin(t);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();
      ctx.restore();
    }

    const t = 0.62;
    const x = cx + rx * Math.cos(t);
    const y = cy + ry * Math.sin(t);
    const tangentX = -rx * Math.sin(t);
    const tangentY = ry * Math.cos(t);
    const length = Math.hypot(tangentX, tangentY);
    arrow(ctx, x - (tangentX / length) * 7, y - (tangentY / length) * 7, x, y, { color, width: 1.5, head: 5 });
  };

  const drawSkate = (ctx, x, y, angle, color, alpha = 1) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(-10, 0);
    ctx.lineTo(10, 0);
    ctx.moveTo(-6, -4);
    ctx.lineTo(-6, 4);
    ctx.moveTo(6, -4);
    ctx.lineTo(6, 4);
    ctx.stroke();
    ctx.restore();
  };

  const drawArticulated = (ctx, x, y, scale, color, alpha = 1) => {
    const angles = [-0.28, 0.52, -0.24];
    const lengths = [0.76, 0.82, 0.7].map((v) => v * scale);
    let px = x - scale * 1.1;
    let py = y;
    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 3;
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.moveTo(px, py);
    for (let i = 0; i < lengths.length; i += 1) {
      px += Math.cos(angles[i]) * lengths[i];
      py += Math.sin(angles[i]) * lengths[i];
      ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.restore();

    px = x - scale * 1.1;
    py = y;
    dot(ctx, px, py, 3.1, color, true, alpha);
    angles.forEach((angle, i) => {
      px += Math.cos(angle) * lengths[i];
      py += Math.sin(angle) * lengths[i];
      dot(ctx, px, py, 3.1, color, true, alpha);
      if (i < 2) drawSkate(ctx, px, py + 7, angle, color, alpha * 0.85);
    });
  };

  const smoothOpenPath = (ctx, points) => {
    if (points.length < 2) return;
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 0; i < points.length - 1; i += 1) {
      const current = points[i];
      const next = points[i + 1];
      const previous = points[i - 1] || current;
      const following = points[i + 2] || next;
      const c1x = current.x + (next.x - previous.x) / 6;
      const c1y = current.y + (next.y - previous.y) / 6;
      const c2x = next.x - (following.x - current.x) / 6;
      const c2y = next.y - (following.y - current.y) / 6;
      ctx.bezierCurveTo(c1x, c1y, c2x, c2y, next.x, next.y);
    }
  };

  const smoothClosedPath = (ctx, points) => {
    const extended = [points[points.length - 1], ...points, points[0], points[1]];
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i <= points.length; i += 1) {
      const previous = extended[i - 1];
      const current = extended[i];
      const next = extended[i + 1];
      const following = extended[i + 2];
      const c1x = current.x + (next.x - previous.x) / 6;
      const c1y = current.y + (next.y - previous.y) / 6;
      const c2x = next.x - (following.x - current.x) / 6;
      const c2y = next.y - (following.y - current.y) / 6;
      ctx.bezierCurveTo(c1x, c1y, c2x, c2y, next.x, next.y);
    }
    ctx.closePath();
  };

  const drawFlexibleBeam = (ctx, x, y, width, height, color) => {
    const poses = [
      [{ x: 0, y: 0 }, { x: 0.2, y: -0.25 }, { x: 0.45, y: -0.44 }, { x: 0.72, y: -0.35 }, { x: 1, y: -0.14 }],
      [{ x: 0, y: 0 }, { x: 0.18, y: -0.38 }, { x: 0.48, y: -0.5 }, { x: 0.76, y: -0.26 }, { x: 1, y: -0.34 }],
      [{ x: 0, y: 0 }, { x: 0.24, y: -0.15 }, { x: 0.5, y: -0.38 }, { x: 0.73, y: -0.5 }, { x: 1, y: -0.24 }]
    ];
    const offsets = [0, width * 0.25, width * 0.5];
    poses.forEach((pose, index) => {
      const points = pose.map((point) => ({
        x: x + offsets[index] + point.x * width * 0.46,
        y: y + point.y * height
      }));
      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = index === poses.length - 1 ? 2.4 : 1.4;
      ctx.globalAlpha = 0.36 + index * 0.27;
      ctx.beginPath();
      smoothOpenPath(ctx, points);
      ctx.stroke();
      ctx.restore();
      drawSkate(ctx, points[0].x, points[0].y + 7, 0, color, 0.55 + index * 0.2);
      dot(ctx, points[0].x, points[0].y - 2, 7, color, false, 0.55 + index * 0.2);
      dot(ctx, points[0].x, points[0].y - 2, 2, color, true, 0.55 + index * 0.2);
    });
  };

  const drawWalker = (ctx, x, groundY, scale, color, alpha, phase = 0) => {
    const stance = phase === 0 ? -0.22 : 0.22;
    const swing = phase === 0 ? 0.42 : -0.42;
    const torso = phase === 0 ? -0.04 : 0.04;
    const hip = { x, y: groundY - Math.cos(stance) * scale };
    const foot1 = { x: hip.x + Math.sin(stance) * scale, y: hip.y + Math.cos(stance) * scale };
    const foot2 = { x: hip.x + Math.sin(swing) * scale, y: hip.y + Math.cos(swing) * scale };
    const head = { x: hip.x + Math.sin(torso) * scale * 0.72, y: hip.y - Math.cos(torso) * scale * 0.72 };
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.moveTo(foot1.x, foot1.y);
    ctx.lineTo(hip.x, hip.y);
    ctx.lineTo(foot2.x, foot2.y);
    ctx.moveTo(hip.x, hip.y);
    ctx.lineTo(head.x, head.y);
    ctx.stroke();
    ctx.restore();
    dot(ctx, hip.x, hip.y, 3.3, color, true, alpha);
    dot(ctx, foot2.x, foot2.y, 2.6, color, true, alpha);
    return { hip, foot1, foot2, head };
  };

  const panelRects = (width, height, count) => {
    const mobile = width < 620;
    const pad = clamp(width * 0.045, 18, 42);
    const gap = mobile ? 34 : 26;
    if (mobile) {
      const panelHeight = (height - pad * 2 - gap * (count - 1)) / count;
      return Array.from({ length: count }, (_, index) => ({
        x: pad,
        y: pad + index * (panelHeight + gap),
        w: width - pad * 2,
        h: panelHeight,
        mobile
      }));
    }
    const panelWidth = (width - pad * 2 - gap * (count - 1)) / count;
    return Array.from({ length: count }, (_, index) => ({
      x: pad + index * (panelWidth + gap),
      y: pad,
      w: panelWidth,
      h: height - pad * 2,
      mobile
    }));
  };

  const drawMechanics = (ctx, width, height) => {
    const panels = panelRects(width, height, 3);
    panels.forEach((panel, index) => {
      if (index > 0) {
        if (panel.mobile) strokeLine(ctx, panel.x, panel.y - 17, panel.x + panel.w, panel.y - 17, { color: palette.mechanics, alpha: 0.3 });
        else strokeLine(ctx, panel.x - 13, panel.y, panel.x - 13, panel.y + panel.h, { color: palette.mechanics, alpha: 0.26 });
      }
    });

    const articulated = panels[0];
    label(ctx, "01 · ARTICULATED", articulated.x, articulated.y, palette.mechanics);
    text(ctx, "reduced return → reconstruct Δg", articulated.x, articulated.y + 23, { size: 13, weight: 600 });
    const loopCx = articulated.x + articulated.w * 0.5;
    const loopCy = articulated.y + articulated.h * (articulated.mobile ? 0.42 : 0.34);
    phaseLoop(ctx, loopCx, loopCy, Math.min(articulated.w * 0.22, 45), Math.min(articulated.h * 0.13, 30), palette.mechanics);
    text(ctx, "exact reduced return", loopCx, loopCy + Math.min(articulated.h * 0.13, 30) + 20, { size: 12, color: palette.muted, align: "center" });
    const poseY = articulated.y + articulated.h * 0.78;
    const poseScale = clamp(articulated.w * 0.12, 24, 38);
    drawArticulated(ctx, articulated.x + articulated.w * 0.28, poseY, poseScale, palette.muted, 0.48);
    drawArticulated(ctx, articulated.x + articulated.w * 0.72, poseY, poseScale, palette.mechanics, 1);
    arrow(ctx, articulated.x + articulated.w * 0.34, poseY + 28, articulated.x + articulated.w * 0.65, poseY + 28, { color: palette.mechanics, width: 1.6 });
    text(ctx, "Δg", articulated.x + articulated.w * 0.5, poseY + 23, { size: 14, color: palette.mechanics, family: serif, align: "center" });

    const flexible = panels[1];
    label(ctx, "02 · FLEXIBLE", flexible.x, flexible.y, palette.mechanics);
    text(ctx, "skate-constrained CKte Beam", flexible.x, flexible.y + 23, { size: 13, weight: 600 });
    const beamY = flexible.y + flexible.h * 0.68;
    drawFlexibleBeam(ctx, flexible.x + flexible.w * 0.08, beamY, flexible.w * 0.8, flexible.h * 0.48, palette.mechanics);
    dot(ctx, flexible.x + flexible.w * 0.9, flexible.y + flexible.h * 0.7, 5, palette.mechanics, false);
    text(ctx, "target", flexible.x + flexible.w * 0.9, flexible.y + flexible.h * 0.7 + 18, { size: 12, color: palette.muted, align: "center" });
    text(ctx, "single rotor · numerical control", flexible.x, flexible.y + flexible.h - 5, { size: 12, color: palette.muted });

    const hybrid = panels[2];
    label(ctx, "03 · HYBRID", hybrid.x, hybrid.y, palette.mechanics);
    text(ctx, "collisionless periodic gait", hybrid.x, hybrid.y + 23, { size: 13, weight: 600 });
    const ground = hybrid.y + hybrid.h * 0.82;
    strokeLine(ctx, hybrid.x, ground, hybrid.x + hybrid.w, ground, { color: palette.muted, alpha: 0.5 });
    const walkerScale = clamp(hybrid.h * 0.22, 38, 62);
    const first = drawWalker(ctx, hybrid.x + hybrid.w * 0.3, ground, walkerScale, palette.muted, 0.5, 0);
    const second = drawWalker(ctx, hybrid.x + hybrid.w * 0.7, ground, walkerScale, palette.mechanics, 1, 1);
    cubicArrow(
      ctx,
      { x: first.foot2.x, y: first.foot2.y },
      { x: hybrid.x + hybrid.w * 0.44, y: ground - walkerScale * 0.3 },
      { x: second.foot1.x - 22, y: ground - 1 },
      { x: second.foot1.x, y: ground - 1 },
      { color: palette.mechanics, width: 1.4, dash: [4, 5] }
    );
    text(ctx, "grazing leg transfer", hybrid.x + hybrid.w * 0.5, ground + 22, { size: 12, color: palette.muted, align: "center" });
  };

  const drawCaveDomain = (ctx, rect, color) => {
    const { x, y, w, h } = rect;
    const points = [
      { x: x + w * 0.38, y: y + h * 0.96 },
      { x: x + w * 0.27, y: y + h * 0.67 },
      { x: x + w * 0.04, y: y + h * 0.48 },
      { x: x + w * 0.02, y: y + h * 0.3 },
      { x: x + w * 0.18, y: y + h * 0.26 },
      { x: x + w * 0.43, y: y + h * 0.48 },
      { x: x + w * 0.54, y: y + h * 0.44 },
      { x: x + w * 0.75, y: y + h * 0.15 },
      { x: x + w * 0.94, y: y + h * 0.12 },
      { x: x + w * 0.98, y: y + h * 0.27 },
      { x: x + w * 0.67, y: y + h * 0.56 },
      { x: x + w * 0.6, y: y + h * 0.69 },
      { x: x + w * 0.58, y: y + h * 0.96 }
    ];
    ctx.save();
    ctx.beginPath();
    smoothClosedPath(ctx, points);
    ctx.fillStyle = rgba(palette.surface, 0.68);
    ctx.fill();
    ctx.strokeStyle = palette.ink;
    ctx.lineWidth = 1.6;
    ctx.stroke();
    ctx.clip();

    const branchLines = [
      [{ x: x + w * 0.48, y: y + h * 0.91 }, { x: x + w * 0.48, y: y + h * 0.58 }, { x: x + w * 0.18, y: y + h * 0.35 }],
      [{ x: x + w * 0.48, y: y + h * 0.91 }, { x: x + w * 0.52, y: y + h * 0.57 }, { x: x + w * 0.84, y: y + h * 0.2 }]
    ];
    [-10, 10].forEach((offset) => {
      branchLines.forEach((line) => {
        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.17;
        ctx.beginPath();
        const shifted = line.map((point, index) => ({ x: point.x + (index === 0 ? offset * 0.4 : offset), y: point.y }));
        smoothOpenPath(ctx, shifted);
        ctx.stroke();
        ctx.restore();
      });
    });

    const skeleton = [
      [{ x: x + w * 0.48, y: y + h * 0.92 }, { x: x + w * 0.5, y: y + h * 0.58 }, { x: x + w * 0.14, y: y + h * 0.36 }],
      [{ x: x + w * 0.5, y: y + h * 0.58 }, { x: x + w * 0.85, y: y + h * 0.2 }]
    ];
    skeleton.forEach((line) => {
      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      smoothOpenPath(ctx, line);
      ctx.stroke();
      ctx.restore();
    });

    const sections = [
      [x + w * 0.34, y + h * 0.78, 0],
      [x + w * 0.23, y + h * 0.43, -0.85],
      [x + w * 0.72, y + h * 0.34, 0.75]
    ];
    sections.forEach(([cx, cy, angle]) => {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angle);
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.2;
      ctx.globalAlpha = 0.7;
      ctx.beginPath();
      ctx.moveTo(-18, 0);
      ctx.lineTo(18, 0);
      ctx.stroke();
      ctx.restore();
    });
    ctx.restore();
    dot(ctx, x + w * 0.5, y + h * 0.58, 4, color, true);
    return {
      junction: { x: x + w * 0.5, y: y + h * 0.58 },
      endpoints: [
        { x: x + w * 0.14, y: y + h * 0.36 },
        { x: x + w * 0.85, y: y + h * 0.2 },
        { x: x + w * 0.48, y: y + h * 0.92 }
      ]
    };
  };

  const drawReebGraph = (ctx, rect, color) => {
    const { x, y, w, h } = rect;
    label(ctx, "TOPOLOGY", x, y, color);
    const junction = { x: x + w * 0.48, y: y + h * 0.43 };
    const nodes = [
      { x: x + w * 0.16, y: y + h * 0.18 },
      { x: x + w * 0.83, y: y + h * 0.14 },
      { x: x + w * 0.5, y: y + h * 0.74 }
    ];
    nodes.forEach((node) => strokeLine(ctx, junction.x, junction.y, node.x, node.y, { color, width: 2 }));
    dot(ctx, junction.x, junction.y, 4.2, color, true);
    nodes.forEach((node) => dot(ctx, node.x, node.y, 3.6, color, false));

    const circle = { x: x + w * 0.22, y: y + h * 0.88, r: clamp(Math.min(w, h) * 0.055, 9, 14) };
    dot(ctx, circle.x, circle.y, circle.r, palette.muted, false, 0.7);
    [-0.7, 0.2, 1.65, 2.7].forEach((angle, index) => {
      const radius = circle.r + [4, -3, 6, -4][index];
      const x1 = circle.x + Math.cos(angle) * circle.r;
      const y1 = circle.y + Math.sin(angle) * circle.r;
      const x2 = circle.x + Math.cos(angle) * radius;
      const y2 = circle.y + Math.sin(angle) * radius;
      strokeLine(ctx, x1, y1, x2, y2, { color, width: 2 });
    });
    text(ctx, "m(θ) · S¹", x + w * 0.65, circle.y + 4, { size: 12, color, family: serif, align: "center" });
  };

  const drawNavigation = (ctx, width, height) => {
    const mobile = width < 440;
    const pad = clamp(width * 0.05, 18, 32);
    label(ctx, "SYNTHETIC DOMAIN", pad, pad, palette.navigation);
    if (!mobile) {
      const domain = { x: pad, y: pad + 26, w: width * 0.6, h: height - pad * 2 - 30 };
      drawCaveDomain(ctx, domain, palette.navigation);
      text(ctx, "d(x,y) · distance field", domain.x, domain.y + domain.h + 16, { size: 12, color: palette.muted });
      arrow(ctx, width * 0.66, height * 0.49, width * 0.72, height * 0.49, { color: palette.navigation, width: 1.5 });
      drawReebGraph(ctx, { x: width * 0.73, y: pad, w: width - width * 0.73 - pad, h: height - pad * 2 }, palette.navigation);
    } else {
      const domain = { x: pad, y: pad + 25, w: width - pad * 2, h: height * 0.53 };
      drawCaveDomain(ctx, domain, palette.navigation);
      text(ctx, "distance · cells · skeleton", domain.x, domain.y + domain.h + 17, { size: 12, color: palette.muted });
      arrow(ctx, width * 0.5, domain.y + domain.h + 30, width * 0.5, domain.y + domain.h + 56, { color: palette.navigation, width: 1.5 });
      drawReebGraph(ctx, { x: pad, y: domain.y + domain.h + 62, w: width - pad * 2, h: height - domain.y - domain.h - 72 }, palette.navigation);
    }
  };

  const drawSensorHead = (ctx, cx, cy, radius, color) => {
    ctx.save();
    ctx.strokeStyle = palette.ink;
    ctx.lineWidth = 1.5;
    ctx.fillStyle = rgba(palette.surface, 0.82);
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.lineWidth = 5;
    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, -Math.PI / 2 + 0.08, -0.05);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0.05, Math.PI / 2 - 0.08);
    ctx.stroke();
    ctx.strokeStyle = palette.muted;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, Math.PI / 2 + 0.08, Math.PI * 1.5 - 0.08);
    ctx.stroke();
    ctx.restore();
    text(ctx, "+1", cx + radius + 5, cy - radius * 0.45, { size: 12, color });
    text(ctx, "+2", cx + radius + 5, cy + radius * 0.55, { size: 12, color });
    text(ctx, "N", cx - radius - 10, cy + 4, { size: 12, color: palette.muted, align: "right" });
    arrow(ctx, cx, cy, cx + radius * 1.55, cy, { color: palette.muted, width: 1, head: 5 });
    arrow(ctx, cx, cy, cx, cy - radius * 1.45, { color: palette.muted, width: 1, head: 5 });
    text(ctx, "u", cx + radius * 1.55 + 7, cy + 4, { size: 12, family: serif, color: palette.muted });
    text(ctx, "v", cx - 4, cy - radius * 1.45 - 8, { size: 12, family: serif, color: palette.muted });
  };

  const drawConductivePath = (ctx, start, target, end, color, offset, alpha, width) => {
    const side = Math.sign(offset) || 1;
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.bezierCurveTo(
      start.x + (target.x - start.x) * 0.42,
      start.y + offset,
      target.x - target.rx * 1.1,
      target.y + side * (target.ry + Math.abs(offset) * 0.35),
      target.x + target.rx * 1.25,
      target.y + side * (target.ry + Math.abs(offset) * 0.45)
    );
    ctx.bezierCurveTo(
      target.x - target.rx * 0.1,
      target.y + side * (target.ry * 2 + Math.abs(offset) * 0.35),
      end.x - 16,
      end.y + offset * 0.25,
      end.x,
      end.y
    );
    ctx.stroke();
    ctx.restore();
  };

  const drawSensing = (ctx, width, height) => {
    const mobile = width < 440;
    const pad = clamp(width * 0.05, 18, 32);
    const topHeight = mobile ? height * 0.6 : height - pad * 2;
    const fieldWidth = mobile ? width - pad * 2 : width * 0.54;
    const fieldX = pad;
    const fieldY = pad;
    label(ctx, "2D CONDUCTIVE MODEL", fieldX, fieldY, palette.sensing);
    const sensor = {
      x: fieldX + fieldWidth * 0.2,
      y: fieldY + topHeight * 0.57,
      r: clamp(Math.min(fieldWidth, topHeight) * 0.12, 24, 38)
    };
    drawSensorHead(ctx, sensor.x, sensor.y, sensor.r, palette.sensing);

    const target = {
      x: fieldX + fieldWidth * 0.72,
      y: fieldY + topHeight * 0.48,
      rx: clamp(fieldWidth * 0.09, 22, 38),
      ry: clamp(topHeight * 0.12, 18, 34)
    };
    ctx.save();
    ctx.fillStyle = rgba(palette.sensing, 0.13);
    ctx.strokeStyle = palette.sensing;
    ctx.lineWidth = 1.7;
    ctx.beginPath();
    ctx.ellipse(target.x, target.y, target.rx, target.ry, -0.28, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    text(ctx, "δσ", target.x, target.y + 4, { size: 13, family: serif, color: palette.sensing, align: "center" });

    const rear = { x: sensor.x - sensor.r * 0.92, y: sensor.y };
    [-20, -10, 10, 20].forEach((offset, index) => {
      const upper = index < 2;
      const start = {
        x: sensor.x + sensor.r * 0.88,
        y: sensor.y + (upper ? -1 : 1) * sensor.r * (index % 2 === 0 ? 0.52 : 0.25)
      };
      const end = { x: rear.x, y: rear.y + (upper ? -1 : 1) * sensor.r * 0.36 };
      drawConductivePath(ctx, start, target, end, index === 1 || index === 2 ? palette.sensing : palette.muted, offset, index === 1 || index === 2 ? 0.88 : 0.38, index === 1 || index === 2 ? 1.6 : 1.05);
    });
    text(ctx, "schematic support", fieldX + fieldWidth * 0.47, fieldY + topHeight * 0.88, { size: 12, color: palette.muted, align: "center" });
    text(ctx, "water · σ₀", fieldX, fieldY + topHeight - 8, { size: 12, color: palette.muted });

    const modelX = mobile ? pad : width * 0.61;
    const modelY = mobile ? height * 0.67 : pad;
    const modelW = mobile ? width - pad * 2 : width - modelX - pad;
    const modelH = mobile ? height - modelY - pad : height - pad * 2;
    if (mobile) strokeLine(ctx, pad, modelY - 18, width - pad, modelY - 18, { color: palette.sensing, alpha: 0.28 });
    else strokeLine(ctx, modelX - width * 0.035, pad, modelX - width * 0.035, height - pad, { color: palette.sensing, alpha: 0.28 });
    label(ctx, "SENSITIVITY MODEL", modelX, modelY, palette.sensing);
    text(ctx, "forward · adjoint fields", modelX, modelY + 30, { size: 12, color: palette.muted });
    text(ctx, "Kₖ(r) = −E₀ᵉˣᶜ(r) · E⁽ᵏ⁾(r)", modelX, modelY + 61, { size: clamp(modelW * 0.05, 11, 14), family: serif, color: palette.ink });
    arrow(ctx, modelX, modelY + 86, modelX + modelW * 0.34, modelY + 86, { color: palette.sensing, width: 1.4 });
    text(ctx, "ΔI ≈ K δσ", modelX, modelY + 119, { size: clamp(modelW * 0.065, 14, 18), family: serif, color: palette.sensing });

    const channelY = modelY + modelH * 0.68;
    text(ctx, "δIax = ½(ΔI₁ + ΔI₂)", modelX, channelY, { size: clamp(modelW * 0.05, 11, 13), color: palette.sensing, family: serif });
    text(ctx, "δIlat = ½(ΔI₁ − ΔI₂)", modelX, channelY + 32, { size: clamp(modelW * 0.05, 11, 13), color: palette.sensing, family: serif });
    text(ctx, "fast linearized prediction", modelX, modelY + modelH - 5, { size: 12, color: palette.muted });
  };

  const box = (ctx, x, y, w, h, options = {}) => {
    const {
      stroke = palette.accent,
      fill = rgba(palette.surface, 0.76),
      dash = [],
      radius = 8,
      width = 1.4
    } = options;
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, radius);
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.strokeStyle = stroke;
    ctx.lineWidth = width;
    ctx.setLineDash(dash);
    ctx.stroke();
    ctx.restore();
  };

  const wrappedText = (ctx, value, x, y, maxWidth, options = {}) => {
    const { size = 12, weight = 600, color = palette.ink, lineHeight = size * 1.3, align = "center" } = options;
    ctx.save();
    font(ctx, size, weight, sans);
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.textBaseline = "top";
    const words = value.split(/\s+/);
    const lines = [];
    let line = "";
    words.forEach((word) => {
      const candidate = line ? `${line} ${word}` : word;
      if (line && ctx.measureText(candidate).width > maxWidth) {
        lines.push(line);
        line = word;
      } else {
        line = candidate;
      }
    });
    if (line) lines.push(line);
    lines.forEach((entry, index) => ctx.fillText(entry, x, y + index * lineHeight));
    ctx.restore();
    return lines.length * lineHeight;
  };

  const drawThesis = (ctx, width, height) => {
    const pad = clamp(width * 0.065, 22, 36);
    const contentW = width - pad * 2;
    const gap = 18;
    const boxH = clamp((height - pad * 2 - gap * 4 - 70) / 3, 88, 112);
    const colors = [palette.mechanics, palette.accent, palette.navigation];
    const titles = ["SOLVE THE FIELD", "RETURN THE REDUCED STATE", "RECONSTRUCT THE POSE"];
    const formulae = ["ż = f₀(z)", "z(T) = z(0)", "Δg ≠ eᴳ"];
    const descriptions = [
      "The timed trajectory is mechanically admissible.",
      "The repeatable event is nontrivial and phase-fixed.",
      "Pose stays open and supplies the declared output."
    ];

    let y = pad;
    titles.forEach((title, index) => {
      box(ctx, pad, y, contentW, boxH, {
        stroke: colors[index],
        fill: rgba(colors[index], 0.07)
      });
      label(ctx, `0${index + 1} · ${title}`, pad + 18, y + 15, colors[index]);
      text(ctx, formulae[index], pad + 18, y + 53, {
        size: 19,
        family: serif,
        color: palette.ink
      });
      wrappedText(ctx, descriptions[index], pad + contentW * 0.55, y + 45, contentW * 0.38, {
        size: 12,
        weight: 520,
        color: palette.muted,
        align: "left"
      });
      if (index < titles.length - 1) {
        arrow(ctx, width / 2, y + boxH + 4, width / 2, y + boxH + gap - 4, {
          color: palette.lineStrong || palette.muted,
          width: 1.2,
          head: 5
        });
      }
      y += boxH + gap;
    });

    const familyY = y + 5;
    box(ctx, pad, familyY, contentW, 65, {
      stroke: palette.accent,
      fill: rgba(palette.accent, 0.12),
      width: 1.7
    });
    text(ctx, "QUALIFIED NATURAL-LOCOMOTION CYCLE", width / 2, familyY + 24, {
      size: 12,
      weight: 760,
      color: palette.accentDark || palette.accent,
      align: "center"
    });
    text(ctx, "continuation and modal organization come afterwards", width / 2, familyY + 46, {
      size: 11.5,
      color: palette.muted,
      align: "center"
    });
  };

  const drawPlotLine = (ctx, valuesX, valuesY, transformX, transformY, options = {}) => {
    const { color = palette.accent, width = 2, dash = [], alpha = 1 } = options;
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.globalAlpha = alpha;
    ctx.setLineDash(dash);
    ctx.beginPath();
    valuesX.forEach((value, index) => {
      const px = transformX(value);
      const py = transformY(valuesY[index]);
      if (index === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.stroke();
    ctx.restore();
  };

  const drawFamily = (ctx, width, height) => {
    const familyData = window.THESIS_FAMILY_DATA;
    if (!familyData) {
      wrappedText(ctx, "Audited family data could not be loaded.", width / 2, height / 2, width * 0.8, { color: palette.muted });
      return;
    }
    const mobile = width < 700;
    const pad = clamp(width * 0.045, 18, 40);
    const gap = mobile ? 42 : 46;
    const plotRect = mobile
      ? { x: pad + 38, y: pad + 48, w: width - pad * 2 - 52, h: height * 0.28 }
      : { x: pad + 42, y: pad + 54, w: width * 0.38 - pad, h: height - pad * 2 - 95 };
    const waveRect = mobile
      ? { x: pad + 38, y: plotRect.y + plotRect.h + gap + 32, w: width - pad * 2 - 52, h: height - plotRect.y - plotRect.h - gap - pad - 42 }
      : { x: width * 0.48, y: pad + 54, w: width - width * 0.48 - pad, h: height - pad * 2 - 65 };

    label(ctx, "A · PERIOD BACKBONE", plotRect.x - 38, pad, palette.mechanics);
    text(ctx, "379 corrected cycles", plotRect.x - 38, pad + 24, { size: 12, color: palette.muted });
    const xMin = -200;
    const xMax = 200;
    const yMin = 0.66;
    const yMax = 0.805;
    const xMap = (value) => plotRect.x + ((value - xMin) / (xMax - xMin)) * plotRect.w;
    const yMap = (value) => plotRect.y + plotRect.h - ((value - yMin) / (yMax - yMin)) * plotRect.h;
    [-200, 0, 200].forEach((tick) => {
      strokeLine(ctx, xMap(tick), plotRect.y, xMap(tick), plotRect.y + plotRect.h, { color: palette.line, alpha: 0.55 });
      text(ctx, String(tick), xMap(tick), plotRect.y + plotRect.h + 20, { size: 11, color: palette.muted, align: "center" });
    });
    [0.67, 0.73, 0.79].forEach((tick) => {
      strokeLine(ctx, plotRect.x, yMap(tick), plotRect.x + plotRect.w, yMap(tick), { color: palette.line, alpha: 0.55 });
      text(ctx, tick.toFixed(2), plotRect.x - 9, yMap(tick) + 4, { size: 11, color: palette.muted, align: "right" });
    });
    strokeLine(ctx, plotRect.x, plotRect.y + plotRect.h, plotRect.x + plotRect.w, plotRect.y + plotRect.h, { color: palette.ink, alpha: 0.75 });
    strokeLine(ctx, plotRect.x, plotRect.y, plotRect.x, plotRect.y + plotRect.h, { color: palette.ink, alpha: 0.75 });
    drawPlotLine(
      ctx,
      familyData.backbone.meanSpeed,
      familyData.backbone.period,
      xMap,
      yMap,
      { color: palette.mechanics, width: 2.4 }
    );
    const memberColors = [palette.mechanics, palette.navigation, palette.sensing];
    familyData.representatives.forEach((member, index) => {
      dot(ctx, xMap(member.meanSpeed), yMap(member.period), 5, memberColors[index], true);
      text(ctx, member.label, xMap(member.meanSpeed), yMap(member.period) - 10, { size: 11, weight: 760, color: memberColors[index], align: "center" });
    });
    text(ctx, "mean speed v̄", plotRect.x + plotRect.w / 2, plotRect.y + plotRect.h + 42, { size: 12, color: palette.muted, align: "center" });
    ctx.save();
    ctx.translate(plotRect.x - 35, plotRect.y + plotRect.h / 2);
    ctx.rotate(-Math.PI / 2);
    text(ctx, "period T", 0, 0, { size: 12, color: palette.muted, align: "center" });
    ctx.restore();

    label(ctx, "B · CHOREOGRAPHY", waveRect.x - 38, mobile ? waveRect.y - 42 : pad, palette.accent);
    const rowGap = 17;
    const rowH = (waveRect.h - rowGap * 2) / 3;
    familyData.representatives.forEach((member, index) => {
      const rowY = waveRect.y + index * (rowH + rowGap);
      const left = waveRect.x;
      const right = waveRect.x + waveRect.w;
      const center = rowY + rowH * 0.58;
      strokeLine(ctx, left, center, right, center, { color: palette.line, alpha: 0.7 });
      const phaseMap = (value) => left + value * waveRect.w;
      const signalMap = (value) => center - value * rowH * 0.34;
      drawPlotLine(ctx, member.phase, member.joint, phaseMap, signalMap, { color: palette.mechanics, width: 2 });
      drawPlotLine(ctx, member.phase, member.heading, phaseMap, signalMap, { color: palette.sensing, width: 1.7, dash: [6, 4] });
      text(ctx, `${member.label} · v̄ ${member.meanSpeed.toFixed(1)} · THD ${member.yawRateThdPercent.toFixed(1)}%`, left, rowY + 11, { size: 11.5, weight: 680, color: memberColors[index] });
      if (index === 0) {
        text(ctx, "joint", right - 88, rowY + 11, { size: 11, color: palette.mechanics });
        text(ctx, "heading", right, rowY + 11, { size: 11, color: palette.sensing, align: "right" });
      }
    });
    text(ctx, "normalized cycle phase", waveRect.x + waveRect.w / 2, waveRect.y + waveRect.h + 23, { size: 12, color: palette.muted, align: "center" });
  };

  const drawReturnBoundary = (ctx, width, height) => {
    const panels = panelRects(width, height, 2);
    panels.forEach((panel, index) => {
      const color = index === 0 ? palette.accent : palette.mechanics;
      label(ctx, index === 0 ? "2SEG · SCALAR SECTION" : "3SEG · VECTOR SECTION", panel.x, panel.y, color);
      text(ctx, index === 0 ? "one unresolved return coordinate" : "several unresolved return coordinates", panel.x, panel.y + 24, { size: 12.5, weight: 620 });
      const plot = { x: panel.x + 34, y: panel.y + 65, w: panel.w - 55, h: panel.h * 0.55 };
      if (index === 0) {
        strokeLine(ctx, plot.x, plot.y + plot.h, plot.x + plot.w, plot.y + plot.h, { color: palette.ink, alpha: 0.65 });
        strokeLine(ctx, plot.x, plot.y + plot.h, plot.x, plot.y, { color: palette.ink, alpha: 0.65 });
        const xs = Array.from({ length: 50 }, (_, i) => i / 49);
        const ys = xs.map((value) => 0.12 + 0.78 * value * value);
        const xMap = (value) => plot.x + value * plot.w;
        const yMap = (value) => plot.y + plot.h - value * plot.h;
        drawPlotLine(ctx, xs, ys, xMap, yMap, { color, width: 2.4 });
        const sigma = 0.63;
        const storage = 0.12 + 0.78 * sigma * sigma;
        strokeLine(ctx, plot.x, yMap(storage), xMap(sigma), yMap(storage), { color, dash: [4, 4], alpha: 0.75 });
        dot(ctx, xMap(sigma), yMap(storage), 5, color, true);
        text(ctx, "single endpoint", xMap(sigma), yMap(storage) - 12, { size: 11, color, align: "center" });
        text(ctx, "crossing speed σ", plot.x + plot.w / 2, plot.y + plot.h + 25, { size: 11.5, color: palette.muted, align: "center" });
        text(ctx, "storage", plot.x - 10, plot.y - 5, { size: 11.5, color: palette.muted, align: "right" });
        wrappedText(ctx, "After the other rows close: Iₑₓ = 0  ⇔  σ⁺ = σ₀", panel.x + panel.w / 2, panel.y + panel.h - 48, panel.w * 0.88, { size: 12.5, weight: 680, color, align: "center" });
      } else {
        const cx = plot.x + plot.w / 2;
        const cy = plot.y + plot.h * 0.52;
        const rx = plot.w * 0.38;
        const ry = plot.h * 0.34;
        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, -0.18, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
        [0.2, 1.35, 2.6, 4.2, 5.5].forEach((angle, pointIndex) => {
          const px = cx + rx * Math.cos(angle) * Math.cos(-0.18) - ry * Math.sin(angle) * Math.sin(-0.18);
          const py = cy + rx * Math.cos(angle) * Math.sin(-0.18) + ry * Math.sin(angle) * Math.cos(-0.18);
          dot(ctx, px, py, pointIndex === 1 ? 5 : 3.5, pointIndex === 1 ? palette.accent : color, pointIndex === 1);
        });
        dot(ctx, cx, cy, 3, palette.muted, true, 0.65);
        text(ctx, "same storage level", cx, plot.y + plot.h + 15, { size: 11.5, color: palette.muted, align: "center" });
        wrappedText(ctx, "one balance leaves many endpoints → full vector return", panel.x + panel.w / 2, panel.y + panel.h - 48, panel.w * 0.88, { size: 12.5, weight: 680, color, align: "center" });
      }
    });
  };

  const drawEvidence = (ctx, width, height) => {
    const mobile = width < 720;
    const pad = clamp(width * 0.04, 18, 36);
    const established = { stroke: palette.accent, fill: rgba(palette.accent, 0.07) };
    const future = { stroke: palette.muted, fill: rgba(palette.muted, 0.035), dash: [6, 5] };
    const node = (x, y, w, h, title, subtitle, kind = established) => {
      box(ctx, x, y, w, h, kind);
      wrappedText(ctx, title, x + w / 2, y + 15, w - 22, { size: 12, weight: 720, color: kind === future ? palette.muted : palette.ink });
      wrappedText(ctx, subtitle, x + w / 2, y + h - 32, w - 18, { size: 10.5, weight: 520, color: palette.muted });
    };

    if (mobile) {
      const w = width - pad * 2;
      const h = 67;
      const gap = 23;
      const entries = [
        ["Conservative families", "numerical construction", established],
        ["Scalar theorem / vector boundary", "exact scope by return dimension", established],
        ["One same-model bridge", "local numerical branch", established],
        ["Parameter-distinct RLM", "separate audited response map", established],
        ["Local phase–speed navigation", "nominal demonstration", established],
        ["Stability · recovery · hardware", "open research-programme links", future]
      ];
      entries.forEach(([title, subtitle, kind], index) => {
        const y = pad + index * (h + gap);
        node(pad, y, w, h, title, subtitle, kind);
        if (index < entries.length - 1) {
          const dashed = index === 2 || index === 4;
          arrow(ctx, width / 2, y + h + 4, width / 2, y + h + gap - 4, { color: dashed ? palette.muted : palette.accent, width: 1.3, dash: dashed ? [5, 4] : [] });
        }
      });
      return;
    }

    const gapX = 34;
    const nodeW = (width - pad * 2 - gapX * 2) / 3;
    const nodeH = 82;
    const topY = pad;
    const secondY = topY + nodeH + 70;
    const thirdY = secondY + nodeH + 55;
    const x1 = pad;
    const x2 = pad + nodeW + gapX;
    const x3 = x2 + nodeW + gapX;
    node(x1, topY, nodeW, nodeH, "Conservative families", "numerical construction");
    node(x2, topY, nodeW, nodeH, "Scalar theorem / vector boundary", "return dimension sets the scope");
    node(x3, topY, nodeW, nodeH, "One same-model bridge", "local numerical branch");
    node(x1, secondY, nodeW, nodeH, "Whole-family persistence", "orbital stability remains open", future);
    node(x2, secondY, nodeW, nodeH, "Parameter-distinct RLM", "separate audited response map");
    node(x3, secondY, nodeW, nodeH, "Local phase–speed navigation", "nominal demonstration");
    node(x3, thirdY, nodeW, nodeH, "Robustness · recovery · hardware", "open validation programme", future);

    arrow(ctx, x1 + nodeW + 5, topY + nodeH / 2, x2 - 5, topY + nodeH / 2, { color: palette.accent, width: 1.5 });
    arrow(ctx, x2 + nodeW + 5, topY + nodeH / 2, x3 - 5, topY + nodeH / 2, { color: palette.accent, width: 1.5 });
    arrow(ctx, x2 + nodeW + 5, secondY + nodeH / 2, x3 - 5, secondY + nodeH / 2, { color: palette.accent, width: 1.5 });
    arrow(ctx, x1 + nodeW / 2, topY + nodeH + 5, x1 + nodeW / 2, secondY - 5, { color: palette.muted, width: 1.3, dash: [5, 4] });
    arrow(ctx, x3 + nodeW * 0.32, topY + nodeH + 5, x2 + nodeW * 0.72, secondY - 5, { color: palette.muted, width: 1.3, dash: [5, 4] });
    arrow(ctx, x3 + nodeW / 2, secondY + nodeH + 5, x3 + nodeW / 2, thirdY - 5, { color: palette.muted, width: 1.3, dash: [5, 4] });
    text(ctx, "missing identification", x2 + nodeW * 0.86, secondY - 18, { size: 10.5, color: palette.muted, align: "center" });
  };

  const renderers = {
    mechanics: drawMechanics,
    navigation: drawNavigation,
    sensing: drawSensing,
    thesis: drawThesis,
    family: drawFamily,
    "return-boundary": drawReturnBoundary,
    evidence: drawEvidence
  };

  const synchronizeHeight = (canvas, width) => {
    const figure = canvas.dataset.researchFigure;
    let height = "";
    if (figure === "mechanics" && width < 620) height = "752px";
    if (figure === "navigation" && width < 440) height = "640px";
    if (figure === "sensing" && width < 440) height = "720px";
    if (figure === "family" && width < 700) height = "780px";
    if (figure === "return-boundary" && width < 620) height = "760px";
    if (figure === "evidence" && width < 720) height = "590px";
    if (canvas.style.height !== height) canvas.style.height = height;
  };

  const render = (canvas) => {
    const initialBounds = canvas.getBoundingClientRect();
    synchronizeHeight(canvas, initialBounds.width);
    const bounds = canvas.getBoundingClientRect();
    const width = Math.max(1, Math.round(bounds.width));
    const height = Math.max(1, Math.round(bounds.height));
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const physicalWidth = Math.round(width * dpr);
    const physicalHeight = Math.round(height * dpr);
    if (canvas.width !== physicalWidth || canvas.height !== physicalHeight) {
      canvas.width = physicalWidth;
      canvas.height = physicalHeight;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    const renderer = renderers[canvas.dataset.researchFigure];
    if (renderer) renderer(ctx, width, height);
  };

  let scheduled = false;
  const renderAll = () => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      canvases.forEach(render);
      scheduled = false;
    });
  };

  if ("ResizeObserver" in window) {
    const observer = new ResizeObserver(renderAll);
    canvases.forEach((canvas) => observer.observe(canvas));
  } else {
    window.addEventListener("resize", renderAll, { passive: true });
  }

  renderAll();
  if (document.fonts?.ready) document.fonts.ready.then(renderAll);
})();
