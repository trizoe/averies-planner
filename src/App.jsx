import { useState, useEffect, useCallback } from "react";
import { supabase } from "./supabase";

const DAYS = [
  {
    name: "Monday",
    emoji: "🌊",
    tasks: [
      { id: "mon-country", label: "🌍 Spin the globe — pick this week's country!", type: "special" },
      { id: "mon-maths", label: "🧮 Maths tutoring", type: "study" },
      { id: "mon-homework", label: "📚 Homework / Study", type: "study" },
      { id: "mon-reading", label: "📖 30 min reading", type: "reading" },
    ],
  },
  {
    name: "Tuesday",
    emoji: "🐚",
    tasks: [
      { id: "tue-homework", label: "📚 Homework / Study", type: "study" },
      { id: "tue-reading", label: "📖 30 min reading", type: "reading" },
    ],
  },
  {
    name: "Wednesday",
    emoji: "⚡",
    tasks: [
      { id: "wed-reading", label: "📖 30 min reading", type: "reading" },
      { id: "wed-sport", label: "🏃‍♀️ Sport training", type: "sport" },
      { id: "wed-bins", label: "🗑️ Bring the bins in", type: "chore" },
    ],
  },
  {
    name: "Thursday",
    emoji: "🌴",
    tasks: [
      { id: "thu-homework", label: "📚 Homework / Study", type: "study" },
      { id: "thu-reading", label: "📖 30 min reading", type: "reading" },
    ],
  },
  {
    name: "Friday",
    emoji: "🎉",
    tasks: [
      { id: "fri-reading", label: "📖 30 min reading", type: "reading" },
    ],
  },
  {
    name: "Saturday",
    emoji: "🏅",
    tasks: [
      { id: "sat-sport", label: "🏃‍♀️ Morning sport — game day!", type: "sport" },
      { id: "sat-room", label: "🧹 Clean room", type: "chore" },
    ],
  },
  {
    name: "Sunday",
    emoji: "🎸",
    tasks: [
      { id: "sun-music", label: "🎵 30 min music with Dad", type: "music" },
      { id: "sun-country", label: "🌍 Country report — flag, capital & 3 cool facts!", type: "special" },
    ],
  },
];

const turtleFacts = [
  "Sea turtles can hold their breath for up to 5 hours! 🐢",
  "Turtles have been around for over 200 million years! 🐢",
  "A group of turtles is called a bale! 🐢",
  "Sea turtles can travel over 20,000 km a year! 🐢",
  "Leatherback turtles can dive deeper than 1,000 metres! 🐢",
  "Some turtles can breathe through their butt. Seriously! 🐢",
  "Green sea turtles can't pull their head into their shell! 🐢",
  "Baby turtles find the ocean by following moonlight! 🐢",
  "Turtles have excellent eyesight and sense of smell! 🐢",
  "The oldest known turtle lived to be 190 years old! 🐢",
];

const TurtleSvg = ({ size = 48, color = "#2dd4a0" }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="32" cy="36" rx="18" ry="14" fill={color} />
    <ellipse cx="32" cy="36" rx="14" ry="10" fill="#1a9a6e" />
    <path d="M26 30 L32 26 L38 30" stroke="#15775a" strokeWidth="1.5" fill="none" />
    <path d="M24 36 L32 32 L40 36" stroke="#15775a" strokeWidth="1.5" fill="none" />
    <path d="M26 42 L32 38 L38 42" stroke="#15775a" strokeWidth="1.5" fill="none" />
    <circle cx="47" cy="28" r="5" fill={color} />
    <circle cx="48.5" cy="27" r="1.5" fill="#0d3d2e" />
    <ellipse cx="18" cy="28" rx="4" ry="3" fill={color} transform="rotate(-20 18 28)" />
    <ellipse cx="46" cy="44" rx="4" ry="3" fill={color} transform="rotate(20 46 44)" />
    <ellipse cx="18" cy="44" rx="4" ry="3" fill={color} transform="rotate(-20 18 44)" />
    <ellipse cx="46" cy="28" rx="3" ry="2" fill={color} transform="rotate(20 46 28)" />
  </svg>
);

