import FloatingTopButton from "./FloatingTopButton";
import { UPDATE_WORKLOG, WORKLOG_META } from "../data/updateWorklogData";

const ROADMAP_SECTIONS = [
  {
    status: "운영 검증",
    items: [
      "문의 접수·확인 중·처리 완료·종료 및 관리자 답변 메일의 실제 수신 점검",
      "Toss 심사 승인 후 운영 결제·웹훅 실수신 및 Personal 권한 동기화 검증",
      "가격·배당 데이터 정기 갱신과 만료 사진 삭제 스케줄 운영",
    ],
  },
  {
    status: "기능 개선",
    items: [
      "문의 답변 이메일 정규 컬럼 및 MY PAGE 관리자 답변 이력 표시",
      "메일 발송 실패 건 필터·재발송 및 문의 처리 감사 로그",
      "교육 계정 카드 PDF·인쇄 레이아웃과 수강생별 디지털 지급",
      "공지사항·업무일지 관리자 작성 기능",
    ],
  },
  {
    status: "검토",
    items: [
      "표준편차·상관계수 등 고급 위험지표",
      "모바일 시뮬레이터 전용 입력 UX",
      "Pro 플랜 범위와 투자자문 오해 방지 정책",
    ],
  },
];

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

function WorklogReference({ item }) {
  return (
    <li>
      <a href={item.url} target="_blank" rel="noopener noreferrer">
        <span className={`updateReferenceBadge ${item.type}`}>
          {item.type === "pr" ? `PR #${item.number}` : `커밋 ${item.sha}`}
        </span>
        <strong>{item.title}</strong>
      </a>
    </li>
  );
}

export default function UpdatesPage({ onNavigate }) {
  return (
    <main className="accountPage legalPage updatesWorklogPage">
      <UpdatesHeader onNavigate={onNavigate} />

      <section className="accountHero">
        <p className="sectionLabel">Worklog</p>
        <h1>업데이트 / 업무일지</h1>
        <p>
          FINPLE의 작업 내역을 한국시간 날짜, 작업 분야, GitHub PR과 직접 커밋 단위로 기록합니다.
          기능 묶음보다 실제 작업 이력을 우선합니다.
        </p>
      </section>

      <section className="accountCard updateWorklogSummary">
        <div>
          <span>기록 기간</span>
          <strong>{WORKLOG_META.fromDate} ~ {WORKLOG_META.toDate}</strong>
        </div>
        <div>
          <span>작업일</span>
          <strong>{WORKLOG_META.totalDays}일</strong>
        </div>
        <div>
          <span>병합 PR</span>
          <strong>{WORKLOG_META.totalPullRequests}건</strong>
        </div>
        <div>
          <span>직접 커밋</span>
          <strong>{WORKLOG_META.totalDirectCommits}건</strong>
        </div>
      </section>

      <section className="updateWorklogList" aria-label="FINPLE 날짜별 업무일지">
        {UPDATE_WORKLOG.map((day, index) => (
          <article key={day.date} className="accountCard updateWorklogDay">
            <header>
              <div>
                <p className="accountMiniLabel">{day.date}</p>
                <h2>{day.displayDate} 업무일지</h2>
                <p>{day.summary}</p>
              </div>
              <div className="updateWorklogCounts">
                {day.prCount > 0 ? <span>PR {day.prCount}건</span> : null}
                {day.commitCount > 0 ? <span>직접 커밋 {day.commitCount}건</span> : null}
              </div>
            </header>

            <div className="updateWorklogTasks">
              {day.tasks.map((task) => (
                <details key={`${day.date}-${task.category}`} open={index < 3}>
                  <summary>
                    <strong>{task.category}</strong>
                    <span>{task.items.length}건</span>
                  </summary>
                  <ul>
                    {task.items.map((item) => (
                      <WorklogReference key={`${item.type}-${item.number || item.sha}`} item={item} />
                    ))}
                  </ul>
                </details>
              ))}
            </div>
          </article>
        ))}
      </section>

      <section className="accountCard legalDocumentCard updateRoadmapCard">
        <article className="legalDocumentSection">
          <p className="accountMiniLabel">Roadmap</p>
          <h2>후속 작업</h2>
          <p>완료된 작업은 업무일지로 이동하고, 실제로 남은 운영 검증·기능 개선·검토 항목만 유지합니다.</p>
          <div className="updateRoadmapGrid">
            {ROADMAP_SECTIONS.map((section) => (
              <section key={section.status}>
                <h3>{section.status}</h3>
                <ul>
                  {section.items.map((item) => <li key={item}>{item}</li>)}
                </ul>
              </section>
            ))}
          </div>
        </article>
        <article className="legalDocumentSection">
          <h2>기록 기준</h2>
          <p>
            날짜는 Git 커밋 시각을 한국시간으로 변환해 표시합니다. PR로 병합된 작업은 PR 링크로,
            PR 없이 직접 반영된 작업은 커밋 링크로 구분합니다. 상세 작성·갱신 방법은 저장소의
            업데이트 업무일지 운영 문서를 기준으로 합니다.
          </p>
        </article>
        <article className="legalDocumentSection">
          <h2>투자 유의사항</h2>
          <p>
            FINPLE의 시뮬레이션, 차트, 리포트, 위험 지표는 투자 판단을 돕는 참고 자료입니다.
            특정 종목, ETF, 금융상품의 매수·매도 추천이나 투자 자문이 아니며, 과거 데이터와 예상값은 미래 수익을 보장하지 않습니다.
          </p>
        </article>
      </section>
      <FloatingTopButton ariaLabel="업데이트 페이지 상단으로 이동" />
    </main>
  );
}
