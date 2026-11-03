"use client";

import { useLayoutEffect, useRef } from "react";
import type { Slip } from "@/lib/domain";
import { toIntOrZero } from "@/lib/domain/text";
import { cn } from "@/lib/utils";

interface Props {
  slip: Slip;
  label?: string;
  className?: string;
  printable?: boolean;
  id?: string;
}

export function SlipPreview({ slip, label = "Phiếu phân đơn", className, printable = true, id }: Props) {
  const paperRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const paper = paperRef.current;
    const content = contentRef.current;
    if (!paper || !content) return;
    let disposed = false;
    const fit = () => {
      if (disposed) return;
      const style = getComputedStyle(paper);
      const paperBounds = paper.getBoundingClientRect();
      const zoom = paperBounds.height / Number.parseFloat(style.height);
      const available = paperBounds.height - (Number.parseFloat(style.paddingTop) + Number.parseFloat(style.paddingBottom)) * zoom;
      const apply = (scale: number) => paper.style.setProperty("--slip-fit", String(scale));
      apply(1);
      if (content.getBoundingClientRect().height <= available) return;
      let low = 0;
      let high = 1;
      for (let step = 0; step < 16; step += 1) {
        const scale = (low + high) / 2;
        apply(scale);
        if (content.getBoundingClientRect().height <= available - 1) low = scale;
        else high = scale;
      }
      apply(low);
    };
    fit();
    void document.fonts.ready.then(fit);
    const observer = new ResizeObserver(fit);
    observer.observe(paper);
    window.addEventListener("beforeprint", fit);
    return () => { disposed = true; observer.disconnect(); window.removeEventListener("beforeprint", fit); };
  }, [slip]);
  // Skip the placeholder customer used for lines that have no allocation so
  // the table never gains a blank "KHÁCH" column.
  const customers = [...new Set(slip.lines.map((line) => line.khach).filter((khach) => khach !== ""))];
  const rows: { sku: string; total: string; quantities: Map<string, string> }[] = [];
  for (const line of slip.lines) {
    // Never add the repeated sheet total once per customer, or overwrite a duplicate allocation.
    let row = rows.find((item) => item.sku === line.sku && item.total === line.t && !item.quantities.has(line.khach));
    if (!row) {
      row = { sku: line.sku, total: line.t, quantities: new Map() };
      rows.push(row);
    }
    // A line with an empty customer marks an unallocated SKU: it keeps its
    // SL value and prints with empty customer cells instead of vanishing.
    if (line.khach !== "") row.quantities.set(line.khach, line.soLuong);
    // Status/remark columns are intentionally not printed; allocation uses
    // only the customer name and numeric quantity.
  }

  return (
    <article ref={paperRef} id={id} className={cn("slip shadow-xl shadow-black/10 print:shadow-none", !printable && "slipInvalid", className)} aria-label={label} data-print-valid={printable ? "true" : "false"}>
      <div ref={contentRef} className="slipContent">
        <header className="slipTitle">
          <div><div>LÔ: <strong className="slipValue">{slip.lo}</strong></div><div>KIỆN: <strong className="slipValue slipPackageValue">{slip.kien}</strong></div></div>
          <div className="slipMeta"><div>{slip.date ? <>Ngày: <strong className="slipValue">{slip.date}</strong></> : null}</div><div>TỔNG SKU: <strong className="slipValue">{slip.totalSku}</strong></div></div>
        </header>
        <table>
          <colgroup>
            <col style={{ width: "30%" }} /><col style={{ width: "12%" }} />
            {customers.length ? customers.map((customer) => <col key={customer} style={{ width: `${46 / customers.length}%` }} />) : <col style={{ width: "46%" }} />}
            <col style={{ width: "12%" }} />
          </colgroup>
          <thead>
            <tr><th rowSpan={2} scope="col">SKU</th><th rowSpan={2} scope="col">SL</th><th colSpan={Math.max(customers.length, 1)} scope="colgroup">KHÁCH</th><th rowSpan={2} scope="col">TỒN</th></tr>
            <tr>{customers.length ? customers.map((customer) => <th className="slipCustomer" key={customer} scope="col"><strong className="slipValue">{customer}</strong></th>) : <th scope="col">—</th>}</tr>
          </thead>
          <tbody>{rows.map((row, index) => (
            <tr key={`${row.sku}-${index}`}>
              <td><strong className="slipValue">{row.sku}</strong></td><td><strong className="slipValue">{row.total}</strong></td>
              {customers.map((customer) => <td key={customer}>{row.quantities.get(customer) ? <strong className="slipValue">{row.quantities.get(customer)}</strong> : ""}</td>)}
              {!customers.length ? <td /> : null}
              <td><strong className="slipValue">{toIntOrZero(row.total) - [...row.quantities.values()].reduce((sum, quantity) => sum + toIntOrZero(quantity), 0)}</strong></td>
            </tr>
          ))}</tbody>
        </table>
        {slip.unallocated > 0 ? <footer className="slipFooter">Tồn: {slip.unallocated}</footer> : null}
      </div>
    </article>
  );
}
