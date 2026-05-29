import { useMemo, useState } from "react";
import {
  fetchSupportInquiries,
  getFinpleAdminToken,
  updateSupportInquiryStatus,
} from "./portfolio/services/serverPortfolioService";

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

export default function AdminInquiriesPage({ onNavigate }) {
  const [adminTokenInput, setAdminTokenInput] = useState(() => getFinpleAdminToken());
  const [isAdminMode, setIsAdminMode] = useState(() => Boolean(getFinpleAdminToken()));
  const [inquiries, setInquiries] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [statusMessage, setStatusMessage] = useState(
    isAdminMode
      ? "문의사항 관리자 화면입니다. 문의 목록을 불러와 주세요."
      : "관리자 토큰을 입력하면 문의사항 관리 화면을 사용할 수 있습니다."
  );
  const [isLoading, setIsLoading] = useState(false);

  const filteredInquiries = useMemo(() => {
    if (statusFilter === "all") return inquiries;
    return inquiries.filter((inquiry) => inquiry.status === statusFilter);
  }, [inquiries, statusFilter]);

  const selectedInquiry =
    filteredInquiries.find((inquiry) => inquiry.id === selectedId) ||
    filteredInquiries[0] ||
    null;

  function handleSaveAdminToken() {
    const token = adminTokenInput.trim();

    if (!token) {
      setStatusMessage("관리자 토큰을 입력해 주세요.");
      return;
    }

    window.localStorage.setItem("finple-admin-token", token);
    window.dispatchEvent(new Event("finple-admin-token-updated"));
    setIsAdminMode(true);
    setStatusMessage("관리자 토큰을 저장했습니다. 문의 목록을 불러올 수 있습니다.");
  }

  function handleClearAdminToken() {
    window.localStorage.removeItem("finple-admin-token");
    window.dispatchEvent(new Event("finple-admin-token-updated"));
    setAdminTokenInput("");
    setIsAdminMode(false);
    setInquiries([]);
    setSelectedId(null);
    setStatusFilter("all");
    setStatusMessage("관리자 모드를 해제했습니다.");
  }

  async function handleLoadInquiries() {
    if (!getFinpleAdminToken()) {
      setStatusMessage("관리자 토큰을 먼저 저장해 주세요.");
      setIsAdminMode(false);
      return;
    }

    setIsLoading(true);
    try {
      const nextInquiries = await fetchSupportInquiries({ scope: "all" });
      setInquiries(nextInquiries);
      setSelectedId(nextInquiries[0]?.id || null);
      setStatusMessage("문의사항 " + nextInquiries.length + "건을 불러왔습니다.");
    } catch (error) {
      setStatusMessage(error?.message || "문의사항 목록을 불러오지 못했습니다.");
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
      setStatusMessage("문의 상태를 “" + (INQUIRY_STATUS_LABELS[status] || status) + "”로 변경했습니다.");
    } catch (error) {
      setStatusMessage(error?.message || "문의 상태를 변경하지 못했습니다.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="accountPage adminInquiriesPage">
      <section className="accountHero">
        <p className="sectionLabel">Admin Inquiries</p>
        <h1>문의사항 관리</h1>
        <p>관리자 토큰이 있는 브라우저에서 접수된 문의를 조회하고 처리 상태를 변경합니다.</p>
      </section>

      <section className="accountCard adminInquiryPanel standaloneAdminInquiryPanel">
        <div className="serverStorageHeader">
          <div>
            <p className="accountMiniLabel">Admin Mode</p>
            <h2>문의사항 관리자 조회</h2>
            <p>MY PAGE와 분리된 관리자 전용 문의 관리 화면입니다.</p>
          </div>
          <span className={isAdminMode ? "serverStatusBadge ready" : "serverStatusBadge"}>
            {isAdminMode ? "관리자" : "토큰 필요"}
          </span>
        </div>

        {!isAdminMode ? (
          <div className="adminTokenInlineBox">
            <label>
              관리자 토큰
              <input
                type="password"
                value={adminTokenInput}
                onChange={(event) => setAdminTokenInput(event.target.value)}
                placeholder="FINPLE_ADMIN_TOKEN 입력"
                autoComplete="off"
              />
            </label>
            <button type="button" className="primaryButton" onClick={handleSaveAdminToken}>
              관리자 토큰 저장
            </button>
          </div>
        ) : (
          <div className="adminInquiryToolbar">
            <button type="button" className="primaryButton" onClick={handleLoadInquiries} disabled={isLoading}>
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
            <button type="button" className="secondaryButton" onClick={handleClearAdminToken}>
              관리자 모드 해제
            </button>
          </div>
        )}

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
                      onChange={(event) => handleChangeStatus(selectedInquiry.id, event.target.value)}
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

        <div className="accountActionRow compactMyPageActions">
          <button type="button" className="secondaryButton" onClick={() => onNavigate("admin-login")}>관리자 로그인으로 이동</button>
          <button type="button" className="secondaryButton" onClick={() => onNavigate("home")}>홈으로 이동</button>
        </div>
      </section>
    </main>
  );
}
