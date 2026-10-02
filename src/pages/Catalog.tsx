import { useMemo, useState } from "react";
import type { Achievement, AchievementStats } from "../../shared/types";
import { formatRate } from "../../shared/rate";
import { Icon } from "../components/Icons";

export function Catalog({
  achievements,
  stats,
  totalSubmissions,
  ready,
  overview,
  version,
}: {
  achievements: Achievement[];
  stats: AchievementStats[];
  totalSubmissions: number;
  ready: boolean;
  overview: boolean;
  version: string;
}) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [onlyCollected, setOnlyCollected] = useState(false);
  const statsMap = useMemo(
    () => new Map(stats.map((item) => [item.achievement_id, item])),
    [stats],
  );
  const collected = stats.filter((item) => item.total > 0).length;
  const filtered = useMemo(() => {
    const keyword = query.trim().toLocaleLowerCase();
    return achievements
      .filter(
        (achievement) =>
          achievement.name.toLocaleLowerCase().includes(keyword) &&
          (!onlyCollected || (statsMap.get(achievement.id)?.total || 0) > 0),
      )
      .sort((a, b) =>
        overview
          ? (statsMap.get(b.id)?.views || 0) -
              (statsMap.get(a.id)?.views || 0) || a.id - b.id
          : a.id - b.id,
      );
  }, [achievements, statsMap, query, onlyCollected, overview]);
  const pageSize = overview && !query ? 12 : 40;
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const visible = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow inline-eyebrow">
            <span>周年拾光册</span>
            <span className="version-pill">{version}</span>
          </div>
          <h1>{overview ? "成就达成率" : "全部成就"}</h1>
        </div>
        <a className="button primary" href="#/submit">
          提交达成率
        </a>
      </div>
      {overview && (
        <div className="overview-metrics">
          <div>
            <span>已有数据的成就</span>
            <strong>
              {ready ? collected.toLocaleString() : "—"}
              <small> / {achievements.length.toLocaleString()}</small>
            </strong>
          </div>
          <div>
            <span>已收集记录</span>
            <strong>{ready ? totalSubmissions.toLocaleString() : "—"}</strong>
          </div>
          <div>
            <span>每项收集上限</span>
            <strong>
              300<small> 条</small>
            </strong>
          </div>
        </div>
      )}
      <div className="catalog-toolbar">
        <div className="search-input">
          <Icon name="search" />
          <input
            aria-label="搜索成就"
            placeholder="搜索成就名称"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(1);
            }}
          />
          {query && (
            <button
              className="icon-button"
              aria-label="清空搜索"
              onClick={() => {
                setQuery("");
                setPage(1);
              }}
            >
              <Icon name="close" size={16} />
            </button>
          )}
        </div>
        <label className="collected-toggle">
          <input
            type="checkbox"
            checked={onlyCollected}
            onChange={(event) => {
              setOnlyCollected(event.target.checked);
              setPage(1);
            }}
          />
          已有数据
        </label>
      </div>
      <div className="section-heading catalog-heading">
        <h2>
          {query ? "搜索结果" : overview ? "热门成就" : "成就目录"}{" "}
          <span className="count">
            {query || !overview ? filtered.length : ""}
          </span>
        </h2>
        {overview && <span className="muted">按浏览次数排序</span>}
      </div>
      <div className="achievement-table">
        <div className="achievement-table-heading">
          <span>成就</span>
          <span>达成率</span>
          <span>提交占比</span>
          <span>收集记录</span>
          <span>浏览</span>
          <span />
        </div>
        {visible.map((achievement, index) => {
          const item = statsMap.get(achievement.id);
          const proportion = item?.total ? (item.votes / item.total) * 100 : 0;
          return (
            <a
              className="achievement-row"
              key={achievement.id}
              href={`#/achievement/${achievement.id}`}
            >
              <div className="achievement-title">
                {overview && !query && (
                  <span className={`rank ${index < 3 ? "top" : ""}`}>
                    {(page - 1) * pageSize + index + 1}
                  </span>
                )}
                <div>
                  <strong>{achievement.name}</strong>
                  <small>{achievement.category}</small>
                </div>
              </div>
              <strong className="achievement-rate">
                {ready && item?.rate !== null && item?.rate !== undefined ? (
                  <>
                    {formatRate(item.rate)}
                    <small>%</small>
                  </>
                ) : (
                  <span className="placeholder">—</span>
                )}
              </strong>
              <div className="consensus">
                {item?.total ? (
                  <>
                    <span>{proportion.toFixed(1)}%</span>
                    <div className="mini-bar">
                      <i style={{ width: `${proportion}%` }} />
                    </div>
                  </>
                ) : (
                  <span className="placeholder">—</span>
                )}
              </div>
              <span className="record-count">
                {ready ? item?.total || 0 : "—"}
                <small> / 300</small>
              </span>
              <span className="view-count">
                {ready ? (item?.views || 0).toLocaleString() : "—"}
              </span>
              <Icon name="chevron" size={17} />
            </a>
          );
        })}
        {!visible.length && (
          <p className="empty">{query ? "未找到成就" : "暂无数据"}</p>
        )}
      </div>
      {overview && !query ? (
        <div className="table-footer">
          <span>{visible.length} 项热门成就</span>
          <a href="#/all" className="text-button">
            查看全部 {achievements.length.toLocaleString()} 项
          </a>
        </div>
      ) : (
        <div className="pagination">
          <span>
            {filtered.length ? (page - 1) * pageSize + 1 : 0}–
            {Math.min(page * pageSize, filtered.length)} /{" "}
            {filtered.length.toLocaleString()}
          </span>
          <div>
            <button
              className="button"
              disabled={page === 1}
              onClick={() => setPage((value) => value - 1)}
            >
              上一页
            </button>
            <span>
              {page} / {pageCount}
            </span>
            <button
              className="button"
              disabled={page >= pageCount}
              onClick={() => setPage((value) => value + 1)}
            >
              下一页
            </button>
          </div>
        </div>
      )}
    </>
  );
}
