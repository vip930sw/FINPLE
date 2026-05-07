export default function DetailAssetTable({
  assets,
  totalAssetValue,
  formatNumber,
  formatPercent,
  formatDecimal,
}) {
  return (
    <div className="detailAssetTableWrap">
      <table className="detailAssetTable">
        <thead>
          <tr>
            <th>티커</th>
            <th>자산명</th>
            <th>수량</th>
            <th>현재가</th>
            <th>평가금액</th>
            <th>비중</th>
            <th>CAGR (%)</th>
            <th>BETA</th>
            <th>MDD (%)</th>
            <th>배당률 (%)</th>
          </tr>
        </thead>

        <tbody>
          {assets.map((asset, index) => {
            const assetValue = Number(asset.quantity || 0) * Number(asset.price || 0);
            const weight = totalAssetValue > 0 ? (assetValue / totalAssetValue) * 100 : 0;

            return (
              <tr key={`${asset.ticker || "asset"}-${index}`}>
                <td>{asset.ticker || "-"}</td>
                <td>{asset.name || "-"}</td>
                <td>{formatNumber(asset.quantity)}</td>
                <td>{formatNumber(asset.price)}원</td>
                <td>{formatNumber(assetValue)}원</td>
                <td>{formatPercent(weight)}</td>
                <td>{formatDecimal(asset.cagr, 2)}</td>
                <td>{formatDecimal(asset.beta, 2)}</td>
                <td>{formatDecimal(asset.mdd, 2)}</td>
                <td>{formatDecimal(asset.dividendYield, 2)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
