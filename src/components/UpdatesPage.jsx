import { useMemo, useState } from "react";
import FloatingTopButton from "./FloatingTopButton";
import {
  ROADMAP_ITEMS,
  UPDATE_CATEGORIES,
  UPDATE_TYPE_LABELS,
  UPDATES,
} from "../data/updatesData";

function UpdatesHeader({ onNavigate }) {
  return (
    <header className="accountHeader">
      <button type="button" className="brandLogo resetButton" onClick={() => onNavigate("home")}>
        <div className="brandIcon"><span>F</span><i /></div>
        <div className="brandText"><strong>FINPLE</strong><span>Portfolio Lab</span></div>
      </button>
      <nav className="accountNav standardTopNav">
        <button type="button" onClick={() => onNavigate("home")}>홈</button>
        <button type="button" onClick={() => onNavigate("personal")}>시작하기</button>
        <button type="button" onClick={() => onNavigate("support")}>문의사항</button>
        <button type="button" onClick={() => onNavigate("mypage")}>MY PAGE</button>
        <button type="button" className="accountNavAuthButton" onClick={() => onNavigate("login")}>로그인</button>
      </nav>
    </header>
  );
}

function formatDate(date) {
  return date.replaceAll("-", ".");
}

function getUpdateGroups(updates) {
  return updates.reduce((groups, update) => {
    const month = update.date.slice(0, 7);
    const existingGroup = groups.find((group) => group.month === month);

    if (existingGroup) {
      existingGroup.updates.push(update);
    } else {
      groups.push({ month, updates: [update] });
    }

    return groups;
  }, []);
}

function UpdateCard({ update, expanded, onToggle }) {
  const panelId = `${update.id}-details`;

  return (
    <article className={`accountCard updateReleaseCard${expanded ? " isExpanded" : ""}`}>
      <button
        type="button"
        className="updateReleaseToggle"
        aria-expanded={expanded}
        aria-controls={panelId}
        onClick={onToggle}
      >
        <div className="updateReleaseHeading">
          <div className="updateReleaseMeta">
            <span className="updateVersionBadge">{update.version}</span>
            <time dateTime={update.date}>{formatDate(update.date)}</time>
          </div>
          <h2>{update.title}</h2>
          <p>{update.summary}</p>
          <div className="updateCategoryBadges" aria-label="업데이트 분류">
            {update.categories.map((category) => {
              const categoryInfo = UPDATE_CATEGORIES.find((item) => item.key === category);
              return categoryInfo ? <span key={category}>{categoryInfo.label}</span> : null;
            })}
          </div>
        </div>
        <span className="updateReleaseAction" aria-hidden="true">
          {expanded ? "접기" : "주요 변경사항 보기"}
          <i />
        </span>
      </button>

      {expanded ? (
        <div id={panelId} className="updateReleaseDetails">
          {Object.entries(update.changes).map(([type, items]) => (
            <section key={type}>
              <h3>{UPDATE_TYPE_LABELS[type] || "변경"}</h3>
              <ul>
                {items.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </section>
          ))}
        </div>
      ) : null}
    </article>
  );
}

export default function UpdatesPage({ onNavigate }) {
  const [activeCategory, setActiveCategory] = useState("all");
  const [expandedIds, setExpandedIds] = useState(() => new Set());

  const filteredUpdates = useMemo(
    () => (
      activeCategory === "all"
        ? UPDATES
        : UPDATES.filter((update) => update.categories.includes(activeCategory))
    ),
    [activeCategory],
  );
  const groupedUpdates = useMemo(() => getUpdateGroups(filteredUpdates), [filteredUpdates]);

  const toggleUpdate = (id) => {
    setExpandedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <main className="accountPage legalPage updatesReleasePage">
      <UpdatesHeader onNavigate={onNavigate} />

      <section className="accountHero updatesReleaseHero">
        <p className="sectionLabel">Updates</p>
        <h1>FINPLE 업데이트</h1>
        <p>새로 추가된 기능과 개선 사항, 오류 수정 내역을 날짜별로 확인하세요.</p>
      </section>

      <section className="accountCard updatesContentWidth updatesReleaseSummary" aria-label="업데이트 요약">
        <div>
          <span>현재 버전</span>
          <strong>{UPDATES[0].version}</strong>
        </div>
        <div>
          <span>최근 업데이트</span>
          <strong>{formatDate(UPDATES[0].date)}</strong>
        </div>
        <div>
          <span>업데이트 내역</span>
          <strong>{UPDATES.length}개</strong>
        </div>
        <div>
          <span>서비스 단계</span>
          <strong>Beta 운영 중</strong>
        </div>
      </section>

      <nav className="updatesContentWidth updatesReleaseFilters" aria-label="업데이트 분류">
        {UPDATE_CATEGORIES.map((category) => (
          <button
            type="button"
            key={category.key}
            className={activeCategory === category.key ? "isActive" : ""}
            aria-pressed={activeCategory === category.key}
            onClick={() => setActiveCategory(category.key)}
          >
            {category.label}
          </button>
        ))}
      </nav>

      <section className="updatesContentWidth updateReleaseList" aria-label="FINPLE 업데이트 내역">
        {groupedUpdates.map((group) => (
          <section key={group.month} className="updateReleaseMonth">
            <h2>{group.month.replace("-", "년 ")}월</h2>
            <div className="updateReleaseMonthCards">
              {group.updates.map((update) => (
                <UpdateCard
                  key={update.id}
                  update={update}
                  expanded={expandedIds.has(update.id)}
                  onToggle={() => toggleUpdate(update.id)}
                />
              ))}
            </div>
          </section>
        ))}
      </section>

      <section className="accountCard updatesContentWidth updateReleaseFooterCard">
        <div className="updateReleaseFooterIntro">
          <p className="accountMiniLabel">Roadmap</p>
          <h2>후속 작업</h2>
          <p>안정적인 서비스 운영과 사용자 경험 개선을 위해 준비 중인 항목입니다.</p>
        </div>
        <div className="updateRoadmapGrid">
          {ROADMAP_ITEMS.map((section) => (
            <section key={section.title}>
              <h3>{section.title}</h3>
              <ul>
                {section.items.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </section>
          ))}
        </div>
        <div className="updateReleaseNotice">
          <h2>서비스 이용 안내</h2>
          <p>
            FINPLE의 시뮬레이션, 차트, 리포트와 위험 지표는 투자 판단을 돕는 참고 자료입니다.
            특정 종목이나 금융상품의 매수·매도를 추천하거나 미래 수익을 보장하지 않습니다.
          </p>
        </div>
      </section>

      <FloatingTopButton ariaLabel="업데이트 페이지 상단으로 이동" />
    </main>
  );
}
