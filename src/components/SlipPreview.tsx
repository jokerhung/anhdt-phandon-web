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

// dd/mm/yyyy -> dd-mm-yy; anything else is shown unchanged.
function shortDate(date: string): string {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(date.trim());
  return match ? `${match[1]}-${match[2]}-${match[3].slice(2)}` : date;
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
      // Short agent names (<= 4 chars, 26pt) that would wrap drop four sizes to 22pt.
      for (const th of content.querySelectorAll<HTMLElement>("th.slipCustomer:not(.slipCustomerLong)")) {
        th.classList.remove("slipCustomerTight");
        const text = th.firstElementChild as HTMLElement | null;
        if (!text) continue;
        text.style.whiteSpace = "nowrap";
        const cell = getComputedStyle(th);
        const room = th.clientWidth - Number.parseFloat(cell.paddingLeft) - Number.parseFloat(cell.paddingRight);
        if (text.getBoundingClientRect().width / zoom > room) th.classList.add("slipCustomerTight");
        text.style.whiteSpace = "";
      }
      // The one-line header must also fit horizontally; zoom widens the content's own box as it shrinks.
      const title = content.querySelector<HTMLElement>(".slipTitle");
      const fitsWidth = () => !title || title.scrollWidth <= title.clientWidth + 1;
      if (content.getBoundingClientRect().height <= available && fitsWidth()) return;
      let low = 0;
      let high = 1;
      for (let step = 0; step < 16; step += 1) {
        const scale = (low + high) / 2;
        apply(scale);
        if (content.getBoundingClientRect().height <= available - 1 && fitsWidth()) low = scale;
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
  const rows: { key: number | undefined; sku: string; total: string; quantities: Map<string, string> }[] = [];
  for (const line of slip.lines) {
    // Never add the repeated sheet total once per customer, or overwrite a duplicate allocation.
    // Lines carry their source sheet row, so same-SKU/same-SL rows are not merged into one.
    let row = rows.find((item) => line.row !== undefined ? item.key === line.row : item.key === undefined && item.sku === line.sku && item.total === line.t && !item.quantities.has(line.khach));
    if (!row) {
      row = { key: line.row, sku: line.sku, total: line.t, quantities: new Map() };
      rows.push(row);
    }
    // A line with an empty customer marks an unallocated SKU: it keeps its
    // SL value and prints with empty customer cells instead of vanishing.
    if (line.khach !== "") row.quantities.set(line.khach, line.soLuong);
    // Status/remark columns are intentionally not printed; allocation uses
    // only the customer name and numeric quantity.
  }

  return (
    <article ref={paperRef} id={id} className={cn("slip shadow-xl shadow-black/10 print:shadow-none", customers.length > 3 && "slipMany", !printable && "slipInvalid", className)} aria-label={label} data-print-valid={printable ? "true" : "false"}>
      <div ref={contentRef} className="slipContent">
        <header className="slipTitle">
          <span>LÔ: <strong className="slipValue">{slip.lo}</strong></span>
          <span className="slipSep" aria-hidden="true">|</span>
          <span>TỔNG SKU: <strong className="slipValue">{slip.totalSku}</strong></span>
          {slip.date ? <><span className="slipSep" aria-hidden="true">|</span><span>Ngày: <strong className="slipValue">{shortDate(slip.date)}</strong></span></> : null}
        </header>
        <table>
          <colgroup>
            <col style={{ width: "24%" }} /><col style={{ width: "10%" }} />
            {customers.length ? customers.map((customer) => <col key={customer} style={{ width: `${51 / customers.length}%` }} />) : <col style={{ width: "51%" }} />}
            <col style={{ width: "15%" }} />
          </colgroup>
          <thead>
            <tr><th scope="col">KIỆN</th><th rowSpan={2} scope="col">SL</th><th colSpan={Math.max(customers.length, 1)} scope="colgroup">KHÁCH</th><th rowSpan={2} scope="col" className="slipStock">KHO</th></tr>
            <tr><th scope="row" className="slipPackageCell"><span className="slipPackageValue">{slip.kien}</span>{!customers.length && slip.kienKho ? <div className="slipWarehouseCode">{slip.kienKho}</div> : null}</th>{customers.length ? customers.map((customer) => <th className={cn("slipCustomer", [...customer].length > 4 && "slipCustomerLong")} key={customer} scope="col"><strong className="slipValue">{customer}</strong></th>) : <th scope="col">—</th>}</tr>
          </thead>
          <tbody>{rows.map((row, index) => (
            <tr key={`${row.sku}-${index}`}>
              <td><strong className="slipValue">{row.sku.slice(0, 8)}</strong></td><td><strong className="slipValue">{row.total}</strong></td>
              {customers.map((customer) => <td key={customer}>{row.quantities.get(customer) ? <strong className={cn("slipValue", row.quantities.get(customer)!.trim().length > 2 && "slipQtyLong")}>{row.quantities.get(customer)}</strong> : ""}</td>)}
              {!customers.length ? <td /> : null}
              <td><strong className="slipValue">{toIntOrZero(row.total) - [...row.quantities.values()].reduce((sum, quantity) => sum + toIntOrZero(quantity), 0)}</strong></td>
            </tr>
          ))}</tbody>
        </table>
        {slip.unallocated > 0 ? <footer className="slipFooter">KHO: {slip.unallocated}</footer> : null}
      </div>
    </article>
  );
}