const getWeekId = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const diff = now - start;
  const oneWeek = 604800000;
  const week = Math.floor(diff / oneWeek);
  return `${now.getFullYear()}-W${week}`;
};

const getToday = () => {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return days[new Date().getDay()];
};

const loadChecked = (weekId) => {
  try {
    const data = localStorage.getItem(`planner-${weekId}`);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
};

const saveCheckedLocal = (weekId, checked) => {
  try {
    localStorage.setItem(`planner-${weekId}`, JSON.stringify(checked));
  } catch (e) {
    console.error("Local save failed:", e);
  }
};

const saveCheckedToSupabase = async (weekId, checked) => {
  try {
    const { error } = await supabase
      .from("planner_weeks")
      .upsert({ week_id: weekId, checked_tasks: checked }, { onConflict: "week_id" });
    if (error) console.error("Supabase save error:", error);
  } catch (e) {
    console.error("Supabase save failed:", e);
  }
};

const loadCheckedFromSupabase = async (weekId) => {
  try {
    const { data, error } = await supabase
      .from("planner_weeks")
      .select("checked_tasks")
      .eq("week_id", weekId)
      .single();
    if (error && error.code !== "PGRST116") {
      console.error("Supabase load error:", error);
      return null;
    }
    return data?.checked_tasks || null;
  } catch (e) {
    console.error("Supabase load failed:", e);
    return null;
  }
};

export default function App() {
  const [weekId] = useState(getWeekId());
  const [checked, setChecked] = useState(() => loadChecked(getWeekId()));
  const [selectedDay, setSelectedDay] = useState(() => {
    const today = getToday();
    const idx = DAYS.findIndex((d) => d.name === today);
    return idx >= 0 ? idx : 0;
  });
  const [turtleFact] = useState(() => turtleFacts[Math.floor(Math.random() * turtleFacts.length)]);
  const [showCelebration, setShowCelebration] = useState(false);
  const [synced, setSynced] = useState(false);

  // Load from Supabase on mount (overrides localStorage with latest shared state)
  useEffect(() => {
    const loadFromCloud = async () => {
      const cloudData = await loadCheckedFromSupabase(weekId);
      if (cloudData) {
        setChecked(cloudData);
        saveCheckedLocal(weekId, cloudData);
      }
      setSynced(true);
    };
    loadFromCloud();
  }, [weekId]);

  // Subscribe to real-time changes from Supabase
  useEffect(() => {
    const channel = supabase
      .channel("planner-sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "planner_weeks", filter: `week_id=eq.${weekId}` },
        (payload) => {
          if (payload.new?.checked_tasks) {
            setChecked(payload.new.checked_tasks);
            saveCheckedLocal(weekId, payload.new.checked_tasks);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [weekId]);

  const toggleTask = (taskId) => {
    const newChecked = { ...checked, [taskId]: !checked[taskId] };
    setChecked(newChecked);
    saveCheckedLocal(weekId, newChecked);
    saveCheckedToSupabase(weekId, newChecked);

    if (!checked[taskId]) {
      const dayTasks = DAYS[selectedDay].tasks;
      const allDone = dayTasks.every((t) => t.id === taskId || newChecked[t.id]);
      if (allDone) {
        setShowCelebration(true);
        setTimeout(() => setShowCelebration(false), 2500);
      }
    }
  };

  const resetWeek = () => {
    setChecked({});
    saveCheckedLocal(weekId, {});
    saveCheckedToSupabase(weekId, {});
  };

  const totalTasks = DAYS.reduce((sum, d) => sum + d.tasks.length, 0);
  const completedTasks = DAYS.reduce(
    (sum, d) => sum + d.tasks.filter((t) => checked[t.id]).length,
    0
  );
  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const today = getToday();

  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&family=Quicksand:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />
      <div
        style={{
          minHeight: "100vh",
          background: "linear-gradient(135deg, #0c2d48 0%, #145a7e 40%, #0e6655 100%)",
          fontFamily: "'Quicksand', sans-serif",
          color: "#e0f7f0",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Floating bubbles */}
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            style={{
              position: "fixed",
              width: `${20 + i * 12}px`,
              height: `${20 + i * 12}px`,
              borderRadius: "50%",
              background: `rgba(45, 212, 160, ${0.04 + i * 0.01})`,
              left: `${(i * 13 + 5) % 95}%`,
              top: `${(i * 17 + 10) % 90}%`,
              animation: `float${i % 3} ${4 + i}s ease-in-out infinite`,
              pointerEvents: "none",
              zIndex: 0,
            }}
          />
        ))}

        <style>{`
          @keyframes float0 { 0%, 100% { transform: translateY(0) rotate(0deg); } 50% { transform: translateY(-20px) rotate(5deg); } }
          @keyframes float1 { 0%, 100% { transform: translateY(0) rotate(0deg); } 50% { transform: translateY(-15px) rotate(-3deg); } }
          @keyframes float2 { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-25px); } }
          @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
          @keyframes popIn { 0% { transform: scale(0.8); opacity: 0; } 50% { transform: scale(1.05); } 100% { transform: scale(1); opacity: 1; } }
          @keyframes celebrate {
            0% { transform: scale(1); }
            25% { transform: scale(1.1) rotate(-3deg); }
            50% { transform: scale(1.15) rotate(3deg); }
            75% { transform: scale(1.1) rotate(-2deg); }
            100% { transform: scale(1); }
          }
          @keyframes shimmer {
            0% { background-position: -200% center; }
            100% { background-position: 200% center; }
          }
          .task-item { transition: all 0.2s ease; cursor: pointer; -webkit-tap-highlight-color: transparent; }
          .task-item:hover { transform: translateX(4px); }
          .task-item:active { transform: scale(0.98); }
          .day-tab { transition: all 0.2s ease; cursor: pointer; -webkit-tap-highlight-color: transparent; }
          .day-tab:hover { transform: translateY(-2px); }
        `}</style>

        <div
          style={{
            position: "relative",
            zIndex: 1,
            maxWidth: "600px",
            margin: "0 auto",
            padding: "20px 16px 40px",
          }}
        >
          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: "24px", animation: "slideUp 0.5s ease" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: "12px",
                marginBottom: "8px",
              }}
            >
              <TurtleSvg size={44} color="#2dd4a0" />
              <h1
                style={{
                  fontFamily: "'Fredoka', sans-serif",
                  fontSize: "32px",
                  fontWeight: 700,
                  margin: 0,
                  background: "linear-gradient(90deg, #2dd4a0, #7be8c9, #2dd4a0)",
                  backgroundSize: "200% auto",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  animation: "shimmer 3s linear infinite",
                }}
              >
                Averie's Week
              </h1>
              <TurtleSvg size={44} color="#2dd4a0" />
            </div>
            <div
              style={{
                background: "rgba(45, 212, 160, 0.1)",
                border: "1px solid rgba(45, 212, 160, 0.2)",
                borderRadius: "12px",
                padding: "10px 16px",
                fontSize: "13px",
                color: "#7be8c9",
                fontStyle: "italic",
                marginTop: "8px",
              }}
            >
              {turtleFact}
            </div>
          </div>

          {/* Progress bar */}
          <div
            style={{
              background: "rgba(255,255,255,0.08)",
              borderRadius: "16px",
              padding: "16px",
              marginBottom: "20px",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(45, 212, 160, 0.15)",
              animation: "slideUp 0.6s ease",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "8px",
              }}
            >
              <span style={{ fontSize: "14px", fontWeight: 600, color: "#7be8c9" }}>
                Weekly Progress
              </span>
              <span style={{ fontSize: "14px", fontWeight: 700, color: "#2dd4a0" }}>
                {completedTasks}/{totalTasks} tasks
              </span>
            </div>
            <div
              style={{
                height: "12px",
                background: "rgba(0,0,0,0.3)",
                borderRadius: "8px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${progressPercent}%`,
                  background:
                    progressPercent === 100
                      ? "linear-gradient(90deg, #2dd4a0, #f0c040, #2dd4a0)"
                      : "linear-gradient(90deg, #2dd4a0, #7be8c9)",
                  borderRadius: "8px",
                  transition: "width 0.5s ease",
                  backgroundSize: progressPercent === 100 ? "200% auto" : "100%",
                  animation: progressPercent === 100 ? "shimmer 2s linear infinite" : "none",
                }}
              />
            </div>
            {progressPercent === 100 && (
              <div
                style={{
                  textAlign: "center",
                  marginTop: "8px",
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "#f0c040",
                  animation: "celebrate 0.6s ease",
                }}
              >
                🎉 All done this week! Legend! 🐢✨
              </div>
            )}
          </div>

          {/* Day tabs */}
          <div
            style={{
              display: "flex",
              gap: "4px",
              marginBottom: "16px",
              overflowX: "auto",
              paddingBottom: "4px",
              animation: "slideUp 0.7s ease",
            }}
          >
            {DAYS.map((day, i) => {
              const dayCompleted = day.tasks.every((t) => checked[t.id]);
              const isToday = day.name === today;
              const isSelected = selectedDay === i;
              return (
                <div
                  key={day.name}
                  className="day-tab"
                  onClick={() => setSelectedDay(i)}
                  style={{
                    flex: "1 0 0",
                    minWidth: "58px",
                    padding: "10px 4px",
                    borderRadius: "12px",
                    textAlign: "center",
                    fontSize: "11px",
                    fontWeight: isSelected ? 700 : 500,
                    background: isSelected
                      ? "linear-gradient(135deg, #2dd4a0, #1a9a6e)"
                      : "rgba(255,255,255,0.06)",
                    color: isSelected ? "#0c2d48" : "#7be8c9",
                    border:
                      isToday && !isSelected
                        ? "2px solid rgba(45, 212, 160, 0.5)"
                        : "2px solid transparent",
                    position: "relative",
                  }}
                >
                  <div style={{ fontSize: "16px", marginBottom: "2px" }}>{day.emoji}</div>
                  <div>{day.name.slice(0, 3)}</div>
                  {dayCompleted && (
                    <div
                      style={{
                        position: "absolute",
                        top: "-4px",
                        right: "-4px",
                        width: "16px",
                        height: "16px",
                        borderRadius: "50%",
                        background: "#2dd4a0",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "9px",
                      }}
                    >
                      ✓
                    </div>
                  )}
                  {isToday && (
                    <div
                      style={{
                        width: "4px",
                        height: "4px",
                        borderRadius: "50%",
                        background: isSelected ? "#0c2d48" : "#2dd4a0",
                        margin: "3px auto 0",
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Task list */}
          {selectedDay !== null && (
            <div
              style={{
                background: "rgba(255,255,255,0.06)",
                borderRadius: "20px",
                padding: "20px",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(45, 212, 160, 0.12)",
                animation: "popIn 0.3s ease",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  marginBottom: "16px",
                }}
              >
                <span style={{ fontSize: "28px" }}>{DAYS[selectedDay].emoji}</span>
                <h2
                  style={{
                    fontFamily: "'Fredoka', sans-serif",
                    fontSize: "24px",
                    fontWeight: 600,
                    margin: 0,
                    color: "#2dd4a0",
                  }}
                >
                  {DAYS[selectedDay].name}
                </h2>
                {DAYS[selectedDay].name === today && (
                  <span
                    style={{
                      fontSize: "11px",
                      background: "rgba(45, 212, 160, 0.2)",
                      color: "#2dd4a0",
                      padding: "3px 10px",
                      borderRadius: "20px",
                      fontWeight: 600,
                    }}
                  >
                    TODAY
                  </span>
                )}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {DAYS[selectedDay].tasks.map((task, i) => {
                  const isDone = checked[task.id];
                  const typeColors = {
                    study: {
                      bg: "rgba(99, 141, 255, 0.15)",
                      border: "rgba(99, 141, 255, 0.3)",
                      check: "#638dff",
                    },
                    reading: {
                      bg: "rgba(178, 132, 255, 0.15)",
                      border: "rgba(178, 132, 255, 0.3)",
                      check: "#b284ff",
                    },
                    chore: {
                      bg: "rgba(255, 171, 76, 0.15)",
                      border: "rgba(255, 171, 76, 0.3)",
                      check: "#ffab4c",
                    },
                    sport: {
                      bg: "rgba(255, 99, 132, 0.15)",
                      border: "rgba(255, 99, 132, 0.3)",
                      check: "#ff6384",
                    },
                    music: {
                      bg: "rgba(255, 206, 86, 0.15)",
                      border: "rgba(255, 206, 86, 0.3)",
                      check: "#ffce56",
                    },
                    special: {
                      bg: "rgba(45, 212, 160, 0.15)",
                      border: "rgba(45, 212, 160, 0.3)",
                      check: "#2dd4a0",
                    },
                  };
                  const colors = typeColors[task.type] || typeColors.special;

                  return (
                    <div
                      key={task.id}
                      className="task-item"
                      onClick={() => toggleTask(task.id)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        padding: "14px 16px",
                        borderRadius: "14px",
                        background: isDone ? "rgba(45, 212, 160, 0.08)" : colors.bg,
                        border: `1px solid ${isDone ? "rgba(45, 212, 160, 0.2)" : colors.border}`,
                        opacity: isDone ? 0.6 : 1,
                        animation: `slideUp ${0.3 + i * 0.08}s ease`,
                      }}
                    >
                      <div
                        style={{
                          width: "28px",
                          height: "28px",
                          borderRadius: "8px",
                          border: `2px solid ${isDone ? "#2dd4a0" : colors.check}`,
                          background: isDone ? "#2dd4a0" : "transparent",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          transition: "all 0.2s ease",
                          fontSize: "14px",
                        }}
                      >
                        {isDone && "✓"}
                      </div>
                      <span
                        style={{
                          fontSize: "15px",
                          fontWeight: 500,
                          textDecoration: isDone ? "line-through" : "none",
                          color: isDone ? "rgba(123, 232, 201, 0.5)" : "#e0f7f0",
                          lineHeight: 1.4,
                        }}
                      >
                        {task.label}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Day completion celebration */}
              {showCelebration && (
                <div
                  style={{
                    textAlign: "center",
                    marginTop: "16px",
                    padding: "16px",
                    borderRadius: "14px",
                    background: "rgba(45, 212, 160, 0.15)",
                    animation: "celebrate 0.6s ease",
                  }}
                >
                  <div style={{ fontSize: "32px", marginBottom: "4px" }}>🐢🎉🐢</div>
                  <div
                    style={{
                      fontFamily: "'Fredoka', sans-serif",
                      fontSize: "18px",
                      fontWeight: 600,
                      color: "#2dd4a0",
                    }}
                  >
                    {DAYS[selectedDay].name} done! Shell yeah!
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Turtle footer */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "8px",
              marginTop: "24px",
              opacity: 0.4,
            }}
          >
            <TurtleSvg size={28} color="#2dd4a0" />
            <TurtleSvg size={22} color="#7be8c9" />
            <TurtleSvg size={32} color="#2dd4a0" />
            <TurtleSvg size={24} color="#7be8c9" />
            <TurtleSvg size={28} color="#2dd4a0" />
          </div>

          {/* Reset button */}
          <div style={{ textAlign: "center", marginTop: "20px" }}>
            <button
              onClick={resetWeek}
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "rgba(123, 232, 201, 0.5)",
                padding: "8px 20px",
                borderRadius: "10px",
                fontSize: "12px",
                cursor: "pointer",
                fontFamily: "'Quicksand', sans-serif",
                fontWeight: 500,
              }}
            >
              Reset week
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
