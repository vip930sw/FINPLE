import { useMemo, useState } from "react";
import "./InvestmentMbtiPage.css";

const QUESTIONS = [
  {
    id: "risk",
    title: "포트폴리오가 크게 흔들릴 때 어떤 쪽에 가깝나요?",
    leftLabel: "손실을 먼저 줄이고 싶다",
    rightLabel: "장기 수익 기회를 더 본다",
    leftTrait: "stable",
    rightTrait: "growth",
  },
  {
    id: "horizon",
    title: "투자 기간을 생각할 때 더 편한 방식은 무엇인가요?",
    leftLabel: "10년 이상 장기 복리",
    rightLabel: "시장 기회에 맞춘 조정",
    leftTrait: "longTerm",
    rightTrait: "opportunity",
  },
  {
    id: "control",
    title: "포트폴리오 관리는 어느 쪽이 편하신가요?",
    leftLabel: "자동화·간편 관리",
    rightLabel: "직접 점검·수정",
    leftTrait: "auto",
    rightTrait: "active",
  },
  {
    id: "conviction",
    title: "자산을 고를 때 더 선호하는 방식은 무엇인가요?",
    leftLabel: "여러 자산에 분산",
    rightLabel: "확신 있는 자산에 집중",
    leftTrait: "diversified",
    rightTrait: "conviction",
  },
];

const TYPE_MAP = {
  "stable-longTerm-auto-diversified": {
    finpleType: "복리 수호형",
    nickname: "차분한 수호자형",
    riskLevel: "안정추구형",
    traits: "안정 · 장기 · 자동 · 분산",
    summary: "큰 변동보다 꾸준한 복리와 분산을 중시하는 성향입니다.",
  },
  "stable-longTerm-auto-conviction": {
    finpleType: "코어 수호형",
    nickname: "신중한 코어빌더형",
    riskLevel: "안정추구형",
    traits: "안정 · 장기 · 자동 · 확신",
    summary: "핵심 자산을 오래 가져가되 과도한 관리 부담은 줄이려는 성향입니다.",
  },
  "stable-longTerm-active-diversified": {
    finpleType: "원칙 설계형",
    nickname: "용의주도한 설계자형",
    riskLevel: "위험중립형",
    traits: "안정 · 장기 · 주도 · 분산",
    summary: "분산 원칙을 세우고 직접 점검하면서 장기 운용하려는 성향입니다.",
  },
  "stable-longTerm-active-conviction": {
    finpleType: "핵심 설계형",
    nickname: "철저한 전략가형",
    riskLevel: "위험중립형",
    traits: "안정 · 장기 · 주도 · 확신",
    summary: "장기 핵심 자산을 선별하고 직접 관리하려는 성향입니다.",
  },
  "stable-opportunity-auto-diversified": {
    finpleType: "기회 관망형",
    nickname: "침착한 관찰자형",
    riskLevel: "안정추구형",
    traits: "안정 · 기회 · 자동 · 분산",
    summary: "시장 기회는 보되 급격한 변경보다는 분산과 관망을 선호합니다.",
  },
  "stable-opportunity-auto-conviction": {
    finpleType: "기회 선별형",
    nickname: "현명한 선별가형",
    riskLevel: "위험중립형",
    traits: "안정 · 기회 · 자동 · 확신",
    summary: "기회를 선별하되 과도한 리스크 확대는 경계하는 성향입니다.",
  },
  "stable-opportunity-active-diversified": {
    finpleType: "방어 전술형",
    nickname: "민첩한 리스크매니저형",
    riskLevel: "위험중립형",
    traits: "안정 · 기회 · 주도 · 분산",
    summary: "위험을 관리하면서 상황에 따라 직접 비중을 조정하려는 성향입니다.",
  },
  "stable-opportunity-active-conviction": {
    finpleType: "방어 승부형",
    nickname: "대담한 수비수형",
    riskLevel: "적극투자형",
    traits: "안정 · 기회 · 주도 · 확신",
    summary: "방어 기준을 갖고 있지만 확신 구간에서는 과감히 움직일 수 있습니다.",
  },
  "growth-longTerm-auto-diversified": {
    finpleType: "성장 적립형",
    nickname: "꾸준한 개척자형",
    riskLevel: "적극투자형",
    traits: "성장 · 장기 · 자동 · 분산",
    summary: "성장 자산을 장기 적립하되 넓게 나눠 운용하려는 성향입니다.",
  },
  "growth-longTerm-auto-conviction": {
    finpleType: "성장 코어형",
    nickname: "믿음직한 항해자형",
    riskLevel: "적극투자형",
    traits: "성장 · 장기 · 자동 · 확신",
    summary: "성장 핵심 자산을 오래 보유하며 복리 효과를 기대하는 성향입니다.",
  },
  "growth-longTerm-active-diversified": {
    finpleType: "성장 설계형",
    nickname: "균형 잡힌 건축가형",
    riskLevel: "적극투자형",
    traits: "성장 · 장기 · 주도 · 분산",
    summary: "성장성을 추구하면서도 포트폴리오 구조를 직접 설계하는 성향입니다.",
  },
  "growth-longTerm-active-conviction": {
    finpleType: "성장 전략형",
    nickname: "장기 성장 전략가형",
    riskLevel: "적극투자형",
    traits: "성장 · 장기 · 주도 · 확신",
    summary: "장기 성장 시나리오를 직접 만들고 확신 자산을 관리하는 성향입니다.",
  },
  "growth-opportunity-auto-diversified": {
    finpleType: "기회 확장형",
    nickname: "열린 탐험가형",
    riskLevel: "적극투자형",
    traits: "성장 · 기회 · 자동 · 분산",
    summary: "성장 기회를 넓게 탐색하면서도 간편한 운용을 선호합니다.",
  },
  "growth-opportunity-auto-conviction": {
    finpleType: "테마 집중형",
    nickname: "예리한 선구자형",
    riskLevel: "공격투자형",
    traits: "성장 · 기회 · 자동 · 확신",
    summary: "성장 테마에 민감하고 확신 자산을 빠르게 포착하려는 성향입니다.",
  },
  "growth-opportunity-active-diversified": {
    finpleType: "공세 운용형",
    nickname: "능동적인 지휘관형",
    riskLevel: "공격투자형",
    traits: "성장 · 기회 · 주도 · 분산",
    summary: "기회와 성장성을 적극적으로 보며 직접 비중을 조정하는 성향입니다.",
  },
  "growth-opportunity-active-conviction": {
    finpleType: "하이컨빅션형",
    nickname: "용감한 승부사형",
    riskLevel: "공격투자형",
    traits: "성장 · 기회 · 주도 · 확신",
    summary: "높은 성장 기회와 확신 자산에 강하게 반응하는 성향입니다.",
  },
};

