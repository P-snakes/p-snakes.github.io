import { useState } from "react";
import type { Achievement } from "../../shared/types";
import { Icon } from "./Icons";

export function AchievementPicker({
  achievements,
  selected,
  choose,
}: {
  achievements: Achievement[];
  selected: Achievement | null;
  choose: (achievement: Achievement | null) => void;
}) {
  const [query, setQuery] = useState("");
  const matches = achievements
    .filter((achievement) =>
      achievement.name
        .toLocaleLowerCase()
        .includes(query.trim().toLocaleLowerCase()),
    )
    .slice(0, 40);
  return (
    <div className="field">
      <label className="field-label" htmlFor="achievement-search">
        成就名称
      </label>
      {selected ? (
        <div className="selected-achievement">
          <div>
            <strong>{selected.name}</strong>
            <small>{selected.category}</small>
          </div>
          <button
            type="button"
            className="text-button"
            onClick={() => choose(null)}
          >
            更换
          </button>
        </div>
      ) : (
        <>
          <div className="search-input">
            <Icon name="search" />
            <input
              id="achievement-search"
              placeholder="搜索成就名称"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              autoComplete="off"
            />
          </div>
          <div
            className="picker-results"
            role="group"
            aria-label="成就搜索结果"
          >
            {matches.map((achievement) => (
              <button
                key={achievement.id}
                type="button"
                className="picker-row"
                onClick={() => choose(achievement)}
              >
                <span>{achievement.name}</span>
                <small>{achievement.category}</small>
              </button>
            ))}
            {!matches.length && <p className="empty-small">未找到成就</p>}
          </div>
        </>
      )}
    </div>
  );
}
