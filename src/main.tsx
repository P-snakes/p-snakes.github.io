import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import catalog from "./catalog";
import type { AchievementStats } from "../shared/types";
import { api } from "./api";
import { Icon } from "./components/Icons";
import { SubmissionForm } from "./components/SubmissionForm";
import { Catalog } from "./pages/Catalog";
import "./styles.css";

const Detail = lazy(() => import("./pages/Detail"));

function App() {
  const [route, setRoute] = useState(location.hash.slice(1) || "/");
  const [config, setConfig] = useState<{
    siteKey: string;
    eventName: string;
  } | null>(null);
  const [stats, setStats] = useState<AchievementStats[]>([]);
  const [totalSubmissions, setTotalSubmissions] = useState(0);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [menu, setMenu] = useState(false);
  const refreshStats = useCallback(() => {
    api
      .stats()
      .then((result) => {
        setStats(result.items);
        setTotalSubmissions(result.totalSubmissions);
        setReady(true);
      })
      .catch((error) => setError(error.message));
  }, []);
  const connect = useCallback(() => {
    setError("");
    api
      .config()
      .then(setConfig)
      .catch((error) => setError(error.message));
    refreshStats();
  }, [refreshStats]);
  useEffect(connect, [connect]);
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
            无法连接服务：{error}
            <button className="text-button" onClick={connect}>
              重试
            </button>
          </div>
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
              {config ? (
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
