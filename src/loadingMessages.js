export const FINPLE_LOADING_MESSAGE_INTERVAL_MS = 2600;

export const FINPLE_LOADING_MESSAGES = [
  "투자 노트가 책상 위에 정렬되고 있습니다.",
  "MY PAGE를 깨우는 중입니다.",
  "계정 정보를 조심스럽게 불러오고 있습니다.",
  "포트폴리오 서랍을 여는 중입니다.",
  "오늘의 자산 기록을 가지런히 펼치고 있습니다.",
  "저장된 투자 메모를 찾아오는 중입니다.",
  "구독 상태를 차분히 확인하고 있습니다.",
  "결제 내역을 순서대로 맞추고 있습니다.",
  "문의 기록을 한 장씩 넘겨보고 있습니다.",
  "투자 성향 카드를 다시 정리하고 있습니다.",
  "서버와 브라우저 기록을 맞춰보는 중입니다.",
  "계정 보관함의 불을 켜고 있습니다.",
  "MY PAGE 책상 위를 정돈하고 있습니다.",
  "최근 변경 사항을 조용히 확인하고 있습니다.",
  "포트폴리오 이름표를 다시 붙이고 있습니다.",
  "안전한 로그인 상태를 확인하고 있습니다.",
  "저장된 설정을 제자리에 놓고 있습니다.",
  "개인화된 화면을 준비하고 있습니다.",
  "잠시 후 MY PAGE가 열립니다.",
  "FINPLE 작업대를 준비하고 있습니다.",
];

export function getRandomLoadingMessageIndex(excludedIndex = -1) {
  const messageCount = FINPLE_LOADING_MESSAGES.length;
  if (messageCount <= 1) return 0;

  const nextIndex = Math.floor(Math.random() * messageCount);
  return nextIndex === excludedIndex ? (nextIndex + 1) % messageCount : nextIndex;
}
