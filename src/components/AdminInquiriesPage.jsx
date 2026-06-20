import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  bulkCreateAdminEducationAccounts,
  deleteAdminEducationAccount,
  deleteAdminEducationAccounts,
  deleteExpiredAdminEducationAccounts,
  fetchAdminEducationAccounts,
  fetchAdminMembersSummary,
  fetchAdminSubscriptionsSummary,
  fetchSupportInquiryAttachments,
  fetchSupportInquiryReplies,
  fetchSupportInquiries,
  getFinpleAdminToken,
  sendSupportInquiryReply,
  updateSupportInquiryStatus,
} from "./portfolio/services/serverPortfolioService";

const ADMIN_MENU_ITEMS = [
  { key: "inquiries", page: "admin-inquiries", label: "문의사항 관리", description: "접수·처리 상태" },
  { key: "members", page: "admin-members", label: "회원 관리", description: "가입·구독 전환" },
  { key: "subscriptions", page: "admin-subscriptions", label: "구독 관리", description: "플랜·결제 기간" },
  { key: "education", page: "admin-education", label: "교육 계정 관리", description: "수업·만료 관리" },
  { key: "clear", page: "admin-clear", label: "관리자 모드 해제", description: "저장 토큰 삭제" },
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

const EDUCATION_STATUS_LABELS = {
  active: "활성",
  paused: "일시중지",
  expired: "만료",
  revoked: "회수",
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

function formatFileSize(value) {
  const bytes = Number(value || 0);
  if (bytes >= 1024 * 1024) return `${Math.round((bytes / 1024 / 1024) * 10) / 10}MB`;
  return `${Math.max(1, Math.round(bytes / 1024))}KB`;
}

function getDaysUntil(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return Math.ceil((date.getTime() - Date.now()) / 86400000);
}

function toDateInputValue(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function getActiveSectionFromPage(page) {
  if (page === "members") return "members";
  if (page === "subscriptions") return "subscriptions";
  if (page === "education") return "education";
  if (page === "clear") return "clear";
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
  const [inquiryAttachments, setInquiryAttachments] = useState({});
  const [attachmentMessages, setAttachmentMessages] = useState({});
  const [inquiryReplies, setInquiryReplies] = useState({});
  const [replyMessages, setReplyMessages] = useState({});
  const [replyDraft, setReplyDraft] = useState("");
  const [isReplySending, setIsReplySending] = useState(false);
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
  const [educationData, setEducationData] = useState(null);
  const [educationMessage, setEducationMessage] = useState("교육 계정 목록을 불러오면 수업별 계정과 만료 상태를 표시합니다.");
  const [educationCredentialsCsv, setEducationCredentialsCsv] = useState("");
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
  const selectedAttachments = selectedInquiry ? inquiryAttachments[selectedInquiry.id] || [] : [];
  const selectedAttachmentMessage = selectedInquiry
    ? attachmentMessages[selectedInquiry.id] ||
      (Number(selectedInquiry.attachmentCount || 0) > 0 ? "첨부 사진을 불러오는 중입니다." : "첨부된 사진이 없습니다.")
    : "";
  const selectedReplies = selectedInquiry ? inquiryReplies[selectedInquiry.id] || [] : [];
  const selectedReplyMessage = selectedInquiry
    ? replyMessages[selectedInquiry.id] || ""
    : "";

  const totalMembers = Number(memberData?.summary?.totalMembers || 0);
  const subscriberMembers = Number(memberData?.summary?.subscriberMembers || 0);
  const subscriptionRate = totalMembers > 0 ? (subscriberMembers / totalMembers) * 100 : 0;
  const activeSubscriptions = Number(subscriptionData?.summary?.activeSubscriptions || 0);
  const totalSubscriptions = Number(subscriptionData?.summary?.totalSubscriptions || 0);
  const churnWatchCount = Number(subscriptionData?.summary?.periodEnding7d || 0);

  function handleNavigateSection(item) {
    onNavigate(item.page);
  }

  function handleSelectInquiry(inquiryId) {
    setSelectedId(inquiryId);
    setReplyDraft("");
  }

  function handleClearAdminMode() {
    window.localStorage.removeItem("finple-admin-token");
    window.dispatchEvent(new Event("finple-admin-token-updated"));
    setIsAdminMode(false);
    setInquiries([]);
    setMemberData(null);
    setSubscriptionData(null);
    setEducationData(null);
    setEducationCredentialsCsv("");
    autoLoadedSectionsRef.current = {};
    setSelectedId(null);
    setStatusFilter("all");
    onNavigate("admin-login");
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
      setReplyDraft("");
      setInquiryMessage("문의사항 " + nextInquiries.length + "건을 불러왔습니다.");
    } catch (error) {
      setInquiryMessage(error?.message || "문의사항 목록을 불러오지 못했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!selectedInquiry?.id || !isAdminMode || inquiryAttachments[selectedInquiry.id]) return;
    let active = true;

    fetchSupportInquiryAttachments(selectedInquiry.id)
      .then((attachments) => {
        if (!active) return;
        setInquiryAttachments((current) => ({ ...current, [selectedInquiry.id]: attachments }));
        setAttachmentMessages((current) => ({
          ...current,
          [selectedInquiry.id]: attachments.length > 0 ? "" : "첨부된 사진이 없습니다.",
        }));
      })
      .catch((error) => {
        if (!active) return;
        setAttachmentMessages((current) => ({
          ...current,
          [selectedInquiry.id]: error?.message || "첨부 사진을 불러오지 못했습니다.",
        }));
      });

    return () => {
      active = false;
    };
  }, [selectedInquiry?.id, selectedInquiry?.attachmentCount, inquiryAttachments, isAdminMode]);

  useEffect(() => {
    if (!selectedInquiry?.id || !isAdminMode || inquiryReplies[selectedInquiry.id]) return;
    let active = true;

    fetchSupportInquiryReplies(selectedInquiry.id)
      .then((replies) => {
        if (!active) return;
        setInquiryReplies((current) => ({ ...current, [selectedInquiry.id]: replies }));
        setReplyMessages((current) => ({ ...current, [selectedInquiry.id]: "" }));
      })
      .catch((error) => {
        if (!active) return;
        setReplyMessages((current) => ({
          ...current,
          [selectedInquiry.id]: error?.message || "답변 이력을 불러오지 못했습니다.",
        }));
      });

    return () => {
      active = false;
    };
  }, [selectedInquiry?.id, inquiryReplies, isAdminMode]);

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

  const handleLoadEducationAccounts = useCallback(async function handleLoadEducationAccounts() {
    if (!getFinpleAdminToken()) return;
    setIsLoading(true);
    try {
      const data = await fetchAdminEducationAccounts();
      setEducationData(data);
      setEducationMessage(`교육 계정 ${data?.summary?.totalAccounts || 0}개를 확인했습니다.`);
    } catch (error) {
      setEducationMessage(error?.message || "교육 계정 목록을 불러오지 못했습니다.");
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
      } else if (activeSection === "education") {
        handleLoadEducationAccounts();
      }
    }, 0);

    return () => window.clearTimeout(loadTimer);
  }, [activeSection, handleLoadEducationAccounts, handleLoadInquiries, handleLoadMembers, handleLoadSubscriptions, isAdminMode]);

  async function handleBulkCreateEducationAccounts(input) {
    setIsLoading(true);
    try {
      const result = await bulkCreateAdminEducationAccounts(input);
      setEducationCredentialsCsv(result?.credentialsCsv || "");
      setEducationMessage(`교육 계정 ${result?.accounts?.length || 0}개를 일괄 생성했습니다. 초기 비밀번호는 목록 표와 CSV에서 확인하세요.`);
      await handleLoadEducationAccounts();
    } catch (error) {
      setEducationMessage(error?.message || "교육 계정을 일괄 생성하지 못했습니다.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDeleteEducationAccount(accountId, loginId) {
    if (typeof window !== "undefined") {
      const confirmed = window.confirm(`${loginId || "선택한 교육 계정"}을 삭제할까요? 로그인 계정과 권한이 함께 삭제됩니다.`);
      if (!confirmed) return;
    }

    setIsLoading(true);
    try {
      await deleteAdminEducationAccount(accountId);
      setEducationMessage("교육 계정을 삭제했습니다.");
      await handleLoadEducationAccounts();
    } catch (error) {
      setEducationMessage(error?.message || "교육 계정을 삭제하지 못했습니다.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDeleteSelectedEducationAccounts(accountIds = []) {
    if (!Array.isArray(accountIds) || accountIds.length === 0) {
      setEducationMessage("삭제할 교육 계정을 먼저 선택해 주세요.");
      return false;
    }

    if (typeof window !== "undefined") {
      const confirmed = window.confirm(`선택한 교육 계정 ${accountIds.length}개를 삭제할까요? 로그인 계정과 권한이 함께 삭제됩니다.`);
      if (!confirmed) return false;
    }

    setIsLoading(true);
    try {
      const result = await deleteAdminEducationAccounts(accountIds);
      setEducationCredentialsCsv("");
      setEducationMessage(`선택한 교육 계정 ${result?.deletedAccounts || 0}개를 삭제했습니다.`);
      await handleLoadEducationAccounts();
      return true;
    } catch (error) {
      setEducationMessage(error?.message || "선택한 교육 계정을 삭제하지 못했습니다.");
      return false;
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDeleteExpiredEducationAccounts(expiredCount = 0) {
    if (expiredCount < 1) {
      setEducationMessage("삭제할 만료 계정이 없습니다.");
      return false;
    }

    if (typeof window !== "undefined") {
      const confirmed = window.confirm(`만료된 교육 계정 ${expiredCount}개를 삭제할까요? 로그인 계정과 권한이 함께 삭제됩니다.`);
      if (!confirmed) return false;
    }

    setIsLoading(true);
    try {
      const result = await deleteExpiredAdminEducationAccounts();
      setEducationCredentialsCsv("");
      setEducationMessage(`만료된 교육 계정 ${result?.deletedAccounts || 0}개를 삭제했습니다.`);
      await handleLoadEducationAccounts();
      return true;
    } catch (error) {
      setEducationMessage(error?.message || "만료된 교육 계정을 삭제하지 못했습니다.");
      return false;
    } finally {
      setIsLoading(false);
    }
  }

  async function handleChangeStatus(inquiryId, status) {
    if (!inquiryId) return;

    setIsLoading(true);
    try {
      const result = await updateSupportInquiryStatus(inquiryId, status);
      const updatedInquiry = result?.inquiry;

      setInquiries((current) => current.map((inquiry) => (
        inquiry.id === inquiryId ? { ...inquiry, ...updatedInquiry } : inquiry
      )));
      const statusLabel = INQUIRY_STATUS_LABELS[status] || status;
      if (result?.notification?.reason === "status_unchanged") {
        setInquiryMessage(`이미 “${statusLabel}” 상태입니다. 중복 메일은 발송하지 않았습니다.`);
      } else if (result?.notification?.sent) {
        setInquiryMessage(`문의 상태를 “${statusLabel}”로 변경하고 ${result.notification.recipient || "답변 이메일"}로 알림 메일을 발송했습니다.`);
      } else {
        setInquiryMessage(`문의 상태는 “${statusLabel}”로 변경됐지만 알림 메일 발송에 실패했습니다: ${result?.notification?.error || result?.notification?.reason || "발송 결과를 확인할 수 없습니다."}`);
      }
    } catch (error) {
      setInquiryMessage(error?.message || "문의 상태를 변경하지 못했습니다.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSendReply(inquiryId) {
    const body = replyDraft.trim();
    if (!inquiryId || !body) {
      setInquiryMessage("관리자 답변 내용을 입력해 주세요.");
      return;
    }

    setIsReplySending(true);
    try {
      const result = await sendSupportInquiryReply(inquiryId, body);
      if (result?.reply) {
        setInquiryReplies((current) => ({
          ...current,
          [inquiryId]: [...(current[inquiryId] || []), result.reply],
        }));
      }
      setReplyDraft("");

      if (result?.notification?.sent) {
        setInquiryMessage(`관리자 답변을 저장하고 ${result.notification.recipient || "답변 이메일"}로 발송했습니다.`);
      } else {
        setInquiryMessage(`답변은 저장했지만 이메일 발송에 실패했습니다: ${result?.notification?.error || result?.notification?.reason || "발송 결과를 확인할 수 없습니다."}`);
      }
    } catch (error) {
      setInquiryMessage(error?.message || "관리자 답변을 등록하지 못했습니다.");
    } finally {
      setIsReplySending(false);
    }
  }

  return (
    <main className="accountPage adminInquiriesPage adminConsolePage">
      <section className="accountHero">
        <p className="sectionLabel">관리자 콘솔</p>
        <h1>관리자 콘솔</h1>
        <p>문의사항, 회원, 구독 상태를 한 화면 구조에서 관리합니다.</p>
      </section>

      <div className="myPageDashboardLayout adminConsoleLayout">
        <aside className="myPageSidebar adminConsoleSidebar">
          <div className="myPageSidebarHeader">
            <strong>관리자</strong>
            <span>관리자 메뉴</span>
          </div>
          <select
            className="myPageMobileMenuSelect"
            aria-label="관리자 메뉴 선택"
            value={activeSection}
            onChange={(event) => {
              const item = ADMIN_MENU_ITEMS.find((menuItem) => menuItem.key === event.target.value);
              if (item) handleNavigateSection(item);
            }}
          >
            {ADMIN_MENU_ITEMS.map((item) => (
              <option key={item.key} value={item.key}>{item.label}</option>
            ))}
          </select>
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
              selectedAttachments={selectedAttachments}
              attachmentMessage={selectedAttachmentMessage}
              selectedReplies={selectedReplies}
              replyMessage={selectedReplyMessage}
              replyDraft={replyDraft}
              setReplyDraft={setReplyDraft}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              setSelectedId={handleSelectInquiry}
              statusMessage={inquiryMessage}
              isAdminMode={isAdminMode}
              isLoading={isLoading}
              isReplySending={isReplySending}
              onLoadInquiries={handleLoadInquiries}
              onChangeStatus={handleChangeStatus}
              onSendReply={handleSendReply}
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

          {activeSection === "education" ? (
            <EducationAccountManagementPanel
              data={educationData}
              statusMessage={educationMessage}
              credentialsCsv={educationCredentialsCsv}
              isLoading={isLoading}
              onLoad={handleLoadEducationAccounts}
              onBulkCreate={handleBulkCreateEducationAccounts}
              onDeleteAccount={handleDeleteEducationAccount}
              onDeleteSelected={handleDeleteSelectedEducationAccounts}
              onDeleteExpired={handleDeleteExpiredEducationAccounts}
            />
          ) : null}

          {activeSection === "clear" ? (
            <AdminClearPanel onClear={handleClearAdminMode} />
          ) : null}
        </section>
      </div>
    </main>
  );
}

function AdminClearPanel({ onClear }) {
  return (
    <section className="accountCard adminManagementPanel adminClearPanel">
      <div className="serverStorageHeader">
        <div>
          <p className="accountMiniLabel">관리자 세션</p>
          <h2>관리자 모드 해제</h2>
          <p>현재 브라우저에 저장된 관리자 토큰을 삭제합니다.</p>
        </div>
      </div>

      <div className="adminClearBox">
        <p>해제 후에는 관리자 메뉴에 다시 접근할 때 관리자 토큰을 다시 입력해야 합니다.</p>
        <button type="button" className="primaryButton" onClick={onClear}>
          관리자 모드 해제
        </button>
      </div>
    </section>
  );
}

function InquiryManagementPanel({
  filteredInquiries,
  selectedInquiry,
  selectedAttachments,
  attachmentMessage,
  selectedReplies,
  replyMessage,
  replyDraft,
  setReplyDraft,
  statusFilter,
  setStatusFilter,
  setSelectedId,
  statusMessage,
  isAdminMode,
  isLoading,
  isReplySending,
  onLoadInquiries,
  onChangeStatus,
  onSendReply,
}) {
  return (
    <section className="accountCard adminManagementPanel adminConsoleInquiryPanel">
      <div className="serverStorageHeader">
        <div>
          <p className="accountMiniLabel">문의 관리</p>
          <h2>문의사항 관리</h2>
          <p>접수된 문의를 조회하고 처리 상태를 변경합니다.</p>
        </div>
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
                  <em>
                    {INQUIRY_CATEGORY_LABELS[inquiry.category] || "기타 문의"} · {formatServerDate(inquiry.createdAt || inquiry.created_at)}
                    {Number(inquiry.attachmentCount || 0) > 0 ? ` · 사진 ${inquiry.attachmentCount}장` : ""}
                  </em>
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
                <section className="adminInquiryAttachments">
                  <div className="adminInquiryAttachmentsHeader">
                    <div>
                      <span>첨부 사진</span>
                      <strong>{selectedAttachments.length || Number(selectedInquiry.attachmentCount || 0)}장</strong>
                    </div>
                    <p>사진 링크는 관리자 확인용으로 10분간 유효합니다.</p>
                  </div>
                  {selectedAttachments.length > 0 ? (
                    <div className="adminInquiryAttachmentGrid">
                      {selectedAttachments.map((attachment) => (
                        <a
                          key={attachment.id}
                          href={attachment.signedUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          title={`${attachment.fileName} 원본 보기`}
                        >
                          <img src={attachment.signedUrl} alt={attachment.fileName} />
                          <span>{attachment.fileName}</span>
                          <em>{formatFileSize(attachment.fileSize)} · 만료 {formatServerDate(attachment.expiresAt)}</em>
                        </a>
                      ))}
                    </div>
                  ) : (
                    <p className="adminInquiryAttachmentEmpty">
                      {attachmentMessage || "첨부된 사진이 없습니다."}
                    </p>
                  )}
                </section>
                <section className="adminInquiryReplyPanel">
                  <div className="adminInquiryReplyHeader">
                    <div>
                      <span>관리자 답변</span>
                      <strong>{selectedReplies.length}건</strong>
                    </div>
                    <p>답변은 문의자가 입력한 답변 이메일로 발송됩니다.</p>
                  </div>

                  {selectedReplies.length > 0 ? (
                    <div className="adminInquiryReplyHistory">
                      {selectedReplies.map((reply) => (
                        <article key={reply.id}>
                          <div>
                            <strong>{reply.emailSent ? "메일 발송 완료" : "메일 발송 실패"}</strong>
                            <time>{formatServerDate(reply.createdAt)}</time>
                          </div>
                          <p>{reply.body}</p>
                          <span>
                            {reply.recipientEmail}
                            {!reply.emailSent && reply.emailError ? ` · ${reply.emailError}` : ""}
                          </span>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <p className="adminInquiryReplyEmpty">{replyMessage || "아직 등록된 관리자 답변이 없습니다."}</p>
                  )}

                  <label className="adminInquiryReplyComposer">
                    <span>답변 내용</span>
                    <textarea
                      value={replyDraft}
                      onChange={(event) => setReplyDraft(event.target.value)}
                      maxLength={5000}
                      placeholder="문의자에게 전달할 답변을 입력해 주세요."
                      disabled={isReplySending}
                    />
                  </label>
                  <div className="adminInquiryReplyActions">
                    <span>{replyDraft.length.toLocaleString("ko-KR")} / 5,000자</span>
                    <button
                      type="button"
                      className="primaryButton"
                      onClick={() => onSendReply(selectedInquiry.id)}
                      disabled={isReplySending || !replyDraft.trim()}
                    >
                      {isReplySending ? "저장 및 발송 중..." : "답변 저장 및 메일 발송"}
                    </button>
                  </div>
                </section>
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
          <p className="accountMiniLabel">회원 관리</p>
          <h2>회원 관리</h2>
          <p>가입 회원 수, 구독자 수, 구독률과 최근 활동 상태를 확인합니다.</p>
        </div>
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

function EducationAccountManagementPanel({
  data,
  statusMessage,
  credentialsCsv,
  isLoading,
  onLoad,
  onBulkCreate,
  onDeleteAccount,
  onDeleteSelected,
  onDeleteExpired,
}) {
  const accounts = useMemo(() => (Array.isArray(data?.accounts) ? data.accounts : []), [data]);
  const summary = data?.summary || {};
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkFormError, setBulkFormError] = useState("");
  const [bulkForm, setBulkForm] = useState({
    prefix: "finple-class",
    startNumber: 1,
    endNumber: 10,
    cohortName: "",
    validUntil: "",
  });
  const selectedAccountIds = useMemo(
    () => selectedIds.filter((accountId) => accounts.some((account) => account.id === accountId)),
    [accounts, selectedIds]
  );
  const selectedIdSet = useMemo(() => new Set(selectedAccountIds), [selectedAccountIds]);
  const allAccountsSelected = accounts.length > 0 && accounts.every((account) => selectedIdSet.has(account.id));
  const expiredAccountCount = Number(
    summary.expiredAccounts ??
    accounts.filter((account) => (account.effectiveStatus || account.status) === "expired").length
  );

  function updateBulkField(field, value) {
    setBulkFormError("");
    setBulkForm((current) => ({ ...current, [field]: value }));
  }

  async function handleBulkSubmit(event) {
    event.preventDefault();
    const startNumber = Number(bulkForm.startNumber);
    const endNumber = Number(bulkForm.endNumber);
    if (!Number.isInteger(startNumber) || !Number.isInteger(endNumber) || startNumber < 1 || endNumber < 1) {
      setBulkFormError("시작번호와 끝번호는 1 이상의 정수로 입력해 주세요.");
      return;
    }
    if (startNumber > endNumber) {
      setBulkFormError("끝번호는 시작번호보다 크거나 같아야 합니다.");
      return;
    }

    await onBulkCreate({
      prefix: bulkForm.prefix,
      startNumber: bulkForm.startNumber,
      endNumber: bulkForm.endNumber,
      cohortName: bulkForm.cohortName,
      validUntil: bulkForm.validUntil,
    });
  }

  function toggleSelectedAccount(accountId) {
    setSelectedIds((current) => (
      current.includes(accountId)
        ? current.filter((selectedId) => selectedId !== accountId)
        : [...current, accountId]
    ));
  }

  function toggleSelectAllAccounts() {
    setSelectedIds(allAccountsSelected ? [] : accounts.map((account) => account.id));
  }

  async function handleDeleteSelected() {
    const didDelete = await onDeleteSelected(selectedAccountIds);
    if (didDelete) setSelectedIds([]);
  }

  return (
    <section className="accountCard adminManagementPanel educationAdminPanel">
      <div className="serverStorageHeader">
        <div>
          <p className="accountMiniLabel">교육 계정</p>
          <h2>교육 계정 관리</h2>
          <p>오프라인 수업과 세미나용 Personal 권한 계정을 일괄 생성하고 만료 상태를 관리합니다.</p>
        </div>
      </div>

      <div className="accountStatusGrid adminMetricGrid">
        <AdminMetricCard label="전체 교육 계정" value={`${summary.totalAccounts || 0}개`} note="생성된 계정" />
        <AdminMetricCard label="활성 계정" value={`${summary.activeAccounts || 0}개`} note="로그인 가능" />
        <AdminMetricCard label="7일 내 만료" value={`${summary.expiring7d || 0}개`} note="수업 종료 예정" />
        <AdminMetricCard label="최근 30일 로그인" value={`${summary.logins30d || 0}개`} note="교육 계정 사용" />
      </div>

      <p className="serverStorageMessage compact">{statusMessage}</p>

      <div className="adminInsightGrid educationAdminFormGrid">
        <article>
          <strong>일괄 생성</strong>
          <p>비밀번호는 qwerasdf 무작위 대소문자 + 3자리 번호 형식으로 자동 생성됩니다.</p>
          <form className="educationAdminForm" onSubmit={handleBulkSubmit}>
            <label>
              <span>ID</span>
              <input value={bulkForm.prefix} onChange={(event) => updateBulkField("prefix", event.target.value)} placeholder="finple-class" required />
            </label>
            <label>
              <span>시작번호</span>
              <input type="number" min="1" max="999999" value={bulkForm.startNumber} onChange={(event) => updateBulkField("startNumber", event.target.value)} />
            </label>
            <label>
              <span>끝번호</span>
              <input type="number" min="1" max="999999" value={bulkForm.endNumber} onChange={(event) => updateBulkField("endNumber", event.target.value)} />
            </label>
            <label>
              <span>수업/세미나명</span>
              <input value={bulkForm.cohortName} onChange={(event) => updateBulkField("cohortName", event.target.value)} placeholder="수업/세미나명" />
            </label>
            <label>
              <span>만료일</span>
              <input type="date" value={bulkForm.validUntil} onChange={(event) => updateBulkField("validUntil", event.target.value)} />
            </label>
            {bulkFormError ? <p className="educationAdminFormError">{bulkFormError}</p> : null}
            <div className="educationAdminFormActions">
              <button type="submit" className="primaryButton" disabled={isLoading}>일괄 생성</button>
              <button type="button" className="primaryButton" onClick={onLoad} disabled={isLoading}>
                {isLoading ? "불러오는 중..." : "교육 계정 새로고침"}
              </button>
              <button type="button" className="dangerSubtle" onClick={handleDeleteSelected} disabled={isLoading || selectedAccountIds.length === 0}>
                선택한 교육 계정 삭제{selectedAccountIds.length > 0 ? ` (${selectedAccountIds.length})` : ""}
              </button>
              <button type="button" className="dangerSubtle" onClick={() => onDeleteExpired(expiredAccountCount)} disabled={isLoading || expiredAccountCount === 0}>
                만료된 계정 삭제{expiredAccountCount > 0 ? ` (${expiredAccountCount})` : ""}
              </button>
            </div>
          </form>
        </article>
      </div>

      {credentialsCsv ? (
        <div className="educationCredentialPanel">
          <strong>생성 계정 CSV</strong>
          <textarea className="adminCsvTextArea" readOnly value={credentialsCsv} aria-label="교육 계정 CSV" />
        </div>
      ) : null}

      <div className="adminTableWrap">
        <table className="adminDataTable">
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  aria-label="교육 계정 전체 선택"
                  checked={allAccountsSelected}
                  onChange={toggleSelectAllAccounts}
                  disabled={accounts.length === 0 || isLoading}
                />
              </th>
              <th>교육용 ID</th>
              <th>비밀번호</th>
              <th>수업/세미나</th>
              <th>상태 (활성/만료)</th>
              <th>만료일</th>
              <th>최근 로그인</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            {accounts.length > 0 ? (
              accounts.map((account) => (
                <EducationAccountRow
                  key={`${account.id}-${account.validUntil || ""}`}
                  account={account}
                  isLoading={isLoading}
                  onDelete={onDeleteAccount}
                  isSelected={selectedIdSet.has(account.id)}
                  onToggleSelected={toggleSelectedAccount}
                />
              ))
            ) : (
              <tr><td colSpan="8">교육 계정 목록을 아직 불러오지 않았습니다.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function EducationAccountRow({ account, isLoading, onDelete, isSelected, onToggleSelected }) {
  const effectiveStatus = account.effectiveStatus || account.status || "active";
  return (
    <tr>
      <td>
        <input
          type="checkbox"
          aria-label={`${account.loginId} 선택`}
          checked={isSelected}
          onChange={() => onToggleSelected(account.id)}
          disabled={isLoading}
        />
      </td>
      <td><strong>{account.loginId}</strong><span>{account.label || account.email || "-"}</span></td>
      <td><strong className="monoText">{account.initialPassword || "-"}</strong></td>
      <td>{account.cohortName || "-"}</td>
      <td>
        <span className={`educationAccountStatus educationAccountStatus--${effectiveStatus}`}>
          {EDUCATION_STATUS_LABELS[effectiveStatus] || effectiveStatus}
        </span>
      </td>
      <td>{toDateInputValue(account.validUntil) || "-"}</td>
      <td>{formatShortDate(account.lastLoginAt)}</td>
      <td>
        <div className="adminRowActions">
          <button type="button" className="dangerSubtle" onClick={() => onDelete(account.id, account.loginId)} disabled={isLoading}>삭제</button>
        </div>
      </td>
    </tr>
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
          <p className="accountMiniLabel">구독 관리</p>
          <h2>구독 관리</h2>
          <p>총 구독자 수, 적용 플랜, 결제 기간과 환불 대응이 필요한 구간을 확인합니다.</p>
        </div>
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
