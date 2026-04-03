const mapEl = document.querySelector("#map");
const planEl = document.querySelector("#plan");
const eventsEl = document.querySelector("#events");
const timelineEl = document.querySelector("#timeline");
const goalTextEl = document.querySelector("#goal-text");
const timeTextEl = document.querySelector("#time-text");

const state = {
  feed: null,
  scene: null
};

async function fetchFeed() {
  const response = await fetch("/api/feed");
  const data = await response.json();
  state.feed = data.observerFeed;
  state.scene = data.scene;
  render();
}

async function runScenario(scenario) {
  const response = await fetch("/api/cycle", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ scenario })
  });
  const data = await response.json();
  state.feed = data.observerFeed;
  state.scene = data.scene;
  render();
}

function render() {
  if (!state.feed || !state.scene) return;

  goalTextEl.textContent = state.feed.plan?.goal ?? "空闲";
  timeTextEl.textContent = new Date(state.feed.currentTime).toLocaleString("zh-CN");

  mapEl.innerHTML = state.scene.rooms
    .map(
      (room) => `
        <article class="room room-${room.id.split(".").pop()} ambience-${room.ambience}">
          <div class="room-stage">
            <div class="room-ceiling"></div>
            <div class="room-floor"></div>
            <div class="room-wall room-wall-left"></div>
            <div class="room-wall room-wall-right"></div>
            <div class="room-contents">
              <div class="room-label">
                <strong class="room-name">${room.label}</strong>
                <span class="room-ambience">${translateAmbience(room.ambience)}</span>
              </div>
              <div class="device-cluster">
                ${room.devices
                  .map(
                    (device) => `
                      <button
                        class="device device-${device.kind} state-${sanitizeForClass(device.state)}"
                        data-device-id="${device.id}"
                        data-next-state="${nextDeviceState(device)}"
                        title="${device.label}: ${translateDeviceState(device.state)}"
                      >
                        <span class="device-icon">${deviceEmoji(device)}</span>
                        <span class="device-label">${device.label}</span>
                        <span class="device-state">${translateDeviceState(device.state)}</span>
                      </button>
                    `
                  )
                  .join("")}
              </div>
              ${
                room.occupants.length
                  ? `<div class="occupants">
                      ${room.occupants
                        .map(
                          (occupant) => `
                            <div class="sprite focus-${sanitizeForClass(occupant.focusMode)}">
                              <div class="sprite-body"></div>
                              <div class="sprite-label">${occupant.label}<br />${translateFocusMode(occupant.focusMode)}</div>
                            </div>
                          `
                        )
                        .join("")}
                    </div>`
                  : `<div class="empty-room">当前无人</div>`
              }
            </div>
          </div>
        </article>
      `
    )
    .join("");

  const plan = state.feed.plan;
  planEl.innerHTML = plan
    ? `
      <div class="card">
        <h3>${translateGoal(plan.goal)}</h3>
        <p>${plan.reason}</p>
        <p class="meta">置信度 ${Math.round(plan.confidence * 100)}% · 下次复查 ${new Date(plan.nextReviewTime).toLocaleTimeString("zh-CN")}</p>
      </div>
      ${plan.actions
        .map(
          (action) => `
          <div class="card">
            <h3>${translateActionKind(action.kind)}</h3>
            <p>${action.reason}</p>
            <p class="meta">${action.targetId} → ${translateDeviceState(action.desiredState)} · 影响 ${translateImpact(action.impact)}</p>
          </div>
        `
        )
        .join("")}
    `
    : `<div class="card"><h3>当前没有计划</h3><p>运行一个场景后，这里会显示管家的规划结果。</p></div>`;

  eventsEl.innerHTML = state.feed.events
    .slice()
    .reverse()
    .map(
      (event) => `
        <div class="event ${event.priority}">
          <strong>${event.title}</strong>
          <p>${translateEventType(event.type)}</p>
          <p class="meta">${new Date(event.time).toLocaleTimeString("zh-CN")} · ${translatePriority(event.priority)}</p>
        </div>
      `
    )
    .join("");

  timelineEl.innerHTML = state.scene.timeline
    .slice()
    .reverse()
    .map(
      (entry) => `
        <div class="timeline-entry ${entry.type === "action_failed" ? "failed" : ""}">
          <strong>${translateTimelineType(entry.type)}</strong>
          <p>${entry.message}</p>
          <p class="meta">${new Date(entry.time).toLocaleTimeString("zh-CN")}</p>
        </div>
      `
    )
    .join("");
}

