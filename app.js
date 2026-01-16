(() => {
  const priceCanvas = document.getElementById("priceChart");
  const cvdCanvas = document.getElementById("cvdChart");
  const priceScaleEl = document.getElementById("priceScale");
  const volumeProfileEl = document.getElementById("volumeProfile");
  const orderbookRows = document.getElementById("orderbookRows");
  const thresholdInput = document.getElementById("thresholdInput");
  const magnetToggle = document.getElementById("magnetToggle");
  const tfButtons = Array.from(document.querySelectorAll(".tf-btn"));

  const state = {
    threshold: Number(thresholdInput.value) || 0,
    timeframe: "1h",
    magnet: false,
  };

  let currentScale = null;

  const colors = {
    bull: "#36c88a",
    bear: "#e0656a",
    neutral: "#7b8ba3",
    grid: "#1b2636",
    wick: "#8ba0ba",
    bubbleBuy: "rgba(64, 196, 128, 0.35)",
    bubbleSell: "rgba(226, 96, 106, 0.35)",
  };

  const mock = generateMockData();

  thresholdInput.addEventListener("input", () => {
    state.threshold = Number(thresholdInput.value) || 0;
    render();
  });

  magnetToggle.addEventListener("click", () => {
    state.magnet = !state.magnet;
    magnetToggle.classList.toggle("active", state.magnet);
    render();
  });

  tfButtons.forEach((btn) =>
    btn.addEventListener("click", () => {
      tfButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      state.timeframe = btn.dataset.tf;
      render();
    })
  );

  window.addEventListener("resize", render);

  render();

  function render() {
    drawPriceChart(mock.candles);
    drawCvdChart(mock.cvdSeries);
    renderPriceScale(mock.candles, mock.volumeProfile);
    renderVolumeProfile(mock.volumeProfile);
    renderOrderbook(mock.orderBook);
  }

  function generateMockData() {
    let seed = 7;
    const rand = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };

    const times = [
      "09:00",
      "09:30",
      "10:20",
      "11:10",
      "12:00",
      "13:00",
      "13:40",
      "14:30",
      "15:20",
      "16:10",
      "17:00",
      "18:00",
      "19:00",
      "20:00",
    ];

    let price = 168.2;
    const candles = [];
    times.forEach((time, idx) => {
      const drift = Math.sin(idx * 0.6) * 0.8 + (rand() - 0.5) * 1.6;
      const open = price;
      const close = open + drift;
      const high = Math.max(open, close) + 0.8 + rand() * 0.9;
      const low = Math.min(open, close) - 0.7 - rand() * 0.9;
      price = close;

      const bidVolume = Math.floor(1600 + rand() * 2200);
      const askVolume = Math.floor(1600 + rand() * 2200);

      const footprint = [];
      for (let i = 0; i < 4; i += 1) {
        const mid = low + ((high - low) * (i + 1)) / 5;
        const bid = Math.floor(80 + rand() * 420);
        const ask = Math.floor(80 + rand() * 420);
        footprint.push({ price: mid, bid, ask });
      }

      const bubbles = [];
      if (rand() > 0.58) {
        const volume = +(0.8 + rand() * 8).toFixed(2);
        bubbles.push({
          volume,
          price: close + (rand() - 0.5) * 1.5,
          side: rand() > 0.5 ? "buy" : "sell",
        });
      }

      candles.push({
        time,
        open,
        close,
        high,
        low,
        bidVolume,
        askVolume,
        footprint,
        bubbles,
      });
    });

    let runningCvd = 0;
    const cvdSeries = candles.map((c) => {
      const delta = c.askVolume - c.bidVolume;
      runningCvd += delta;
      return {
        time: c.time,
        buyer: Math.max(0, delta),
        seller: Math.max(0, -delta),
        total: runningCvd,
      };
    });

    const profileMap = new Map();
    candles.forEach((candle) => {
      const bucket = Math.round(candle.close * 2) / 2;
      const vol = candle.askVolume + candle.bidVolume;
      const entry = profileMap.get(bucket) || { price: bucket, volume: 0, side: "buy" };
      entry.volume += vol;
      entry.side = candle.askVolume >= candle.bidVolume ? "ask" : "bid";
      profileMap.set(bucket, entry);
    });

    const volumeProfile = Array.from(profileMap.values()).sort((a, b) => b.price - a.price);
    const pocVolume = Math.max(...volumeProfile.map((v) => v.volume));
    volumeProfile.forEach((v) => (v.isPoc = v.volume === pocVolume));

    const lastPrice = candles[candles.length - 1].close;
    const orderBook = { bids: [], asks: [] };
    for (let i = 1; i <= 12; i += 1) {
      const size = Math.floor(200 + rand() * 1400) * (1 + (12 - i) * 0.04);
      orderBook.bids.push({ price: +(lastPrice - i * 0.25).toFixed(2), size, side: "bid" });
    }
    for (let i = 1; i <= 12; i += 1) {
      const size = Math.floor(200 + rand() * 1400) * (1 + (12 - i) * 0.04);
      orderBook.asks.push({ price: +(lastPrice + i * 0.25).toFixed(2), size, side: "ask" });
    }

    orderBook.bids.sort((a, b) => b.price - a.price);
    orderBook.asks.sort((a, b) => a.price - b.price);

    const footprintMax = Math.max(...candles.flatMap((c) => c.footprint.map((f) => f.bid + f.ask)));
    const bubbleVolumes = candles.flatMap((c) => c.bubbles.map((b) => b.volume));
    const bubbleMax = Math.max(1, ...bubbleVolumes, 1);
    const avgBubbleVolume =
      bubbleVolumes.reduce((sum, v) => sum + v, 0) / Math.max(1, bubbleVolumes.length);

    return {
      candles,
      cvdSeries,
      volumeProfile,
      orderBook,
      footprintMax,
      bubbleMax,
      avgBubbleVolume: avgBubbleVolume || 1,
    };
  }

  function sizeCanvas(canvas) {
    const { width, height } = canvas.getBoundingClientRect();
    const ratio = window.devicePixelRatio || 1;
    canvas.width = width * ratio;
    canvas.height = height * ratio;
    const ctx = canvas.getContext("2d");
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    return { width, height, ctx };
  }

  function drawPriceChart(candles) {
    const { width, height, ctx } = sizeCanvas(priceCanvas);
    const padding = { top: 30, bottom: 40, left: 60, right: 140 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const minPrice = Math.min(...candles.map((c) => c.low)) - 0.6;
    const maxPrice = Math.max(...candles.map((c) => c.high)) + 0.6;
    const yForPrice = (p) => padding.top + ((maxPrice - p) / (maxPrice - minPrice)) * chartHeight;

    currentScale = { minPrice, maxPrice, yForPrice, height, padding };

    ctx.clearRect(0, 0, width, height);
    drawGrid(ctx, width, height, padding, candles.length, chartHeight);

    const step = chartWidth / candles.length;

    candles.forEach((candle, idx) => {
      const x = padding.left + idx * step + step / 2;
      const yHigh = yForPrice(candle.high);
      const yLow = yForPrice(candle.low);
      const yOpen = yForPrice(candle.open);
      const yClose = yForPrice(candle.close);
      const bodyTop = Math.min(yOpen, yClose);
      const bodyBottom = Math.max(yOpen, yClose);
      const bodyHeight = Math.max(6, bodyBottom - bodyTop);
      const bodyWidth = Math.min(26, Math.max(16, step * 0.5));
      const isUp = candle.close > candle.open;
      const isDown = candle.close < candle.open;
      const bodyColor = isUp ? colors.bull : isDown ? colors.bear : colors.neutral;

      ctx.strokeStyle = colors.wick;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(x, yHigh);
      ctx.lineTo(x, yLow);
      ctx.stroke();

      ctx.fillStyle = bodyColor;
      ctx.globalAlpha = 0.9;
      ctx.fillRect(x - bodyWidth / 2, bodyTop, bodyWidth, bodyHeight);
      ctx.globalAlpha = 1;

      drawFootprintCells(ctx, candle, x, step, yForPrice, mock.footprintMax);
      drawBubble(ctx, candle, x, yForPrice, mock.bubbleMax, mock.avgBubbleVolume);
    });

    drawXAxis(ctx, candles, padding, chartWidth, height);
    drawMagnet(ctx, padding);
  }

  function drawGrid(ctx, width, height, padding, count, chartHeight) {
    ctx.strokeStyle = colors.grid;
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 6]);

    const rows = 6;
    for (let i = 0; i <= rows; i += 1) {
      const y = padding.top + (chartHeight / rows) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();
    }

    const cols = Math.min(count, 10);
    const colStep = (width - padding.left - padding.right) / cols;
    for (let i = 0; i <= cols; i += 1) {
      const x = padding.left + colStep * i;
      ctx.beginPath();
      ctx.moveTo(x, padding.top);
      ctx.lineTo(x, height - padding.bottom);
      ctx.stroke();
    }

    ctx.setLineDash([]);
  }

  function drawFootprintCells(ctx, candle, x, step, yForPrice, footprintMax) {
    const cellWidth = Math.min(30, Math.max(18, step * 0.6));
    candle.footprint.forEach((cell, idx) => {
      const y = yForPrice(cell.price) - 6;
      const delta = cell.ask - cell.bid;
      const magnitude = Math.abs(delta);
      const hue = delta >= 0 ? 140 : 0;
      ctx.fillStyle = calculateColorIntensity(magnitude, footprintMax, hue);
      ctx.fillRect(x - cellWidth / 2, y, cellWidth, 12);

      if (idx === 0) {
        ctx.fillStyle = "#cdd6e3";
        ctx.font = "10px 'Segoe UI', sans-serif";
        ctx.fillText("Bid", x - cellWidth / 2, y - 6);
        ctx.fillText("Ask", x + cellWidth / 2 - 18, y - 6);
      }
    });
  }

  function drawBubble(ctx, candle, x, yForPrice, bubbleMax, avgBubbleVolume) {
    const bubbles = candle.bubbles.filter((b) => b.volume >= avgBubbleVolume * state.threshold);
    bubbles.forEach((bubble) => {
      const ratio = bubble.volume / bubbleMax;
      const radius = Math.max(12, Math.min(100, 12 + ratio * 80));
      ctx.fillStyle = bubble.side === "buy" ? colors.bubbleBuy : colors.bubbleSell;
      ctx.beginPath();
      ctx.arc(x, yForPrice(bubble.price), radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = bubble.side === "buy" ? "#46d49b" : "#ee7a82";
      ctx.lineWidth = 1.2;
      ctx.stroke();

      ctx.fillStyle = "#e8ecf5";
      ctx.font = "11px 'Segoe UI', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(`${bubble.volume}M`, x, yForPrice(bubble.price) + 4);
    });
  }

  function drawXAxis(ctx, candles, padding, chartWidth, height) {
    ctx.fillStyle = "#a2b4cc";
    ctx.font = "11px 'Segoe UI', sans-serif";
    const step = chartWidth / candles.length;
    const maxLabels = 8;
    const stride = Math.max(1, Math.floor(candles.length / maxLabels));
    candles.forEach((c, idx) => {
      if (idx % stride !== 0 && idx !== candles.length - 1) return;
      const x = padding.left + idx * step + step / 2;
      ctx.fillText(c.time, x - 12, height - 16);
    });
  }

  function drawMagnet(ctx, padding) {
    if (!state.magnet) return;
    ctx.fillStyle = "#46d49b";
    ctx.font = "12px 'Segoe UI', sans-serif";
    ctx.fillText("Magnet ON", padding.left + 6, padding.top - 10);
  }

  function calculateColorIntensity(value, maxValue, hue) {
    const safeMax = Math.max(1, maxValue);
    const intensity = Math.min(1, value / safeMax);
    const saturation = Math.min(100, 30 + intensity * 70);
    const lightness = Math.max(30, 70 - intensity * 40);
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  }

  function drawCvdChart(series) {
    const { width, height, ctx } = sizeCanvas(cvdCanvas);
    const padding = { top: 20, bottom: 20, left: 50, right: 10 };
    const usableWidth = width - padding.left - padding.right;
    const usableHeight = height - padding.top - padding.bottom;
    ctx.clearRect(0, 0, width, height);

    const maxAbs = Math.max(...series.map((s) => Math.abs(s.total)), 1);
    const yForValue = (v) => padding.top + ((maxAbs - v) / (2 * maxAbs)) * usableHeight;

    ctx.strokeStyle = colors.grid;
    ctx.setLineDash([4, 6]);
    ctx.beginPath();
    const zeroY = yForValue(0);
    ctx.moveTo(padding.left, zeroY);
    ctx.lineTo(width - padding.right, zeroY);
    ctx.stroke();
    ctx.setLineDash([]);

    const barWidth = usableWidth / series.length;
    series.forEach((point, idx) => {
      const x = padding.left + idx * barWidth + barWidth / 4;
      const yVal = yForValue(point.total);
      const barHeight = Math.abs(yVal - zeroY);
      const color =
        point.total > 0 ? colors.bull : point.total < 0 ? colors.bear : colors.neutral;
      ctx.fillStyle = color;
      ctx.fillRect(x, Math.min(yVal, zeroY), barWidth / 2, barHeight);
    });

    ctx.fillStyle = "#a2b4cc";
    ctx.font = "11px 'Segoe UI', sans-serif";
    ctx.fillText("Buyer", width - 160, padding.top + 12);
    ctx.fillText("Seller", width - 100, padding.top + 12);
    ctx.fillText("Neutral", width - 40, padding.top + 12);
  }

  function renderPriceScale(candles, volumeProfile) {
    if (!currentScale) return;
    priceScaleEl.innerHTML = "";
    const ticks = 7;
    const range = currentScale.maxPrice - currentScale.minPrice;
    const poc = Math.max(...volumeProfile.map((v) => v.volume));

    for (let i = 0; i <= ticks; i += 1) {
      const price = currentScale.maxPrice - (range / ticks) * i;
      const closest = volumeProfile.reduce((acc, v) => {
        const diff = Math.abs(v.price - price);
        return diff < (acc?.diff ?? Infinity) ? { ...v, diff } : acc;
      }, null);

      const tick = document.createElement("div");
      tick.className = "tick";

      const bar = document.createElement("div");
      bar.className = "bar";
      const color =
        closest?.side === "ask"
          ? calculateColorIntensity(closest.volume, poc, 0)
          : calculateColorIntensity(closest?.volume || 0, poc, 140);
      bar.style.background = color;

      const label = document.createElement("span");
      label.textContent = price.toFixed(2);

      tick.appendChild(bar);
      tick.appendChild(label);
      priceScaleEl.appendChild(tick);
    }
  }

  function renderVolumeProfile(profile) {
    if (!currentScale) return;
    volumeProfileEl.innerHTML = "";
    const maxVolume = Math.max(...profile.map((p) => p.volume), 1);

    profile.forEach((p) => {
      const row = document.createElement("div");
      row.className = "vp-row";
      const y = currentScale.yForPrice(p.price);
      row.style.top = `${y}px`;

      const bar = document.createElement("div");
      bar.className = `bar ${p.side === "ask" ? "sell" : "buy"} ${p.isPoc ? "poc" : ""}`;
      const width = Math.max(12, (p.volume / maxVolume) * 90);
      bar.style.width = `${width}px`;

      const label = document.createElement("span");
      label.textContent = p.price.toFixed(2);

      row.appendChild(bar);
      row.appendChild(label);
      volumeProfileEl.appendChild(row);
    });
  }

  function renderOrderbook(book) {
    orderbookRows.innerHTML = "";
    const combined = [...book.asks.map((a) => ({ ...a })), ...book.bids.map((b) => ({ ...b }))];
    combined.sort((a, b) => b.price - a.price);

    const maxSize = Math.max(...combined.map((c) => c.size), 1);

    combined.forEach((entry) => {
      const row = document.createElement("div");
      row.className = "ob-row";

      const buyBar = document.createElement("div");
      buyBar.className = "bar buy";
      buyBar.style.width = entry.side === "bid" ? `${(entry.size / maxSize) * 100}%` : "0%";

      const price = document.createElement("div");
      price.textContent = entry.price.toFixed(2);
      price.style.textAlign = "center";
      price.style.color = "#cdd6e3";

      const sellBar = document.createElement("div");
      sellBar.className = "bar sell";
      sellBar.style.width = entry.side === "ask" ? `${(entry.size / maxSize) * 100}%` : "0%";

      row.appendChild(buyBar);
      row.appendChild(price);
      row.appendChild(sellBar);

      orderbookRows.appendChild(row);
    });
  }
})();
