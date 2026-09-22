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
  return (
    <article id={id} className={cn("slip shadow-xl shadow-black/10 print:shadow-none", !printable && "slipInvalid", className)} aria-label={label} data-print-valid={printable ? "true" : "false"}>
      <header className="slipTitle">
        <div><strong>LÔ:</strong> {slip.lo}</div>
        <div><strong>KIỆN:</strong> {slip.kien}</div>
      </header>
      <table>
        <thead><tr><th>SKU</th><th>T</th><th>KHÁCH</th><th>SL</th><th>GHI CHÚ</th></tr></thead>
        <tbody>{slip.lines.map((line, index) => (
          <tr key={`${line.sku}-${line.khach}-${index}`}>
            <td>{line.sku}</td><td>{line.t}</td><td>{line.khach}</td><td>{line.soLuong}</td><td>{line.ghiChu}</td>
          </tr>
        ))}</tbody>
      </table>
      <footer className="slipFooter">
        {slip.date ? <span>Ngày: {slip.date}</span> : null}<span>Tổng SKU: {slip.totalSku}</span>{slip.unallocated > 0 ? <span>Tồn: {slip.unallocated}</span> : null}
      </footer>
    </article>
  );
}
