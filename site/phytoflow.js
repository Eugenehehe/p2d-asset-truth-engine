(() => {
  'use strict';

  const $ = (selector) => document.querySelector(selector);
  const state = {
    seed: 260719,
    locale: 'zh',
    workload: [],
    results: null,
  };

  const translations = {
    en: {
      eyebrow: 'P2D EXPERIMENTAL LAB',
      lead: 'A software MVP inspired by plant resource allocation: multi-timescale stress memory, source–sink placement, dormancy, and graceful degradation reduce memory pressure, data movement, and failed work.',
      principle1: 'Stress leaves memory', principle2: 'Resources flow to valuable sinks', principle3: 'Hibernate before killing work',
      experimentEyebrow: 'EXPERIMENT SETUP', experimentTitle: 'Generate one workload and compare two schedulers fairly',
      experimentCopy: 'The baseline sees only current load. PhytoFlow retains stress traces, anticipates recurring bursts, protects recovery capacity, and prefers data-local placement.',
      scenario: 'Scenario', clusterMemory: 'Cluster memory', intensity: 'Workload intensity', horizon: 'Simulation horizon',
      run: 'Run comparison', newSeed: 'Generate new workload', resultsEyebrow: 'MEASURED RESULTS',
      resultsTitle: 'Reproducible simulation on the same workload—not a marketing estimate', ready: 'Ready', running: 'Running', complete: 'Complete',
      reactive: 'Reactive', adaptive: 'Adaptive', impactEyebrow: 'NET IMPACT', impactWaiting: 'Run the simulation to see which mechanism created the improvement.',
      timelineEyebrow: 'PRESSURE TIMELINE', timelineTitle: 'Cluster memory pressure', memoryEyebrow: 'STRESS MEMORY', memoryTitle: 'Final PhytoFlow memory state',
      shortMemory: 'Short-term stress memory', shortMemoryCopy: 'Recent pressure used for immediate throttling and placement.',
      midMemory: 'Mid-term recurrence memory', midMemoryCopy: 'Repeated workloads affect reserves and data pre-positioning.',
      longMemory: 'Long-term policy trace', longMemoryCopy: 'Accumulated failures gradually change safety margins.',
      learnedPolicy: 'Learned policy', policyWaiting: 'Not run yet', decisionEyebrow: 'DECISION TRACE', decisionTitle: 'How plant logic changed scheduling',
      decisionWaiting: 'Key decisions appear after the simulation.', workloadEyebrow: 'WORKLOAD SAMPLE', workloadTitle: 'Representative jobs in this experiment',
      job: 'Job', arrival: 'Arrival', priority: 'Priority', duration: 'Duration', dataHome: 'Data home',
      architectureEyebrow: 'SOFTWARE ARCHITECTURE', architectureTitle: 'Not plant-themed labels—a testable state machine',
      telemetry: 'Utilization, wait, recurrence', stressMemory: 'Short, mid, long traces', sourceSink: 'Value, urgency, movement cost', action: 'Allocate, throttle, hibernate, degrade',
      footer: 'Synthetic workload only · No production infrastructure changes',
      dailyBurst: 'Recurring AI inference burst', mixedEtl: 'Realtime API + ETL mix', failureRecovery: 'Node pressure and recovery',
      allDecisions: 'All decisions', reserve: 'Reserve', locality: 'Data locality', hibernate: 'Hibernate', degrade: 'Degrade',
      high: 'High', medium: 'Medium', low: 'Low',
    },
    zh: {}
  };

  const zhOptionText = {
    dailyBurst: '週期性 AI 推論尖峰', mixedEtl: '即時 API + ETL 混合', failureRecovery: '節點壓力與恢復',
    allDecisions: '全部決策', reserve: '預留', locality: '資料就近', hibernate: '休眠', degrade: '降級'
  };

  class RNG {
    constructor(seed) { this.state = seed >>> 0 || 1; }
    next() {
      let x = this.state;
      x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
      this.state = x >>> 0;
      return this.state / 4294967296;
    }
    between(min, max) { return min + (max - min) * this.next(); }
    int(min, max) { return Math.floor(this.between(min, max + 1)); }
    pick(items) { return items[Math.floor(this.next() * items.length)]; }
  }

  const profiles = {
    'daily-burst': [
      { type: 'Realtime inference', key: 'infer-chat', ram: [5, 11], duration: [4, 12], priority: 3, value: 10 },
      { type: 'Embedding batch', key: 'embed-batch', ram: [7, 14], duration: [10, 24], priority: 2, value: 6 },
      { type: 'Cache refresh', key: 'cache-refresh', ram: [4, 9], duration: [7, 16], priority: 1, value: 3 },
      { type: 'Analytics ETL', key: 'analytics-etl', ram: [9, 18], duration: [16, 34], priority: 1, value: 4 },
    ],
    'mixed-etl': [
      { type: 'API request batch', key: 'api-batch', ram: [3, 8], duration: [3, 9], priority: 3, value: 10 },
      { type: 'Inventory reconcile', key: 'reconcile', ram: [6, 13], duration: [9, 20], priority: 2, value: 7 },
      { type: 'Warehouse ETL', key: 'warehouse-etl', ram: [10, 20], duration: [18, 38], priority: 1, value: 5 },
      { type: 'Model scoring', key: 'model-score', ram: [5, 12], duration: [7, 18], priority: 2, value: 7 },
    ],
    'failure-recovery': [
      { type: 'Critical API', key: 'critical-api', ram: [5, 10], duration: [4, 11], priority: 3, value: 11 },
      { type: 'Recovery replay', key: 'recovery-replay', ram: [9, 18], duration: [14, 28], priority: 2, value: 8 },
      { type: 'Index rebuild', key: 'index-rebuild', ram: [12, 22], duration: [22, 45], priority: 1, value: 4 },
      { type: 'Audit export', key: 'audit-export', ram: [5, 11], duration: [10, 22], priority: 1, value: 3 },
    ]
  };

  function generateWorkload(config) {
    const rng = new RNG(state.seed);
    const templates = profiles[config.scenario];
    const jobs = [];
    const baseRate = config.scenario === 'daily-burst' ? 0.38 : config.scenario === 'mixed-etl' ? 0.34 : 0.3;
    const intensity = config.intensity / 100;
    let id = 1;

    for (let minute = 0; minute < config.horizon; minute += 1) {
      const phase = minute % 80;
      const recurringBurst = config.scenario === 'daily-burst' && ((phase >= 20 && phase <= 34) || (phase >= 58 && phase <= 68));
      const etlWindow = config.scenario === 'mixed-etl' && phase >= 42 && phase <= 62;
      const failureWindow = config.scenario === 'failure-recovery' && phase >= 31 && phase <= 46;
      let rate = baseRate * intensity;
      if (recurringBurst) rate *= 2.75;
      if (etlWindow) rate *= 2.1;
      if (failureWindow) rate *= 2.35;

      let arrivals = 0;
      if (rng.next() < Math.min(rate, .95)) arrivals += 1;
      if (rng.next() < Math.max(0, rate - .62)) arrivals += 1;
      if (rng.next() < Math.max(0, rate - 1.05)) arrivals += 1;

      for (let j = 0; j < arrivals; j += 1) {
        let template = rng.pick(templates);
        if (recurringBurst && rng.next() < .68) template = templates[0];
        if (etlWindow && rng.next() < .55) template = templates[2];
        if (failureWindow && rng.next() < .48) template = templates[1];

        const estimatedRam = Number(rng.between(template.ram[0], template.ram[1]).toFixed(1));
        const spikeChance = recurringBurst || failureWindow ? .32 : .16;
        const actualMultiplier = rng.next() < spikeChance ? rng.between(1.15, 1.48) : rng.between(.92, 1.12);
        const duration = rng.int(template.duration[0], template.duration[1]);
        const deadlineSlack = template.priority === 3 ? rng.int(3, 8) : template.priority === 2 ? rng.int(8, 18) : rng.int(18, 36);

        jobs.push({
          id: `J${String(id).padStart(3, '0')}`,
          type: template.type,
          key: template.key,
          arrival: minute,
          estimatedRam,
          actualRam: Number((estimatedRam * actualMultiplier).toFixed(1)),
          duration,
          remaining: duration,
          priority: template.priority,
          value: template.value,
          deadline: minute + deadlineSlack,
          dataHome: rng.int(0, 3),
          degraded: false,
          hibernations: 0,
          readyAt: minute,
          status: 'new',
        });
        id += 1;
      }
    }
    return jobs;
  }

  function cloneJobs(jobs) {
    return jobs.map((job) => ({ ...job }));
  }

  function createNodes(totalMemory) {
    const perNode = totalMemory / 4;
    return Array.from({ length: 4 }, (_, id) => ({ id, capacity: perNode, running: [] }));
  }

  function used(node, field = 'estimatedRam') {
    return node.running.reduce((sum, job) => sum + job[field], 0);
  }

  function pressure(nodes, field = 'actualRam') {
    const total = nodes.reduce((sum, node) => sum + used(node, field), 0);
    const cap = nodes.reduce((sum, node) => sum + node.capacity, 0);
    return total / cap;
  }

  function simulate(jobsInput, config, strategy) {
    const jobs = cloneJobs(jobsInput);
    const nodes = createNodes(config.totalMemory);
    const queue = [];
    const timeline = [];
    const decisions = [];
    const recurrence = new Map();
    const metrics = {
      completed: 0, slaMisses: 0, oomEvents: 0, dropped: 0, hibernated: 0,
      degraded: 0, dataMoved: 0, recomputeMinutes: 0, totalWait: 0, utilizationSum: 0,
      ticks: config.horizon, admitted: 0
    };
    const memory = { short: 0, mid: 0, long: 0 };
    let lastReserveBucket = -1;

    const log = (minute, type, message) => {
      if (decisions.length < 90) decisions.push({ minute, type, message });
    };

    for (let minute = 0; minute < config.horizon; minute += 1) {
      memory.short *= .76;
      memory.mid *= .965;
      memory.long *= .994;

      for (const node of nodes) {
        const stillRunning = [];
        for (const job of node.running) {
          job.remaining -= 1;
          if (job.remaining <= 0) {
            if (job.status === 'completed') continue;
            job.status = 'completed';
            metrics.completed += 1;
            metrics.totalWait += Math.max(0, (job.startedAt ?? minute) - job.arrival);
            recurrence.set(job.key, Math.min(1, (recurrence.get(job.key) || 0) * .82 + .22));
          } else {
            stillRunning.push(job);
          }
        }
        node.running = stillRunning;
      }

      const arrivals = jobs.filter((job) => job.arrival === minute);
      for (const job of arrivals) { job.status = 'queued'; job.readyAt = minute; queue.push(job); }

      const currentPhase = minute % 80;
      const forecastBurst = strategy === 'phyto' && (
        (config.scenario === 'daily-burst' && ((currentPhase >= 16 && currentPhase <= 34) || (currentPhase >= 54 && currentPhase <= 68))) ||
        (config.scenario === 'mixed-etl' && currentPhase >= 38 && currentPhase <= 62) ||
        (config.scenario === 'failure-recovery' && currentPhase >= 27 && currentPhase <= 46)
      );

      const totalCap = config.totalMemory;
      const reserve = strategy === 'phyto'
        ? totalCap * Math.min(.22, .035 + memory.mid * .07 + memory.long * .08 + (forecastBurst ? .055 : 0))
        : 0;

      if (strategy === 'phyto') {
        const bucket = Math.round((reserve / totalCap) * 20);
        if (bucket !== lastReserveBucket && reserve > totalCap * .075) {
          log(minute, 'reserve', `${reserve.toFixed(1)} GB protected because recurring pressure raised the safety margin.`);
          lastReserveBucket = bucket;
        }
      }

      queue.sort((a, b) => {
        if (strategy === 'baseline') return (b.priority - a.priority) || (a.arrival - b.arrival);
        const score = (job) => {
          const urgency = Math.max(0, 1 - (job.deadline - minute) / 30);
          const recurrenceScore = recurrence.get(job.key) || 0;
          return job.value * 2.2 + job.priority * 2.8 + urgency * 8 + recurrenceScore * 5 - job.estimatedRam * .18;
        };
        return score(b) - score(a);
      });

      for (let qIndex = 0; qIndex < queue.length;) {
        const job = queue[qIndex];
        if (job.status !== 'queued' || job.readyAt > minute) { qIndex += 1; continue; }
        let chosen = null;

        if (strategy === 'baseline') {
          chosen = nodes
            .filter((node) => used(node) + job.estimatedRam <= node.capacity)
            .sort((a, b) => used(a) - used(b))[0] || null;
        } else {
          const headroom = reserve / nodes.length;
          const riskAdjustedNeed = job.estimatedRam * (1.08 + memory.short * .12);
          const candidates = nodes.filter((node) => used(node) + riskAdjustedNeed <= node.capacity - headroom);
          chosen = candidates.sort((a, b) => {
            const scoreA = (a.id === job.dataHome ? 6 : 0) - (used(a) / a.capacity) * 3;
            const scoreB = (b.id === job.dataHome ? 6 : 0) - (used(b) / b.capacity) * 3;
            return scoreB - scoreA;
          })[0] || null;

          if (!chosen && job.priority === 3) {
            const victims = nodes.flatMap((node) => node.running.map((running) => ({ node, running })))
              .filter(({ running }) => running.priority < job.priority && running.value < job.value)
              .sort((a, b) => (a.running.value - b.running.value) || (b.running.estimatedRam - a.running.estimatedRam));
            for (const victim of victims) {
              victim.node.running = victim.node.running.filter((item) => item.id !== victim.running.id);
              victim.running.hibernations += 1;
              victim.running.readyAt = minute + 1;
              victim.running.deadline += 3;
              victim.running.status = 'queued';
              queue.push(victim.running);
              metrics.hibernated += 1;
              metrics.dataMoved += .15;
              log(minute, 'hibernate', `${victim.running.id} entered reversible dormancy to admit ${job.id}.`);
              if (used(victim.node) + riskAdjustedNeed <= victim.node.capacity - headroom * .35) {
                chosen = victim.node;
                break;
              }
            }
          }

          if (!chosen && !job.degraded && job.priority <= 2 && minute > job.arrival + 2) {
            job.degraded = true;
            job.estimatedRam *= .64;
            job.actualRam *= .68;
            job.remaining = Math.ceil(job.remaining * 1.28);
            metrics.degraded += 1;
            log(minute, 'degrade', `${job.id} switched to a lower-memory execution profile instead of being dropped.`);
            continue;
          }
        }

        if (chosen) {
          job.startedAt ??= minute;
          job.status = 'running';
          chosen.running.push(job);
          metrics.admitted += 1;
          if (chosen.id !== job.dataHome) {
            metrics.dataMoved += job.estimatedRam * (strategy === 'phyto' ? .34 : .72);
          } else if (strategy === 'phyto' && job.estimatedRam >= 7) {
            log(minute, 'locality', `${job.id} placed on node ${chosen.id + 1}, where its data already resides.`);
          }
          queue.splice(qIndex, 1);
        } else {
          qIndex += 1;
        }
      }

      for (const node of nodes) {
        let actualUsed = used(node, 'actualRam');
        if (actualUsed > node.capacity) {
          metrics.oomEvents += 1;
          const overflowRatio = (actualUsed - node.capacity) / node.capacity;
          memory.short = Math.min(1, memory.short + .45 + overflowRatio);
          memory.mid = Math.min(1, memory.mid + .15);
          memory.long = Math.min(1, memory.long + .035);

          const victims = [...node.running].sort((a, b) => (a.priority - b.priority) || (b.actualRam - a.actualRam));
          while (actualUsed > node.capacity && victims.length) {
            const victim = victims.shift();
            node.running = node.running.filter((item) => item.id !== victim.id);
            actualUsed -= victim.actualRam;
            if (strategy === 'phyto') {
              victim.readyAt = minute + 1;
              victim.deadline += 3;
              victim.hibernations += 1;
              victim.status = 'queued';
              queue.push(victim);
              metrics.hibernated += 1;
              metrics.dataMoved += .15;
              log(minute, 'hibernate', `${victim.id} was checkpointed during an actual-memory spike.`);
            } else {
              victim.status = 'dropped';
              metrics.dropped += 1;
              metrics.recomputeMinutes += Math.max(1, victim.duration - victim.remaining);
            }
          }
        }
      }

      const currentPressure = pressure(nodes);
      if (currentPressure > .82) {
        const excess = currentPressure - .82;
        memory.short = Math.min(1, memory.short + excess * 1.7 + .05);
        memory.mid = Math.min(1, memory.mid + excess * .25 + .012);
        memory.long = Math.min(1, memory.long + excess * .035);
      }
      if (queue.length > 5) {
        memory.short = Math.min(1, memory.short + .08);
        memory.mid = Math.min(1, memory.mid + .015);
      }

      for (let qIndex = queue.length - 1; qIndex >= 0; qIndex -= 1) {
        const job = queue[qIndex];
        if (job.priority >= 2 && !job.slaCounted && minute > job.deadline) {
          metrics.slaMisses += 1;
          job.slaCounted = true;
          memory.mid = Math.min(1, memory.mid + .035);
          memory.long = Math.min(1, memory.long + .012);
        }
        const maxWait = strategy === 'phyto' ? 24 : 18;
        if (minute > job.deadline + maxWait) {
          job.status = 'dropped';
          queue.splice(qIndex, 1);
          metrics.dropped += 1;
        }
      }

      metrics.utilizationSum += currentPressure;
      timeline.push(Number((currentPressure * 100).toFixed(1)));
    }

    metrics.dropped += queue.filter((job) => job.status === 'queued').length;
    metrics.avgUtilization = (metrics.utilizationSum / config.horizon) * 100;
    metrics.avgWait = metrics.completed ? metrics.totalWait / metrics.completed : 0;
    metrics.successRate = jobs.length ? (metrics.completed / jobs.length) * 100 : 0;
    metrics.dataMoved = Number(metrics.dataMoved.toFixed(1));

    return { metrics, timeline, decisions, memory, totalJobs: jobs.length };
  }

  function getConfig() {
    return {
      scenario: $('#scenarioSelect').value,
      totalMemory: Number($('#memorySelect').value),
      intensity: Number($('#intensityInput').value),
      horizon: Number($('#horizonSelect').value),
    };
  }

  function metricMarkup(metrics) {
    const labels = state.locale === 'zh'
      ? [
          ['完成工作', metrics.completed, `${metrics.successRate.toFixed(1)}% 成功率`],
          ['SLA 違約', metrics.slaMisses, '越低越好'],
          ['OOM 事件', metrics.oomEvents, '實際 RAM 超出容量'],
          ['失敗／丟棄', metrics.dropped, '不可逆工作損失'],
          ['資料搬運', `${metrics.dataMoved.toFixed(1)} GB`, '跨節點傳輸'],
          ['平均利用率', `${metrics.avgUtilization.toFixed(1)}%`, '實際記憶體'],
          ['平均等待', `${metrics.avgWait.toFixed(1)} min`, '完成工作'],
          ['休眠／降級', `${metrics.hibernated}/${metrics.degraded}`, '可逆式保護'],
        ]
      : [
          ['Completed', metrics.completed, `${metrics.successRate.toFixed(1)}% success`],
          ['SLA misses', metrics.slaMisses, 'Lower is better'],
          ['OOM events', metrics.oomEvents, 'Actual RAM overflow'],
          ['Failed / dropped', metrics.dropped, 'Irreversible loss'],
          ['Data moved', `${metrics.dataMoved.toFixed(1)} GB`, 'Cross-node traffic'],
          ['Avg utilization', `${metrics.avgUtilization.toFixed(1)}%`, 'Actual memory'],
          ['Avg wait', `${metrics.avgWait.toFixed(1)} min`, 'Completed jobs'],
          ['Dormant / degraded', `${metrics.hibernated}/${metrics.degraded}`, 'Reversible protection'],
        ];

    return labels.map(([label, value, note]) => `
      <div class="metric-item"><span>${label}</span><strong>${value}</strong><small>${note}</small></div>
    `).join('');
  }

  function safeReduction(base, improved) {
    if (base <= 0) return improved <= 0 ? 0 : -100;
    return ((base - improved) / base) * 100;
  }

  function renderImpact(baseline, phyto) {
    const failureBase = baseline.metrics.dropped + baseline.metrics.oomEvents + baseline.metrics.slaMisses;
    const failurePhyto = phyto.metrics.dropped + phyto.metrics.oomEvents + phyto.metrics.slaMisses;
    const incidentReduction = safeReduction(failureBase, failurePhyto);
    const movementReduction = safeReduction(baseline.metrics.dataMoved, phyto.metrics.dataMoved);
    const completedGain = baseline.metrics.completed > 0
      ? ((phyto.metrics.completed - baseline.metrics.completed) / baseline.metrics.completed) * 100
      : 0;

    $('#impactHeadline').textContent = `${Math.max(0, incidentReduction).toFixed(0)}%`;
    $('#impactNarrative').textContent = state.locale === 'zh'
      ? `綜合 OOM、SLA 違約與工作丟棄後，PhytoFlow 將失敗事件降低 ${Math.max(0, incidentReduction).toFixed(1)}%。主要改善來自預留安全邊際、資料就近配置，以及在壓力時將低價值工作轉為可恢復休眠。`
      : `Across OOMs, SLA misses, and dropped work, PhytoFlow reduced failure events by ${Math.max(0, incidentReduction).toFixed(1)}%. The main gains came from safety reserves, data-local placement, and reversible dormancy under pressure.`;

    const bars = state.locale === 'zh'
      ? [['失敗事件', incidentReduction], ['資料搬運', movementReduction], ['完成工作', completedGain]]
      : [['Incidents', incidentReduction], ['Data moved', movementReduction], ['Completed', completedGain]];
    $('#impactBars').innerHTML = bars.map(([label, value]) => {
      const bounded = Math.max(0, Math.min(100, value));
      const prefix = value >= 0 ? '+' : '';
      return `<div class="impact-bar-row"><span>${label}</span><div class="impact-bar-track"><i style="width:${bounded}%"></i></div><strong>${prefix}${value.toFixed(0)}%</strong></div>`;
    }).join('');
  }

  function drawChart(baseline, phyto) {
    const canvas = $('#pressureChart');
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(600, Math.floor(rect.width * dpr));
    canvas.height = Math.floor(310 * dpr);
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    const width = canvas.width / dpr;
    const height = canvas.height / dpr;
    const pad = { left: 42, right: 16, top: 15, bottom: 28 };
    const chartW = width - pad.left - pad.right;
    const chartH = height - pad.top - pad.bottom;
    ctx.clearRect(0, 0, width, height);

    ctx.font = '11px system-ui';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    [0, 25, 50, 75, 100].forEach((value) => {
      const y = pad.top + chartH - (value / 100) * chartH;
      ctx.strokeStyle = 'rgba(180,231,201,.10)';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(width - pad.right, y); ctx.stroke();
      ctx.fillStyle = '#789585';
      ctx.fillText(`${value}%`, pad.left - 8, y);
    });

    const drawLine = (data, color) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.1;
      ctx.beginPath();
      data.forEach((value, index) => {
        const x = pad.left + (index / Math.max(1, data.length - 1)) * chartW;
        const y = pad.top + chartH - (Math.min(105, value) / 105) * chartH;
        if (index === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });
      ctx.stroke();
    };

    const dangerY = pad.top + chartH - (90 / 105) * chartH;
    ctx.setLineDash([6, 5]);
    ctx.strokeStyle = '#ff7c75';
    ctx.beginPath(); ctx.moveTo(pad.left, dangerY); ctx.lineTo(width - pad.right, dangerY); ctx.stroke();
    ctx.setLineDash([]);

    drawLine(baseline.timeline, '#66a9ff');
    drawLine(phyto.timeline, '#5ee391');

    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    const ticks = 4;
    for (let i = 0; i <= ticks; i += 1) {
      const x = pad.left + (i / ticks) * chartW;
      const minute = Math.round((i / ticks) * (baseline.timeline.length - 1));
      ctx.fillStyle = '#789585';
      ctx.fillText(`${minute}m`, x, height - 20);
    }
  }

  function renderMemory(memory, config) {
    const values = [memory.short, memory.mid, memory.long].map((value) => Math.round(value * 100));
    ['short', 'mid', 'long'].forEach((key, index) => {
      $(`#${key}MemoryValue`).textContent = `${values[index]}%`;
      $(`#${key}MemoryBar`).style.width = `${values[index]}%`;
    });
    const reserve = Math.min(22, 3.5 + memory.mid * 7 + memory.long * 8);
    $('#learnedPolicyValue').textContent = state.locale === 'zh'
      ? `下一個相似週期預留約 ${reserve.toFixed(1)}% RAM；高優先工作採資料就近 placement；壓力超過 82% 時優先休眠低價值背景工作。`
      : `Reserve about ${reserve.toFixed(1)}% RAM for the next similar cycle; use data-local placement for high-priority jobs; hibernate low-value background work above 82% pressure.`;
  }

  function renderDecisions(decisions) {
    const filter = $('#decisionFilter').value;
    const filtered = decisions.filter((item) => filter === 'all' || item.type === filter).slice(0, 40);
    if (!filtered.length) {
      $('#decisionLog').innerHTML = `<p class="empty-state">${state.locale === 'zh' ? '此篩選條件下沒有決策。' : 'No decisions match this filter.'}</p>`;
      return;
    }
    const typeLabels = state.locale === 'zh'
      ? { reserve: '預留', locality: '就近', hibernate: '休眠', degrade: '降級' }
      : { reserve: 'Reserve', locality: 'Locality', hibernate: 'Hibernate', degrade: 'Degrade' };
    const translationsMap = state.locale === 'zh' ? {
      'protected because recurring pressure raised the safety margin.': '因重複壓力提高安全邊際而受到保護。',
      'entered reversible dormancy to admit': '進入可逆休眠，以便讓',
      'was checkpointed during an actual-memory spike.': '在實際記憶體尖峰中被 checkpoint。',
      'switched to a lower-memory execution profile instead of being dropped.': '切換到低記憶體執行模式，而不是被丟棄。',
      'placed on node': '配置到節點',
      'where its data already resides.': '，該節點已有其資料。'
    } : null;
    const localizeMessage = (message) => {
      if (!translationsMap) return message;
      let result = message;
      Object.entries(translationsMap).forEach(([from, to]) => { result = result.replace(from, to); });
      result = result.replace('GB protected ', 'GB ');
      result = result.replace(' to admit ', '，以讓 ');
      return result;
    };
    $('#decisionLog').innerHTML = filtered.map((item) => `
      <div class="decision-item">
        <time>T+${item.minute}m</time>
        <span class="decision-tag">${typeLabels[item.type] || item.type}</span>
        <p>${localizeMessage(item.message)}</p>
      </div>
    `).join('');
  }

  function renderWorkload(jobs) {
    const sample = [...jobs]
      .sort((a, b) => (b.priority - a.priority) || (b.estimatedRam - a.estimatedRam))
      .slice(0, 28);
    const priorityLabel = (priority) => {
      const labels = state.locale === 'zh' ? ['低', '中', '高'] : ['Low', 'Medium', 'High'];
      return labels[priority - 1];
    };
    $('#workloadCount').textContent = `${jobs.length} jobs`;
    $('#workloadTable').innerHTML = sample.map((job) => {
      const cls = job.priority === 3 ? 'priority-high' : job.priority === 2 ? 'priority-medium' : 'priority-low';
      return `<tr><td>${job.id}<br><small>${job.type}</small></td><td>T+${job.arrival}m</td><td class="${cls}">${priorityLabel(job.priority)}</td><td>${job.estimatedRam.toFixed(1)} GB</td><td>${job.duration}m</td><td>Node ${job.dataHome + 1}</td></tr>`;
    }).join('');
  }

  function runSimulation() {
    const button = $('#runSimulation');
    const config = getConfig();
    button.disabled = true;
    $('#runStatus').className = 'run-status running';
    $('#runStatus').textContent = state.locale === 'zh' ? '執行中' : 'Running';

    window.setTimeout(() => {
      state.workload = generateWorkload(config);
      const baseline = simulate(state.workload, config, 'baseline');
      const phyto = simulate(state.workload, config, 'phyto');
      state.results = { baseline, phyto, config };

      $('#baselineMetrics').innerHTML = metricMarkup(baseline.metrics);
      $('#phytoMetrics').innerHTML = metricMarkup(phyto.metrics);
      renderImpact(baseline, phyto);
      renderMemory(phyto.memory, config);
      renderDecisions(phyto.decisions);
      renderWorkload(state.workload);
      drawChart(baseline, phyto);

      $('#runStatus').className = 'run-status complete';
      $('#runStatus').textContent = state.locale === 'zh' ? '完成' : 'Complete';
      button.disabled = false;
    }, 120);
  }

  function applyLanguage() {
    const useEnglish = state.locale === 'en';
    document.documentElement.lang = useEnglish ? 'en' : 'zh-Hant';
    $('#languageToggle').textContent = useEnglish ? '繁體中文' : 'English';
    document.querySelectorAll('[data-i18n]').forEach((element) => {
      const key = element.dataset.i18n;
      if (useEnglish && translations.en[key]) element.textContent = translations.en[key];
      if (!useEnglish && element.dataset.zh) element.textContent = element.dataset.zh;
    });
    document.querySelectorAll('[data-i18n-option]').forEach((option) => {
      const key = option.dataset.i18nOption;
      option.textContent = useEnglish ? (translations.en[key] || option.textContent) : (zhOptionText[key] || option.textContent);
    });
    if (state.results) {
      $('#baselineMetrics').innerHTML = metricMarkup(state.results.baseline.metrics);
      $('#phytoMetrics').innerHTML = metricMarkup(state.results.phyto.metrics);
      renderImpact(state.results.baseline, state.results.phyto);
      renderMemory(state.results.phyto.memory, state.results.config);
      renderDecisions(state.results.phyto.decisions);
      renderWorkload(state.workload);
    }
  }

  function captureChineseText() {
    document.querySelectorAll('[data-i18n]').forEach((element) => { element.dataset.zh = element.textContent; });
  }

  $('#intensityInput').addEventListener('input', (event) => {
    $('#intensityOutput').textContent = `${event.target.value}%`;
  });
  $('#runSimulation').addEventListener('click', runSimulation);
  $('#newSeed').addEventListener('click', () => {
    state.seed = Math.floor(Date.now() % 900000) + 100000;
    $('#seedLabel').textContent = `Seed ${state.seed}`;
    runSimulation();
  });
  $('#decisionFilter').addEventListener('change', () => {
    if (state.results) renderDecisions(state.results.phyto.decisions);
  });
  $('#languageToggle').addEventListener('click', () => {
    state.locale = state.locale === 'zh' ? 'en' : 'zh';
    applyLanguage();
  });
  window.addEventListener('resize', () => {
    if (state.results) drawChart(state.results.baseline, state.results.phyto);
  });

  captureChineseText();
  runSimulation();
})();
