import * as React from "react";
import {
  TableBody,
  TableCell,
  TableRow,
  Table,
  TableSelectionCell,
  useTableFeatures,
  useTableSelection,
  TableCellLayout,
  createTableColumn,
  type TableColumnDefinition,
} from "@fluentui/react-components";
import type { ICASODPD } from "@/dto/dto";

interface CASODPDProps {
  items: ICASODPD[];
  selectedDispute?: ICASODPD;
  onSelectionChange?: (selected: ICASODPD | undefined) => void;
}

export const DisputesSingleSelectTable: React.FC<CASODPDProps> = ({
  items,
  selectedDispute,
  onSelectionChange,
}) => {
  const columns: TableColumnDefinition<ICASODPD>[] = React.useMemo(
    () => [
      createTableColumn<ICASODPD>({
        columnId: "DPPID",
        renderHeaderCell: () => (
          <TableCellLayout
            style={{ width: 260, minWidth: 260, maxWidth: 260 }}
          ></TableCellLayout>
        ),

        renderCell: (item) => (
          <TableCellLayout style={{ width: 260, minWidth: 260, maxWidth: 260 }}>
            {item?.DPPID}
          </TableCellLayout>
        ),
      }),
    ],
    []
  );

  const {
    getRows,
    selection: { toggleRow, isRowSelected },
  } = useTableFeatures(
    {
      columns,
      items,
    },
    [
      useTableSelection({
        selectionMode: "single",
        defaultSelectedItems: selectedDispute
          ? new Set([selectedDispute.DPPID])
          : new Set(),
      }),
    ]
  );

  const rows = getRows((row) => {
    const selected = isRowSelected(row.item.DPPID);
    return {
      ...row,
      onClick: (e: React.MouseEvent) => {
        toggleRow(e, row.item.DPPID);

        const picked = items.find((it) => it.DPPID === row.item.DPPID);

        onSelectionChange?.(picked);
      },
      onKeyDown: (e: React.KeyboardEvent) => {
        if (e.key === " ") {
          e.preventDefault();
          toggleRow(e, row.item.DPPID);
          const picked = items.find(
            (it) => it.DPPID.toString() === row.item.DPPID.toString()
          );
          onSelectionChange?.(picked);
        }
      },

      selected,
      appearance: selected ? ("brand" as const) : ("none" as const),
    };
  });

  return (
    <Table
      size="extra-small"
      aria-label="Table with single selection"
      style={{ minWidth: "90px" }}
    >
      <TableBody>
        {rows.map(({ item, selected, onClick, onKeyDown, appearance }) => (
          <TableRow
            key={item.DPPID}
            onClick={onClick}
            onKeyDown={onKeyDown}
            aria-selected={selected}
            appearance={appearance}
          >
            <TableSelectionCell
              checked={selected}
              type="radio"
              radioIndicator={{ "aria-label": "Select row" }}
            />
            {/* pierwsza kolumna */}
            <TableCell>
              <TableCellLayout
                style={{ width: 260, minWidth: 260, maxWidth: 260 }}
              >
                <div style={{ display: "flex", gap: "10px" }}>
                  <div>{item.DPPID}</div>
                  <div>{item.DTHDES} </div>
                </div>
              </TableCellLayout>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
