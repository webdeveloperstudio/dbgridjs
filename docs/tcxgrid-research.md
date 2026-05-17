# TcxGrid research and dbgridjs mapping

This is the working inventory for building a web grid similar to Delphi DevExpress `TcxGrid`. DevExpress documentation was not reachable from this sandbox, so this file captures the implementation target from common VCL TcxGrid concepts and should be refined against official docs when available.

## TcxGrid concepts to model

- Grid control: root component that hosts one or more levels/views.
- Levels: hierarchical containers that connect master/detail views.
- Views: table, banded table, card, layout, tree list, and DB-bound variants.
- Data controller: records, keys, sorting, filtering, grouping, summaries, bookmarks, master/detail, and data operations.
- Columns/items: field binding, captions, visibility, width, alignment, editors, display formats, sorting/filtering/grouping capabilities, fixed columns, summaries, and custom drawing.
- Options groups: appearance, behavior, customize, data, selection, view, editing, filtering, sorting, grouping, navigator, and printing/exporting.
- Events: lifecycle, data loading, editing, validation, focus/selection changes, cell/row clicks, custom draw, sorting/filtering/grouping changes, and error handling.

## Initial dbgridjs mapping

| TcxGrid area | dbgridjs initial API |
| --- | --- |
| Root control | `DBGrid` class mounted on a DOM selector |
| Table view | `DBGridOptions` with `columns` and `data` |
| Data controller | `keyField`, `data`, `sorting`, `filters`, and `paging` |
| Columns | `DBGridColumn` with field, caption, visibility, width, alignment, type, configurable boolean labels, escaped renderer output, sortable, and filterable flags |
| Appearance options | `appearance.showColumnHeaders`, `showFilterRow`, `showGridLines`, `stripedRows`, `rowHeight`, `emptyText` |
| Behavior options | `behavior.allowSorting`, `allowFiltering`, `allowColumnResize`, `focusedRowEnabled`, `multiSelect` |
| Editing options | `editing.allowInsert`, `allowUpdate`, `allowDelete`, and `mode` placeholders |
| Navigator | `paging.enabled`, `pageIndex`, `pageSize`, and `showNavigator` |
| Events | `onInit`, `onBeforeRender`, `onAfterRender`, `onRowClick`, `onCellClick`, `onFocusedRowChanged`, `onSelectionChanged`, `onSortChanged`, `onFilterChanged`, `onDataError` |

## Next milestones

- Add async data loading through the existing CRUD method configuration.
- Add inline editors and validation events.
- Add column resizing/reordering and persistent layouts.
- Add grouping, summaries, and master/detail levels.
- Add keyboard navigation and accessibility coverage.
- Add export/print adapters.