async function controlDevice(targetId, desiredState) {
  const response = await fetch("/api/device/control", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ targetId, desiredState })
  });
  const data = await response.json();
  state.feed = data.observerFeed;
  state.scene = data.scene;
  render();
}

document.querySelectorAll("[data-scenario]").forEach((button) => {
  button.addEventListener("click", () => runScenario(button.dataset.scenario));
});

document.addEventListener("click", (event) => {
  const button = event.target.closest("[data-device-id]");
  if (!button) return;
  controlDevice(button.dataset.deviceId, button.dataset.nextState);
});

fetchFeed();
setInterval(fetchFeed, 8000);

function deviceEmoji(device) {
  switch (device.kind) {
    case "light":
      return "◉";
    case "curtain":
      return "▥";
    case "climate":
      return "◌";
    case "lock":
      return "⬒";
    case "mode":
      return "◎";
    case "reminder":
      return "◔";
    default:
      return "•";
  }
}

function nextDeviceState(device) {
  if (Array.isArray(device.allowedStates) && device.allowedStates.length > 1) {
    const currentIndex = device.allowedStates.indexOf(device.state);
    const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % device.allowedStates.length : 0;
    return device.allowedStates[nextIndex];
  }
  if (device.kind === "light") {
    return device.state === "on" ? "off" : "on";
  }
  if (device.kind === "curtain") {
    return device.state === "open" ? "closed" : "open";
  }
  if (device.kind === "lock") {
    return device.state === "locked" ? "unlocked" : "locked";
  }
  return device.state;
}

function sanitizeForClass(value) {
  return String(value).replace(/[^a-zA-Z0-9_-]/g, "-");
}

function translateAmbience(value) {
  return {
    quiet: "安静",
    active: "活跃",
    sleep_prep: "睡前准备"
  }[value] ?? value;
}

function translateFocusMode(value) {
  return {
    deep_work: "深度工作",
    rest: "休息",
    travel_prep: "出行准备",
    idle: "空闲"
  }[value] ?? value;
}

function translateGoal(value) {
  return {
    prepare_for_tomorrow_departure: "准备明日出行",
    protect_focus_and_reduce_interruptions: "保护专注并减少打扰",
    replan_after_new_disruption: "在新扰动后重新规划"
  }[value] ?? value;
}

function translateActionKind(value) {
  return {
    prepare_departure: "出行准备",
    comfort_adjustment: "环境调整",
    reduce_disruption: "减少打扰",
    reminder: "提醒",
    request_confirmation: "请求确认",
    drop_action: "放弃动作"
  }[value] ?? value;
}

function translateImpact(value) {
  return {
    low: "低",
    medium: "中",
    high: "高"
  }[value] ?? value;
}

function translatePriority(value) {
  return {
    low: "低",
    medium: "中",
    high: "高"
  }[value] ?? value;
}

function translateEventType(value) {
  return {
    calendar_shift: "日程变动",
    visitor_inserted: "访客插入",
    rest_conflict: "休息冲突",
    plan_failure: "计划失败",
    preference_shift: "偏好变化"
  }[value] ?? value;
}

function translateTimelineType(value) {
  return {
    event_injected: "事件注入",
    action_executed: "动作执行",
    action_failed: "动作失败",
    plan_created: "计划生成"
  }[value] ?? value;
}

function translateDeviceState(value) {
  return {
    on: "开启",
    off: "关闭",
    open: "打开",
    closed: "关闭",
    locked: "上锁",
    unlocked: "未上锁",
    cool_22c: "制冷 22°C",
    sleep_20c: "睡眠 20°C",
    focus_guard: "专注守护",
    sleep_guard: "睡眠守护",
    travel_guard: "出行守护",
    armed: "已设定",
    paused: "已暂停",
    sent: "已发送"
  }[value] ?? value;
}
