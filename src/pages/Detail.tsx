import { useCallback, useEffect, useRef, useState } from "react";
import type { Achievement, Distribution, Submission } from "../../shared/types";
import { CAPACITY } from "../../shared/types";
import { formatRate } from "../../shared/rate";
import { api } from "../api";
import { Icon } from "../components/Icons";
import { Modal } from "../components/Modal";
import { PieChart } from "../components/PieChart";
import { ReportForm } from "../components/ReportForm";
import { Screenshot } from "../components/Screenshot";
import { SubmissionForm } from "../components/SubmissionForm";

export default function Detail({
  achievement,
  achievements,
  siteKey,
  eventName,
  refreshStats,
}: {
  achievement: Achievement;
  achievements: Achievement[];
  siteKey: string;
  eventName: string;
  refreshStats: () => void;
}) {
  const [distribution, setDistribution] = useState<Distribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeRate, setActiveRate] = useState<number | null>(null);
  const [jump, setJump] = useState(0);
  const [report, setReport] = useState<{
    submission: Submission | null;
  } | null>(null);
  const [submit, setSubmit] = useState(false);
  const [revision, setRevision] = useState(0);
  const total = distribution.reduce((sum, item) => sum + item.count, 0);
  const load = useCallback(() => {
    setLoading(true);
    setError("");
    api
      .detail(achievement.id)
      .then((result) => setDistribution(result.distribution))
      .catch((error) => setError(error.message))
      .finally(() => setLoading(false));
  }, [achievement.id]);
  useEffect(() => {
    load();
    api.view(achievement.id).catch(() => {});
  }, [load, achievement.id, refreshStats]);
  const choose = (rate: number) => {
    setActiveRate(rate);
    setJump((value) => value + 1);
  };
  const updated = () => {
    setRevision((value) => value + 1);
    load();
    refreshStats();
  };

  return (
    <>
      <a className="breadcrumb" href="#/all">
        全部成就
      </a>
      <div className="page-heading detail-heading">
        <div>
          <p className="eyebrow">{achievement.category}</p>
          <h1>{achievement.name}</h1>
          <p className="achievement-description">{achievement.description}</p>
        </div>
        <button
          className="button primary"
          onClick={() => setSubmit(true)}
          disabled={total >= CAPACITY || loading}
        >
          提交达成率
        </button>
      </div>
      {error && (
        <div className="notice error" role="alert">
          {error}
          <button className="text-button" onClick={load}>
            重试
          </button>
        </div>
      )}
      <div className="detail-metrics">
        <div>
          <span>达成率</span>
          <strong>
            {!loading && distribution.length ? (
              <>
                {formatRate(distribution[0].rate)}
                <small>%</small>
              </>
            ) : (
              "—"
            )}
          </strong>
        </div>
        <div>
          <span>提交占比</span>
          <strong>
            {!loading && total ? (
              <>
                {((distribution[0].count / total) * 100).toFixed(1)}
                <small>%</small>
              </>
            ) : (
              "—"
            )}
          </strong>
        </div>
        <div>
          <span>已收集</span>
          <strong>
            {loading ? "—" : total}
            <small> / 300</small>
          </strong>
        </div>
        <div>
          <span>剩余名额</span>
          <strong>{loading ? "—" : CAPACITY - total}</strong>
        </div>
      </div>
      <section className="panel">
        <div className="section-heading">
          <h2>提交值分布</h2>
          <span className="muted">{distribution.length} 个数据值</span>
        </div>
        {loading ? (
          <p className="empty">加载中…</p>
        ) : distribution.length ? (
          <PieChart
            distribution={distribution}
            activeRate={activeRate}
            choose={choose}
          />
        ) : (
          <div className="empty">
            <Icon name="chart" size={30} />
            <p>还没有提交记录</p>
          </div>
        )}
      </section>
      <section className="records-section">
        <div className="section-heading">
          <div>
            <h2>
              提交记录 <span className="count">{total}</span>
            </h2>
          </div>
          <button
            className="button"
            disabled={!total}
            onClick={() => setReport({ submission: null })}
          >
            反馈所有错误值
          </button>
        </div>
        {distribution.map((item) => (
          <RateGroup
            key={`${revision}-${item.rate}`}
            achievementId={achievement.id}
            group={item}
            selected={activeRate === item.rate}
            jump={jump}
            report={(submission) => setReport({ submission })}
          />
        ))}
        {!loading && !total && <p className="empty">暂无记录</p>}
      </section>
      {submit && (
        <Modal title="提交达成率" close={() => setSubmit(false)}>
          <SubmissionForm
            achievements={achievements}
            initial={achievement}
            siteKey={siteKey}
            eventName={eventName}
            onSuccess={updated}
          />
        </Modal>
      )}
      {report && (
        <Modal
          title={report.submission ? "反馈错误数据" : "反馈所有错误值"}
          close={() => setReport(null)}
        >
          <ReportForm
            achievement={achievement}
            distribution={distribution}
            submission={report.submission}
            siteKey={siteKey}
            close={() => setReport(null)}
          />
        </Modal>
      )}
    </>
  );
}

