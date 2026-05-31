import {
    Clock,
    Gauge,
    BarChart3,
    Database,
    LineChart,
    UserRound,
    Briefcase,
    Plane,
  } from "lucide-react";
  import "./EconomicCalendarPolish.css";
  
  function EconomicCalendarSection() {
    return (
      <section className="section calendarSection">
        <p className="sectionLabel">Economic Calendar</p>
  
        <div className="sectionTopRow">
          <h2>주요 경제 일정과 발표 지표를 확인합니다.</h2>
          <p className="sectionSideText">
            미국·한국 주요 경제지표를 확인하여 포트폴리오 판단에 참고할 수 있습니다.
          </p>
        </div>
  
        <div className="economicGrid">
          <div className="investingCalendarBox">
            <iframe
              className="investingCalendarFrame"
              src="https://sslecal2.investing.com?ecoDayBackground=%23545454&borderColor=%23545454&columns=exc_flags,exc_actual,exc_forecast,exc_previous&category=_employment,_economicActivity,_inflation,_credit,_centralBanks,_confidenceIndex,_balance,_Bonds&importance=3&features=datepicker&countries=5,11&calType=week&timeZone=88&lang=18"
              width="100%"
              height="720"
              frameBorder="0"
              allowTransparency="true"
              marginWidth="0"
              marginHeight="0"
              title="Investing.com Economic Calendar"
            />
          </div>
  
          <EconomicIndicatorLinks />
        </div>
      </section>
    );
  }
  
  function EconomicIndicatorLinks() {
    const indicators = [
      {
        title: "FOMC 카운트다운",
        url: "https://www.investing.com/central-banks/fed-rate-monitor",
        icon: Clock,
      },
      {
        title: "공포&탐욕지수",
        url: "https://edition.cnn.com/markets/fear-and-greed",
        icon: Gauge,
      },
      {
        title: "미국 기준금리",
        url: "https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm",
        icon: BarChart3,
      },
      {
        title: "미국채 장단기 금리차",
        url: "https://fred.stlouisfed.org/series/T10Y2Y",
        icon: Database,
      },
      {
        title: "미국 물가상승률",
        url: "https://fred.stlouisfed.org/series/CPIAUCSL",
        icon: LineChart,
      },
      {
        title: "미국 노동부 JOLTs",
        url: "https://fred.stlouisfed.org/series/JTSJOL",
        icon: UserRound,
      },
      {
        title: "미국 실업률",
        url: "https://fred.stlouisfed.org/series/UNRATE",
        icon: Briefcase,
      },
      {
        title: "한국 기준금리",
        url: "https://www.bok.or.kr/portal/singl/baseRate/list.do?dataSeCd=01&menuNo=200643",
        icon: BarChart3,
        divider: true,
      },
      {
        title: "한국 물가상승률",
        url: "https://kosis.kr/eng/",
        icon: LineChart,
      },
      {
        title: "한국 무역수지",
        url: "https://www.index.go.kr/unity/potal/eNara/sub/showStblGams3.do?freq=Y&idx_cd=2735&period=N&stts_cd=273501",
        icon: Plane,
      },
    ];
  
    return (
      <div className="indicatorLinkPanel">
        {indicators.map((item) => {
          const Icon = item.icon;
  
          return (
            <a
              key={item.title}
              className={item.divider ? "indicatorLink divider" : "indicatorLink"}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              <span>{item.title}</span>
              <Icon size={30} strokeWidth={1.8} />
            </a>
          );
        })}
      </div>
    );
  }
  
  export default EconomicCalendarSection;
