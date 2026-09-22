import type { Slip } from "@/lib/domain";
import { cn } from "@/lib/utils";

interface Props {
  slip: Slip;
  label?: string;
  className?: string;
  printable?: boolean;
  id?: string;
}

export function SlipPreview({ slip, label = "Phiếu phân đơn", className, printable = true, id }: Props) {
  const customers = [...new Set(slip.lines.map((line) => line.khach))];
  const rows: { sku: string; total: string; quantities: Map<string, string>; notes: string[] }[] = [];
  for (const line of slip.lines) {
    // Never add the repeated sheet total once per customer, or overwrite a duplicate allocation.
    let row = rows.find((item) => item.sku === line.sku && item.total === line.t && !item.quantities.has(line.khach));
    if (!row) {
      row = { sku: line.sku, total: line.t, quantities: new Map(), notes: [] };
      rows.push(row);
    }
    row.quantities.set(line.khach, line.soLuong);
    // Status/remark columns are intentionally not printed; allocation uses
    // only the customer name and numeric quantity.
  }

  return (
    <article id={id} className={cn("slip shadow-xl shadow-black/10 print:shadow-none", !printable && "slipInvalid", className)} aria-label={label} data-print-valid={printable ? "true" : "false"}>
      <header className="slipTitle">
        <div><div>LÔ: <strong className="slipValue">{slip.lo}</strong></div><div>KIỆN: <strong className="slipValue">{slip.kien}</strong></div></div>
        <div className="slipMeta"><div>{slip.date ? <>Ngày: <strong className="slipValue">{slip.date}</strong></> : null}</div><div>TỔNG SKU: <strong className="slipValue">{slip.totalSku}</strong></div></div>
      </header>
      <table>
        <colgroup>
          <col style={{ width: "14%" }} /><col style={{ width: "14%" }} />
          {customers.map((customer) => <col key={customer} style={{ width: `${43 / customers.length}%` }} />)}
          <col style={{ width: "29%" }} />
        </colgroup>
        <thead>
          <tr><th rowSpan={2} scope="col">SKU</th><th rowSpan={2} scope="col">TỔNG</th><th colSpan={Math.max(customers.length, 1)} scope="colgroup">KHÁCH</th><th rowSpan={2} scope="col">GHI CHÚ</th></tr>
          <tr>{customers.length ? customers.map((customer) => <th className="slipCustomer" key={customer} scope="col"><strong className="slipValue">{customer}</strong></th>) : <th scope="col">—</th>}</tr>
        </thead>
        <tbody>{rows.map((row, index) => (
          <tr key={`${row.sku}-${index}`}>
            <td><strong className="slipValue">{row.sku}</strong></td><td><strong className="slipValue">{row.total}</strong></td>
            {customers.map((customer) => <td key={customer}>{row.quantities.get(customer) ? <strong className="slipValue">{row.quantities.get(customer)}</strong> : ""}</td>)}
            <td className="slipNotes">{row.notes.join("\n")}</td>
          </tr>
        ))}</tbody>
      </table>
      {slip.unallocated > 0 ? <footer className="slipFooter">Tồn: {slip.unallocated}</footer> : null}
    </article>
  );
}