function RateGroup({
  achievementId,
  group,
  selected,
  jump,
  report,
}: {
  achievementId: number;
  group: Distribution;
  selected: boolean;
  jump: number;
  report: (submission: Submission) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const firstRecord = useRef<HTMLDivElement>(null);
  const [rows, setRows] = useState<Submission[]>([]);
  const [cursor, setCursor] = useState<number | null>(null);
  const [started, setStarted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const pending = useRef(false);
  const requested = useRef(false);
  const lastJump = useRef(-1);
  const mounted = useRef(true);
  const load = useCallback(
    async (next: number | null = null) => {
      if (pending.current) return;
      pending.current = true;
      requested.current = true;
      setBusy(true);
      setStarted(true);
      setError("");
      try {
        const page = await api.submissions(achievementId, group.rate, next);
        if (mounted.current) {
          setRows((previous) =>
            next === null ? page.items : [...previous, ...page.items],
          );
          setCursor(page.nextCursor);
        }
      } catch (error) {
        if (mounted.current) setError((error as Error).message);
      } finally {
        pending.current = false;
        if (mounted.current) setBusy(false);
      }
    },
    [achievementId, group.rate],
  );
  useEffect(() => {
    mounted.current = true;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          if (!requested.current) load();
          observer.disconnect();
        }
      },
      { rootMargin: "120px" },
    );
    observer.observe(ref.current!);
    return () => {
      mounted.current = false;
      observer.disconnect();
    };
  }, [load]);
  useEffect(() => {
    if (!selected || lastJump.current === jump) return;
    if (!started) load();
    if (rows.length) {
      firstRecord.current!.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      lastJump.current = jump;
    } else ref.current!.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [selected, jump, rows.length, started, load]);

  return (
    <div
      className={`rate-group ${selected ? "highlighted" : ""}`}
      ref={ref}
      id={`rate-${group.rate}`}
    >
      <div className="group-heading">
        <h3>
          {formatRate(group.rate)}
          <span>%</span>
        </h3>
        <span>{group.count} 条记录</span>
      </div>
      <div className="record-table-heading">
        <span>提交数据</span>
        <span>截图凭证</span>
        <span>提交时间</span>
        <span />
      </div>
      {rows.map((row, index) => (
        <div
          className="record-row"
          key={row.id}
          ref={index === 0 ? firstRecord : undefined}
        >
          <div>
            <strong>{formatRate(row.rate)}%</strong>
            <small>#{row.id}</small>
          </div>
          <Screenshot id={row.evidence_id} />
          <time dateTime={new Date(row.created_at * 1000).toISOString()}>
            {new Date(row.created_at * 1000).toLocaleString("zh-CN", {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </time>
          <button
            className="text-button report-button"
            onClick={() => report(row)}
          >
            错误数据？反馈
          </button>
        </div>
      ))}
      {busy && <p className="empty-small">加载中…</p>}
      {error && (
        <p className="error group-error" role="alert">
          {error}
          <button
            className="text-button"
            onClick={() => load(rows.length ? cursor : null)}
          >
            重试
          </button>
        </p>
      )}
      {!busy && cursor !== null && (
        <button className="load-more" onClick={() => load(cursor)}>
          加载更多{" "}
          <span>
            {rows.length} / {group.count}
          </span>
        </button>
      )}
    </div>
  );
}
