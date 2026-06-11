import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  fetchAdminMembersSummary,
  fetchAdminSubscriptionsSummary,
  fetchSupportInquiries,
  getFinpleAdminToken,
  updateSupportInquiryStatus,
} from "./portfolio/services/serverPortfolioService";

const ADMIN_MENU_ITEMS = [
  { key: "inquiries", page: "admin-inquiries", label: "문의사항 관리", description: "접수·처리 상태" },
  { key: "members", page: "admin-members", label: "회원 관리", description: "가입·구독 전환" },
  { key: "subscriptions", page: "admin-subscriptions", label: "구독 관리", description: "플랜·결제 기간" },
];

const INQUIRY_CATEGORY_LABELS = {
  bug: "오류 신고",
  feature: "기능 제안",
  payment: "결제 문의",
  data: "데이터 문의",
  etc: "기타 문의",
};

const INQUIRY_STATUS_LABELS = {
  open: "접수",
  in_progress: "확인 중",
  resolved: "처리 완료",
  closed: "종료",
};

const SUBSCRIPTION_STATUS_LABELS = {
  active: "활성",
  trialing: "체험",
  cancel_at_period_end: "기간 종료 예정",
  canceled: "해지",
  expired: "만료",
  beta_free: "베타 Free",
};

function formatServerDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatShortDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("ko-KR", { month: "2-digit", day: "2-digit" });
}

function formatPercent(value) {
  if (!Number.isFinite(value)) return "0%";
  return `${Math.round(value * 10) / 10}%`;
}

function formatKrw(value) {
  const amount = Number(value || 0);
  return `${amount.toLocaleString("ko-KR")}원`;
}

function getDaysUntil(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return Math.ceil((date.getTime() - Date.now()) / 86400000);
}

function getActiveSectionFromPage(page) {
  if (page === "members") return "members";
  if (page === "subscriptions") return "subscriptions";
  return "inquiries";
}

function AdminMetricCard({ label, value, note }) {
  return (
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
      <em>{note}</em>
    </div>
  );
}