const DEFAULT_TYPE = TYPE_MAP["growth-longTerm-active-diversified"];

function getResultFromAnswers(answers) {
  const selectedTraits = QUESTIONS.map((question) => {
    const value = answers[question.id];
    if (value === "right") return question.rightTrait;
    return question.leftTrait;
  });

  const key = selectedTraits.join("-");
  return TYPE_MAP[key] || DEFAULT_TYPE;
}

function InvestmentMbtiPage({ onBack, onNavigate }) {
  const [answers, setAnswers] = useState({});
  const isComplete = QUESTIONS.every((question) => answers[question.id]);
  const result = useMemo(() => getResultFromAnswers(answers), [answers]);

  function selectAnswer(questionId, side) {
    setAnswers((previous) => ({
      ...previous,
      [questionId]: side,
    }));
  }

  function resetAnswers() {
    setAnswers({});
  }

  return (
    <main className="page investmentMbtiPage">
      <header className="header">
        <button type="button" className="brandLogo resetButton" onClick={onBack}>
          <div className="brandIcon">
            <span>F</span>
            <i />
          </div>
          <div className="brandText">
            <strong>FINPLE</strong>
            <span>Investment MBTI</span>
          </div>
        </button>
        <button type="button" className="headerButton" onClick={onBack}>시작 메뉴</button>
      </header>

      <section className="investmentMbtiHero">
        <p className="badge">Beta Feature</p>
        <h1>투자 MBTI</h1>
        <p>
          간단한 4개 질문으로 투자 성향을 확인합니다. 결과는 투자 판단을 위한 참고자료이며,
          특정 금융상품의 매수·매도 추천이나 투자자문을 의미하지 않습니다.
        </p>
      </section>

      <section className="investmentMbtiContent">
        <div className="investmentMbtiQuestionList">
          {QUESTIONS.map((question, index) => (
            <article key={question.id} className="investmentMbtiQuestionCard">
              <strong>Q{index + 1}</strong>
              <h2>{question.title}</h2>
              <div className="investmentMbtiOptions">
                <button
                  type="button"
                  className={answers[question.id] === "left" ? "selected" : ""}
                  onClick={() => selectAnswer(question.id, "left")}
                >
                  {question.leftLabel}
                </button>
                <button
                  type="button"
                  className={answers[question.id] === "right" ? "selected" : ""}
                  onClick={() => selectAnswer(question.id, "right")}
                >
                  {question.rightLabel}
                </button>
              </div>
            </article>
          ))}
        </div>

        <aside className={isComplete ? "investmentMbtiResult ready" : "investmentMbtiResult"}>
          <p className="sectionLabel">Result</p>
          {isComplete ? (
            <>
              <h2>당신의 투자 MBTI는<br />{result.nickname}입니다.</h2>
              <dl>
                <div><dt>FINPLE 유형</dt><dd>{result.finpleType}</dd></div>
                <div><dt>성향</dt><dd>{result.traits}</dd></div>
                <div><dt>위험성향</dt><dd>{result.riskLevel}</dd></div>
              </dl>
              <p>{result.summary}</p>
              <div className="investmentMbtiResultActions">
                <button type="button" onClick={() => onNavigate("personal")}>시뮬레이터로 확인</button>
                <button type="button" className="secondaryMbtiButton" onClick={resetAnswers}>다시 하기</button>
              </div>
            </>
          ) : (
            <>
              <h2>질문을 모두 선택하면 결과가 표시됩니다.</h2>
              <p>투자 MBTI는 시뮬레이터로 넘어가기 전, 사용자가 자기 성향을 가볍게 이해하는 입구 역할을 합니다.</p>
            </>
          )}
        </aside>
      </section>

      <section className="investmentMbtiNotice" role="note">
        <strong>유의사항</strong>
        <p>
          본 결과는 사용자의 투자 성향 이해를 돕기 위한 참고자료입니다. 유형별 설명은 특정 금융상품의 추천,
          개인별 맞춤 투자자문, 투자일임 또는 수익 보장을 의미하지 않습니다.
        </p>
      </section>
    </main>
  );
}

export default InvestmentMbtiPage;
