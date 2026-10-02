import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import catalog from "./catalog";
import { readSnapshot, type Snapshot } from "./api";
import { currentMode } from "./snapshot";
import { Icon } from "./components/Icons";
import { SubmissionForm } from "./components/SubmissionForm";
import { Catalog } from "./pages/Catalog";
import "./styles.css";

const Detail = lazy(() => import("./pages/Detail"));

function App() {
  const [route, setRoute] = useState(location.hash.slice(1) || "/");
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [restricted, setRestricted] = useState(false);
  const stats = snapshot?.items || [];
  const totalSubmissions = snapshot?.totalSubmissions || 0;
  const mode = snapshot ? currentMode(snapshot) : "normal";
  const live = !restricted && mode === "normal";
  const config = snapshot && {
    eventName: snapshot.eventName,
    siteKey: snapshot.siteKey || import.meta.env.VITE_TURNSTILE_SITE_KEY || "",
  };
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [menu, setMenu] = useState(false);
  const refreshStats = useCallback(() => {
    readSnapshot()
      .then((result) => {
        setSnapshot(result);
        setRestricted(false);
        setReady(true);
      })
      .catch((error) => setError(error.message));
  }, []);
  const connect = useCallback(() => {
    setError("");
    refreshStats();
  }, [refreshStats]);
  useEffect(connect, [connect]);
  useEffect(() => {
    const restricted = () => setRestricted(true);
    window.addEventListener("snapshot-mode", restricted);
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") refreshStats();
    }, 5 * 60_000);
    return () => {
      window.removeEventListener("snapshot-mode", restricted);
      window.clearInterval(timer);
    };
  }, [refreshStats]);
  useEffect(() => {
    const changed = () => {
      setRoute(location.hash.slice(1) || "/");
      setMenu(false);
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", changed);
    return () => window.removeEventListener("hashchange", changed);
  }, []);
  const achievementId = Number(route.split("/")[2]);
  const achievement = catalog.achievements.find(
    (item) => item.id === achievementId,
  );
  const active = route.startsWith("/achievement") ? "/all" : route;
  const eventName = config?.eventName || "周年拾光册";

  return (
    <div className="app-shell">
      <aside className={`sidebar ${menu ? "expanded" : ""}`}>
        <a className="brand" href="#/">
          <span className="brand-mark">
            <Icon name="check" size={21} />
          </span>
          <span>
            原神成就<span className="brand-sub">达成率收集</span>
          </span>
        </a>
        <button
          className="mobile-menu icon-button"
          aria-label="切换导航"
          aria-expanded={menu}
          onClick={() => setMenu(!menu)}
        >
          <span>☰</span>
        </button>
        <nav aria-label="主要导航">
          <a className={active === "/" ? "active" : ""} href="#/">
            <Icon name="chart" />
            总览
          </a>
          <a className={active === "/all" ? "active" : ""} href="#/all">
            <Icon name="search" />
            全部成就
          </a>
          <a className={active === "/submit" ? "active" : ""} href="#/submit">
            <Icon name="upload" />
            提交达成率
          </a>
        </nav>
        <div className="sidebar-bottom">
          <span>{eventName}</span>
        </div>
      </aside>
      <main className="main-content">
        {error && (
          <div className="notice error" role="alert">
            {error}
            <button className="text-button" onClick={connect}>
              重试
            </button>
          </div>
        )}
        {snapshot?.generatedAt && (
          <p className="muted">
            快照更新：{new Date(snapshot.generatedAt).toLocaleString("zh-CN")}
            {!live && " · 凭证浏览暂停"}
          </p>
        )}
        {(route === "/" || route === "/all") && (
          <Catalog
            achievements={catalog.achievements}
            stats={stats}
            totalSubmissions={totalSubmissions}
            ready={ready}
            overview={route === "/"}
            version={catalog.version}
            key={route}
          />
        )}
        {route === "/submit" && (
          <div className="submission-page">
            <div className="page-heading">
              <div>
                <p className="eyebrow">{eventName}</p>
                <h1>提交达成率</h1>
              </div>
            </div>
            <div className="form-panel">
              {mode === "closed" ? (
                <p className="empty">今日接口额度已用完</p>
              ) : config ? (
                <SubmissionForm
                  achievements={catalog.achievements}
                  siteKey={config.siteKey}
                  eventName={config.eventName}
                  onSuccess={refreshStats}
                />
              ) : (
                <p className="empty">{error ? "服务未连接" : "加载中…"}</p>
              )}
            </div>
          </div>
        )}
        <Suspense fallback={<p className="empty">加载中…</p>}>
          {route.startsWith("/achievement/") &&
            (achievement ? (
              config && (
                <Detail
                  key={achievement.id}
                  achievement={achievement}
                  achievements={catalog.achievements}
                  siteKey={config.siteKey}
                  eventName={config.eventName}
                  refreshStats={refreshStats}
                  live={live}
                  closed={mode === "closed"}
                  recordCount={
                    stats.find((item) => item.achievement_id === achievement.id)
                      ?.total || 0
                  }
                  generatedAt={snapshot?.generatedAt || null}
                />
              )
            ) : (
              <p className="empty">未找到成就</p>
            ))}
        </Suspense>
      </main>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