export default function AdminInquiriesPage({ onNavigate, initialSection = "inquiries" }) {
  const activeSection = getActiveSectionFromPage(initialSection);
  const [isAdminMode, setIsAdminMode] = useState(() => Boolean(getFinpleAdminToken()));
  const [inquiries, setInquiries] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [inquiryMessage, setInquiryMessage] = useState(
    isAdminMode
      ? "문의사항 관리자 화면입니다. 문의 목록을 불러와 주세요."
      : "관리자 토큰을 입력하면 관리자 콘솔을 사용할 수 있습니다."
  );
  const [memberData, setMemberData] = useState(null);
  const [memberMessage, setMemberMessage] = useState("회원 통계를 불러오면 가입/구독 전환 현황이 표시됩니다.");
  const [subscriptionData, setSubscriptionData] = useState(null);
  const [subscriptionMessage, setSubscriptionMessage] = useState("구독 통계를 불러오면 플랜과 결제 기간이 표시됩니다.");
  const [isLoading, setIsLoading] = useState(false);
  const autoLoadedSectionsRef = useRef({});

  const filteredInquiries = useMemo(() => {
    if (statusFilter === "all") return inquiries;
    return inquiries.filter((inquiry) => inquiry.status === statusFilter);
  }, [inquiries, statusFilter]);

  const selectedInquiry =
    filteredInquiries.find((inquiry) => inquiry.id === selectedId) ||
    filteredInquiries[0] ||
    null;

  const totalMembers = Number(memberData?.summary?.totalMembers || 0);
  const subscriberMembers = Number(memberData?.summary?.subscriberMembers || 0);
  const subscriptionRate = totalMembers > 0 ? (subscriberMembers / totalMembers) * 100 : 0;
  const activeSubscriptions = Number(subscriptionData?.summary?.activeSubscriptions || 0);
  const totalSubscriptions = Number(subscriptionData?.summary?.totalSubscriptions || 0);
  const churnWatchCount = Number(subscriptionData?.summary?.periodEnding7d || 0);

  function handleNavigateSection(item) {
    onNavigate(item.page);
  }

  const handleLoadInquiries = useCallback(async function handleLoadInquiries() {
    if (!getFinpleAdminToken()) {
      setInquiryMessage("관리자 토큰을 먼저 저장해 주세요.");
      setIsAdminMode(false);
      return;
    }

    setIsLoading(true);
    try {
      const nextInquiries = await fetchSupportInquiries({ scope: "all" });
      setInquiries(nextInquiries);
      setSelectedId(nextInquiries[0]?.id || null);
      setInquiryMessage("문의사항 " + nextInquiries.length + "건을 불러왔습니다.");
    } catch (error) {
      setInquiryMessage(error?.message || "문의사항 목록을 불러오지 못했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleLoadMembers = useCallback(async function handleLoadMembers() {
    if (!getFinpleAdminToken()) return;
    setIsLoading(true);
    try {
      const data = await fetchAdminMembersSummary();
      setMemberData(data);
      setMemberMessage(`회원 ${data?.summary?.totalMembers || 0}명을 확인했습니다.`);
    } catch (error) {
      setMemberMessage(error?.message || "회원 통계를 불러오지 못했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleLoadSubscriptions = useCallback(async function handleLoadSubscriptions() {
    if (!getFinpleAdminToken()) return;
    setIsLoading(true);
    try {
      const data = await fetchAdminSubscriptionsSummary();
      setSubscriptionData(data);
      setSubscriptionMessage(`구독 ${data?.summary?.totalSubscriptions || 0}건을 확인했습니다.`);
    } catch (error) {
      setSubscriptionMessage(error?.message || "구독 통계를 불러오지 못했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAdminMode) return;
    if (autoLoadedSectionsRef.current[activeSection]) return;

    autoLoadedSectionsRef.current[activeSection] = true;
    const loadTimer = window.setTimeout(() => {
      if (activeSection === "inquiries") {
        handleLoadInquiries();
      } else if (activeSection === "members") {
        handleLoadMembers();
      } else if (activeSection === "subscriptions") {
        handleLoadSubscriptions();
      }
    }, 0);

    return () => window.clearTimeout(loadTimer);
  }, [activeSection, handleLoadInquiries, handleLoadMembers, handleLoadSubscriptions, isAdminMode]);

  async function handleChangeStatus(inquiryId, status) {
    if (!inquiryId) return;

    setIsLoading(true);
    try {
      const result = await updateSupportInquiryStatus(inquiryId, status);
      const updatedInquiry = result?.inquiry;

      setInquiries((current) => current.map((inquiry) => (
        inquiry.id === inquiryId ? { ...inquiry, ...updatedInquiry } : inquiry
      )));
      setInquiryMessage("문의 상태를 “" + (INQUIRY_STATUS_LABELS[status] || status) + "”로 변경했습니다.");
    } catch (error) {
      setInquiryMessage(error?.message || "문의 상태를 변경하지 못했습니다.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="accountPage adminInquiriesPage adminConsolePage">
      <section className="accountHero">
        <p className="sectionLabel">Admin Console</p>
        <h1>관리자 콘솔</h1>
        <p>문의사항, 회원, 구독 상태를 한 화면 구조에서 관리합니다.</p>
      </section>

      <div className="myPageDashboardLayout adminConsoleLayout">
        <aside className="myPageSidebar adminConsoleSidebar">
          <div className="myPageSidebarHeader">
            <strong>ADMIN</strong>
            <span>문의·회원·구독 관리</span>
          </div>
          <nav className="myPageSidebarNav" aria-label="관리자 메뉴">
            {ADMIN_MENU_ITEMS.map((item) => (
              <button
                key={item.key}
                type="button"
                className={activeSection === item.key ? "active" : ""}
                onClick={() => handleNavigateSection(item)}
              >
                <span>{item.label}</span>
                <em>{item.description}</em>
              </button>
            ))}
          </nav>
        </aside>

        <section className="accountPanelStack adminConsolePanels" aria-label="관리자 패널">
          {activeSection === "inquiries" ? (
            <InquiryManagementPanel
              filteredInquiries={filteredInquiries}
              selectedInquiry={selectedInquiry}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              setSelectedId={setSelectedId}
              statusMessage={inquiryMessage}
              isAdminMode={isAdminMode}
              isLoading={isLoading}
              onLoadInquiries={handleLoadInquiries}
              onChangeStatus={handleChangeStatus}
            />
          ) : null}

          {activeSection === "members" ? (
            <MemberManagementPanel
              data={memberData}
              statusMessage={memberMessage}
              totalMembers={totalMembers}
              subscriberMembers={subscriberMembers}
              subscriptionRate={subscriptionRate}
              isAdminMode={isAdminMode}
              isLoading={isLoading}
              onLoad={handleLoadMembers}
            />
          ) : null}

          {activeSection === "subscriptions" ? (
            <SubscriptionManagementPanel
              data={subscriptionData}
              statusMessage={subscriptionMessage}
              activeSubscriptions={activeSubscriptions}
              totalSubscriptions={totalSubscriptions}
              churnWatchCount={churnWatchCount}
              isAdminMode={isAdminMode}
              isLoading={isLoading}
              onLoad={handleLoadSubscriptions}
            />
          ) : null}
        </section>
      </div>
    </main>
  );
}

function InquiryManagementPanel({
  filteredInquiries,
  selectedInquiry,
  statusFilter,
  setStatusFilter,
  setSelectedId,
  statusMessage,
  isAdminMode,
  isLoading,
  onLoadInquiries,
  onChangeStatus,
}) {
  return (
    <section className="accountCard adminManagementPanel adminConsoleInquiryPanel">
      <div className="serverStorageHeader">
        <div>
          <p className="accountMiniLabel">Inquiries</p>
          <h2>문의사항 관리</h2>
          <p>접수된 문의를 조회하고 처리 상태를 변경합니다.</p>
        </div>
        <span className={isAdminMode ? "serverStatusBadge ready" : "serverStatusBadge"}>
          {isAdminMode ? "조회 가능" : "토큰 필요"}
        </span>
      </div>

      {isAdminMode ? (
        <div className="adminInquiryToolbar">
          <button type="button" className="primaryButton" onClick={onLoadInquiries} disabled={isLoading}>
            {isLoading ? "불러오는 중..." : "문의 목록 불러오기"}
          </button>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="all">전체 상태</option>
            <option value="open">접수</option>
            <option value="in_progress">확인 중</option>
            <option value="resolved">처리 완료</option>
            <option value="closed">종료</option>
          </select>
          <span>{filteredInquiries.length}건 표시</span>
        </div>
      ) : null}

      <p className="serverStorageMessage compact">{statusMessage}</p>

      {isAdminMode ? (
        <div className="adminInquiryLayout">
          <div className="adminInquiryList">
            {filteredInquiries.length > 0 ? (
              filteredInquiries.slice(0, 30).map((inquiry) => (
                <button
                  key={inquiry.id}
                  type="button"
                  className={inquiry.id === selectedInquiry?.id ? "adminInquiryItem active" : "adminInquiryItem"}
                  onClick={() => setSelectedId(inquiry.id)}
                >
                  <span className={"inquiryStatusBadge status-" + (inquiry.status || "open")}>
                    {INQUIRY_STATUS_LABELS[inquiry.status] || inquiry.status || "접수"}
                  </span>
                  <strong>{inquiry.title || "제목 없는 문의"}</strong>
                  <em>{INQUIRY_CATEGORY_LABELS[inquiry.category] || "기타 문의"} · {formatServerDate(inquiry.createdAt || inquiry.created_at)}</em>
                </button>
              ))
            ) : (
              <p className="serverPortfolioEmpty">문의 목록을 아직 불러오지 않았습니다.</p>
            )}
          </div>

          <div className="adminInquiryDetail">
            {selectedInquiry ? (
              <>
                <div className="adminInquiryDetailHeader">
                  <div>
                    <span>{INQUIRY_CATEGORY_LABELS[selectedInquiry.category] || "기타 문의"}</span>
                    <h3>{selectedInquiry.title || "제목 없는 문의"}</h3>
                    <p>접수일 {formatServerDate(selectedInquiry.createdAt || selectedInquiry.created_at)} · ID {String(selectedInquiry.id || "").slice(0, 8)}</p>
                  </div>
                  <select
                    value={selectedInquiry.status || "open"}
                    onChange={(event) => onChangeStatus(selectedInquiry.id, event.target.value)}
                    disabled={isLoading}
                  >
                    <option value="open">접수</option>
                    <option value="in_progress">확인 중</option>
                    <option value="resolved">처리 완료</option>
                    <option value="closed">종료</option>
                  </select>
                </div>
                <pre className="adminInquiryMessage">{selectedInquiry.message || "문의 내용이 없습니다."}</pre>
              </>
            ) : (
              <p className="serverPortfolioEmpty">왼쪽 목록에서 문의를 선택해 주세요.</p>
            )}
          </div>
        </div>
      ) : null}
    </section>
  );
}

function MemberManagementPanel({
  data,
  statusMessage,
  totalMembers,
  subscriberMembers,
  subscriptionRate,
  isAdminMode,
  isLoading,
  onLoad,
}) {
  const members = Array.isArray(data?.members) ? data.members : [];
  const planBreakdown = Array.isArray(data?.planBreakdown) ? data.planBreakdown : [];

  return (
    <section className="accountCard adminManagementPanel">
      <div className="serverStorageHeader">
        <div>
          <p className="accountMiniLabel">Members</p>
          <h2>회원 관리</h2>
          <p>가입 회원 수, 구독자 수, 구독률과 최근 활동 상태를 확인합니다.</p>
        </div>
        <span className={isAdminMode ? "serverStatusBadge ready" : "serverStatusBadge"}>
          {isAdminMode ? "조회 가능" : "토큰 필요"}
        </span>
      </div>

      <div className="accountStatusGrid adminMetricGrid">
        <AdminMetricCard label="가입 회원 수" value={`${totalMembers}명`} note="전체 계정" />
        <AdminMetricCard label="구독자 수" value={`${subscriberMembers}명`} note="유료 플랜 또는 활성 구독" />
        <AdminMetricCard label="구독률" value={formatPercent(subscriptionRate)} note="구독자 / 가입 회원" />
        <AdminMetricCard label="최근 30일 가입" value={`${data?.summary?.newMembers30d || 0}명`} note="신규 회원" />
        <AdminMetricCard label="최근 30일 로그인" value={`${data?.summary?.activeMembers30d || 0}명`} note="활성 회원 지표" />
        <AdminMetricCard label="전환 후보" value={`${Math.max(totalMembers - subscriberMembers, 0)}명`} note="Free/미구독 회원" />
      </div>

      <p className="serverStorageMessage compact">{statusMessage}</p>

      {isAdminMode ? (
        <div className="serverStorageActions compactActions">
          <button type="button" className="primaryButton" onClick={onLoad} disabled={isLoading}>
            {isLoading ? "불러오는 중..." : "회원 통계 새로고침"}
          </button>
        </div>
      ) : null}

      <div className="adminInsightGrid">
        <article>
          <strong>플랜 분포</strong>
          {planBreakdown.length > 0 ? (
            <div className="adminBreakdownList">
              {planBreakdown.map((item) => (
                <span key={item.plan}>{item.plan} <b>{item.members}명</b></span>
              ))}
            </div>
          ) : (
            <p>회원 통계를 불러오면 플랜별 회원 수가 표시됩니다.</p>
          )}
        </article>
        <article>
          <strong>추천 관리 포인트</strong>
          <p>최근 로그인은 했지만 구독하지 않은 회원을 우선 전환 후보로 보고, 포트폴리오 수와 문의 수를 함께 확인해 지원 우선순위를 잡을 수 있습니다.</p>
        </article>
      </div>

      <div className="adminTableWrap">
        <table className="adminDataTable">
          <thead>
            <tr>
              <th>회원</th>
              <th>플랜</th>
              <th>가입일</th>
              <th>최근 로그인</th>
              <th>구독</th>
              <th>포트폴리오</th>
              <th>문의</th>
            </tr>
          </thead>
          <tbody>
            {members.length > 0 ? (
              members.map((member) => (
                <tr key={member.id}>
                  <td><strong>{member.email || member.name || "이메일 없음"}</strong><span>{member.nickname || member.name || "-"}</span></td>
                  <td>{member.plan || "free"}</td>
                  <td>{formatShortDate(member.createdAt)}</td>
                  <td>{formatShortDate(member.lastLoginAt)}</td>
                  <td>{member.activeSubscriptionCount || 0}건</td>
                  <td>{member.portfolioCount || 0}개</td>
                  <td>{member.inquiryCount || 0}건</td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="7">회원 통계를 아직 불러오지 않았습니다.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function SubscriptionManagementPanel({
  data,
  statusMessage,
  activeSubscriptions,
  totalSubscriptions,
  churnWatchCount,
  isAdminMode,
  isLoading,
  onLoad,
}) {
  const subscriptions = Array.isArray(data?.subscriptions) ? data.subscriptions : [];
  const breakdown = Array.isArray(data?.planStatusBreakdown) ? data.planStatusBreakdown : [];

  return (
    <section className="accountCard adminManagementPanel">
      <div className="serverStorageHeader">
        <div>
          <p className="accountMiniLabel">Subscriptions</p>
          <h2>구독 관리</h2>
          <p>총 구독자 수, 적용 플랜, 결제 기간과 환불 대응이 필요한 구간을 확인합니다.</p>
        </div>
        <span className={isAdminMode ? "serverStatusBadge ready" : "serverStatusBadge"}>
          {isAdminMode ? "조회 가능" : "토큰 필요"}
        </span>
      </div>

      <div className="accountStatusGrid adminMetricGrid">
        <AdminMetricCard label="총 구독 건수" value={`${totalSubscriptions}건`} note="전체 구독 이력" />
        <AdminMetricCard label="활성 구독자 수" value={`${activeSubscriptions}건`} note="active/trialing/종료 예정" />
        <AdminMetricCard label="7일 내 기간 종료" value={`${churnWatchCount}건`} note="환불·해지 대응 후보" />
        <AdminMetricCard label="확정 결제액" value={formatKrw(data?.summary?.confirmedRevenue)} note="confirmed payments 합계" />
      </div>

      <p className="serverStorageMessage compact">{statusMessage}</p>

      {isAdminMode ? (
        <div className="serverStorageActions compactActions">
          <button type="button" className="primaryButton" onClick={onLoad} disabled={isLoading}>
            {isLoading ? "불러오는 중..." : "구독 통계 새로고침"}
          </button>
        </div>
      ) : null}

      <div className="adminInsightGrid">
        <article>
          <strong>플랜 / 상태 분포</strong>
          {breakdown.length > 0 ? (
            <div className="adminBreakdownList">
              {breakdown.map((item) => (
                <span key={`${item.plan}-${item.status}`}>
                  {item.plan} · {SUBSCRIPTION_STATUS_LABELS[item.status] || item.status} <b>{item.subscriptions}건</b>
                </span>
              ))}
            </div>
          ) : (
            <p>구독 통계를 불러오면 플랜과 상태별 건수가 표시됩니다.</p>
          )}
        </article>
        <article>
          <strong>환불 대응 제안</strong>
          <p>결제 기간 종료 7일 이내 구독은 환불·해지 문의가 들어올 가능성이 높으므로, 최근 결제 상태와 기간 종료일을 우선 확인하세요.</p>
        </article>
      </div>

      <div className="adminTableWrap">
        <table className="adminDataTable">
          <thead>
            <tr>
              <th>회원</th>
              <th>플랜</th>
              <th>상태</th>
              <th>결제 기간</th>
              <th>남은 기간</th>
              <th>최근 결제</th>
            </tr>
          </thead>
          <tbody>
            {subscriptions.length > 0 ? (
              subscriptions.map((subscription) => {
                const daysUntilEnd = getDaysUntil(subscription.currentPeriodEnd);
                return (
                  <tr key={subscription.id}>
                    <td><strong>{subscription.email || subscription.name || "회원 정보 없음"}</strong><span>{String(subscription.userId || "").slice(0, 8)}</span></td>
                    <td>{subscription.plan || "free"}</td>
                    <td>{SUBSCRIPTION_STATUS_LABELS[subscription.status] || subscription.status || "-"}</td>
                    <td>{formatShortDate(subscription.startedAt)} - {formatShortDate(subscription.currentPeriodEnd)}</td>
                    <td className={daysUntilEnd !== null && daysUntilEnd <= 7 ? "adminWarningText" : ""}>
                      {daysUntilEnd === null ? "-" : `${daysUntilEnd}일`}
                    </td>
                    <td>{subscription.latestPaymentAmount === null ? "-" : formatKrw(subscription.latestPaymentAmount)}</td>
                  </tr>
                );
              })
            ) : (
              <tr><td colSpan="6">구독 통계를 아직 불러오지 않았습니다.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
