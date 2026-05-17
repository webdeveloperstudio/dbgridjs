# TcxGrid-inspired web grid capabilities

This document uses DevExpress VCL TcxGrid / ExpressQuantumGrid documentation as product research, not as an API or source-code clone. The goal for `dbgridjs` is to understand what users expect from a mature data grid and translate those ideas into browser-native TypeScript, DOM, CSS, and HTTP techniques.

Official reference points:

- https://docs.devexpress.com/VCL/cxGrid
- https://docs.devexpress.com/VCL/171093/ExpressQuantumGrid/vcl-data-grid

## Design principle

TcxGrid is a desktop VCL component. `dbgridjs` is a web library, so the implementation should not copy Pascal class names, component hierarchy, design-time behavior, or event signatures. Use the docs to identify capabilities and user workflows, then provide idiomatic web APIs.

Prefer web concepts:

- Plain TypeScript configuration objects instead of component inheritance trees.
- DOM rendering with semantic table/grid markup and accessible keyboard behavior.
- CSS classes/custom properties for appearance instead of VCL painters/skins.
- Client-side arrays, async fetch adapters, and server-side query contracts instead of VCL datasets.
- Browser events, callbacks, and promises instead of Delphi event procedure types.

## Capability map

| TcxGrid capability | Web-grid equivalent | Suggested `dbgridjs` technique |
| --- | --- | --- |
| Table View | Standard rows and columns | Render an HTML table or ARIA grid from `columns` and `data`. Keep current `DBGridOptions` as the main entry point. |
| Banded Table View | Grouped column headers | Add optional column bands that render multi-row headers with `colspan` / `rowspan`. |
| Card / Layout View | Responsive record cards | Support an alternate renderer where each row becomes a card layout, useful on mobile or detail-heavy records. |
| Chart View | Data visualization mode | Expose data/state so users can connect Chart.js, ECharts, or another chart adapter rather than building charts into the grid core. |
| WinExplorer-like view | Tile/list/gallery records | Add a custom row/item template hook for image-heavy datasets. |
| Bound data | Preloaded client data | Continue supporting `data: DBGridRow[]`. |
| Unbound/provider data | Custom data source | Add a `dataSource` function interface that returns rows from local memory, IndexedDB, or user code. |
| Server mode | Remote paging/filtering/sorting | Add request descriptors for page, page size, sort, filter, and group state; let applications map them to REST/GraphQL APIs. |
| Editing with in-cell editors | Inline browser controls | Render text, number, date, checkbox, select, and custom editors by column type. Emit validation and commit/cancel events. |
| In-place/modal edit forms | Row edit panel or dialog | Provide edit modes: `inline`, `form`, `popup`, and `readonly`. Keep form rendering customizable. |
| Group by box | Drag/drop grouping area | Allow users to drag column headers into a group panel; store group descriptors in state. |
| Group rows and footers | Collapsible grouped sections | Build a grouped row model with expanded/collapsed state and optional group summary rows. |
| Search and filter | Filter row, find panel, column menus | Keep filter row; add global search and column filter menus with typed operators. |
| Excel-style filtering | Rich column filter UI | For each column, generate value lists, range filters, date filters, boolean choices, and custom predicates. |
| Incremental search | Keyboard search within visible data | Add focused-cell state and type-to-find behavior for visible rows. |
| Multi-column sorting | Sort descriptors | Already represented by `DBGridSortDescriptor[]`; extend UI to support Shift-click multi-sort. |
| Master-detail | Nested row detail panels | Render expandable detail rows. Detail content can be another `DBGrid`, a template, or async-loaded HTML. |
| Summaries | Aggregates | Support total and group summaries: count, sum, min, max, average, and custom reducer. |
| Conditional formatting | Rules-based cell/row classes | Add style rules based on values, rows, or predicates; output CSS classes or inline style callbacks. |
| Selection/focused row | Browser interaction state | Continue selected keys and focused row; add keyboard navigation and range selection. |
| Navigator | Paging controls | Keep current navigator; add page-size selector, first/last buttons, record count, and loading state. |
| Layout customization | Column resize/reorder/show/hide | Use pointer events and persisted layout state in localStorage or an application callback. |
| Export | CSV/XLSX/HTML/print | Start with CSV and print styles. Add optional XLSX export through a small adapter dependency if needed. |
| Locked/loading view | Busy overlay | Add loading and error states for async data operations. |

## Current implementation coverage

`dbgridjs` currently covers the first web-grid layer:

- Root `DBGrid` mounted on a DOM selector.
- Column configuration with captions, visibility, width, alignment, type, custom rendering, safe escaping, and CSS hooks.
- Client-side sorting, filter row, focused row, single/multi selection, and paging navigator.
- Appearance and behavior option groups.
- Basic lifecycle and interaction events.

## Recommended roadmap

1. Remote data mode
   Add a `dataSource` contract that receives paging, sorting, filtering, and search state and returns `{ rows, totalCount }`. This is the web equivalent of provider/server modes.

2. Editing and validation
   Implement inline editors first, then form/popup editing. Add `onEditStart`, `onValidate`, `onSave`, `onCancel`, and `onDelete` callbacks.

3. Column UX
   Add resize, reorder, show/hide menu, fixed columns, persisted layout state, and multi-column sort UI.

4. Grouping and summaries
   Add group descriptors, grouped row generation, expand/collapse state, total summaries, and group summaries.

5. Detail rows
   Add expandable row detail templates for master-detail scenarios. Avoid making nested grids mandatory; any HTML/template content should be allowed.

6. Search and richer filtering
   Add a global find panel, typed filter operators, distinct-value menus, date/number range filters, and custom filter predicates.

7. Accessibility and keyboard support
   Implement ARIA grid roles, roving focus, keyboard row/cell navigation, selection shortcuts, editable-cell shortcuts, and screen-reader labels.

8. Export and print
   Add CSV export first, then print stylesheet support, then optional XLSX export through an adapter.

## API direction

Keep the API small and web-native. A future shape could look like this:

```ts
new DBGrid('#grid').render({
  keyField: 'id',
   columns: [
      { fieldName: 'customer', caption: 'Customer', sortable: true, filterable: true },
      { fieldName: 'amount', caption: 'Amount', dataType: 'number', summary: 'sum' }
   ],
  dataSource: async state => fetchOrders(state),
  paging: { enabled: true, pageSize: 25 },
  grouping: [{ fieldName: 'status' }],
  editing: { mode: 'inline', allowUpdate: true },
   details: {
      template: row => `<div>Order ${row.id}</div>`
   }
});
```

The names do not need to match TcxGrid. They should match what JavaScript developers expect from a modern web data grid.
