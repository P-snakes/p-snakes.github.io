import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Achievement, Distribution, Submission } from "../../shared/types";
import { CAPACITY } from "../../shared/types";
import { formatRate } from "../../shared/rate";
import { api, readRecords, type EvidenceAccess } from "../api";
import { groupDistribution } from "../snapshot";
import { Icon } from "../components/Icons";
import { Modal } from "../components/Modal";
import { PieChart } from "../components/PieChart";
import { ReportForm } from "../components/ReportForm";
import { Screenshot, EvidenceVerification } from "../components/Screenshot";
import { SubmissionForm } from "../components/SubmissionForm";

export default function Detail({
  achievement,
  achievements,
  siteKey,
  eventName,
  refreshStats,
  live,
  closed,
  recordCount,
  generatedAt,
}: {
  achievement: Achievement;
  achievements: Achievement[];
  siteKey: string;
  eventName: string;
  refreshStats: () => void;
  live: boolean;
  closed: boolean;
  recordCount: number;
  generatedAt: string | null;
}) {
  const [records, setRecords] = useState<Submission[]>([]);
  const distribution = useMemo(() => groupDistribution(records), [records]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeRate, setActiveRate] = useState<number | null>(null);
  const [jump, setJump] = useState(0);
  const [report, setReport] = useState<{
    submission: Submission | null;
  } | null>(null);
  const [submit, setSubmit] = useState(false);
  const [revision, setRevision] = useState(0);
  const [thumbnails, setThumbnails] = useState<EvidenceAccess | null>(null);
  const [verifyThumbnails, setVerifyThumbnails] = useState(false);
  const total = distribution.reduce((sum, item) => sum + item.count, 0);
  const load = useCallback(() => {
    setLoading(true);
    setError("");
    (recordCount ? readRecords(achievement.id) : Promise.resolve([]))
      .then(setRecords)
      .catch((error) => setError(error.message))
      .finally(() => setLoading(false));
  }, [achievement.id, recordCount, generatedAt]);
  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => {
    const day = new Date().toISOString().slice(0, 10);
    const key = `view:${achievement.id}`;
    if (live && localStorage.getItem(key) !== day) {
      localStorage.setItem(key, day);
      api.view(achievement.id).catch(() => {});
    }
  }, [achievement.id, live]);
  useEffect(() => {
    if (!live) {
      setThumbnails(null);
      setVerifyThumbnails(false);
    }
  }, [live]);
  useEffect(() => {
    if (!thumbnails) return;
    const timer = window.setTimeout(
      () => setThumbnails(null),
      Math.max(0, thumbnails.expiresAt - Date.now()),
    );
    return () => window.clearTimeout(timer);
  }, [thumbnails]);
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
          disabled={closed || total >= CAPACITY || loading}
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
            disabled={!total || closed}
            onClick={() => setReport({ submission: null })}
          >
            反馈所有错误值
          </button>
        </div>
        {!!total && (
          <label className="thumbnail-toggle">
            <input
              type="checkbox"
              checked={!!thumbnails}
              disabled={!live}
              onChange={(event) =>
                event.target.checked
                  ? setVerifyThumbnails(true)
                  : setThumbnails(null)
              }
            />
            查看缩略图
          </label>
        )}
        {distribution.map((item) => (
          <RateGroup
            key={`${revision}-${generatedAt}-${item.rate}`}
            group={item}
            records={records}
            live={live}
            closed={closed}
            siteKey={siteKey}
            thumbnailAccess={thumbnails?.access}
            selected={activeRate === item.rate}
            jump={jump}
            report={(submission) => setReport({ submission })}
          />
        ))}
        {!loading && !total && <p className="empty">暂无记录</p>}
      </section>
      {verifyThumbnails && (
        <Modal title="查看缩略图" close={() => setVerifyThumbnails(false)}>
          <EvidenceVerification
            siteKey={siteKey}
            variant="thumb"
            target={achievement.id}
            onVerified={(access) => {
              setThumbnails(access);
              setVerifyThumbnails(false);
            }}
          />
        </Modal>
      )}
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
  group,
  selected,
  jump,
  report,
  records,
  live,
  closed,
  siteKey,
  thumbnailAccess,
}: {
  group: Distribution;
  selected: boolean;
  jump: number;
  report: (submission: Submission) => void;
  records: Submission[];
  live: boolean;
  closed: boolean;
  siteKey: string;
  thumbnailAccess?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const firstRecord = useRef<HTMLDivElement>(null);
  const [started, setStarted] = useState(false);
  const [limit, setLimit] = useState(20);
  const lastJump = useRef(-1);
  const rows = started
    ? records.filter((row) => row.rate === group.rate).slice(0, limit)
    : [];
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setStarted(true);
          observer.disconnect();
        }
      },
      { rootMargin: "120px" },
    );
    observer.observe(ref.current!);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!selected || lastJump.current === jump) return;
    setStarted(true);
    if (firstRecord.current) {
      firstRecord.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      lastJump.current = jump;
    } else ref.current!.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [selected, jump, started]);
  return (
    <div
      className={"rate-group " + (selected ? "highlighted" : "")}
      ref={ref}
      id={"rate-" + group.rate}
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
          {live ? (
            <Screenshot
              id={row.evidence_id}
              siteKey={siteKey}
              thumbnailAccess={thumbnailAccess}
            />
          ) : (
            <span className="muted">暂停浏览</span>
          )}
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
            disabled={closed}
          >
            错误数据？反馈
          </button>
        </div>
      ))}
      {started && rows.length < group.count && (
        <button
          className="load-more"
          onClick={() => setLimit((value) => value + 20)}
        >
          加载更多{" "}
          <span>
            {rows.length} / {group.count}
          </span>
        </button>
      )}
    </div>
  );
}
