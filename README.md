# dbgridjs

Data grid inspired by Delphi DBGrid/DevExpress TcxGrid for browser applications written in TypeScript.

## Current capabilities

- Data-driven columns and rows
- Column captions, widths, alignment, visibility, data types, configurable boolean labels, and custom cell renderers
- Cell values and renderer output are escaped by default; opt in with `allowHtml` only for trusted HTML
- Client-side sorting, filter row, focused row, single or multi selection, and paging navigator
- TcxGrid-style option groups for appearance, behavior, editing, paging, sorting, filtering, and events
- Backward-compatible rendering of the original table structure

## Example

```ts
import { DBGrid } from './dbgrid';
import { DBGridOptions } from './types';

const options: DBGridOptions = {
  keyField: 'id',
  columns: [
    { fieldName: 'id', caption: 'ID', dataType: 'number', alignment: 'right' },
    { fieldName: 'customer', caption: 'Customer' }
  ],
  data: [
    { id: 1, customer: 'Black Mesa' },
    { id: 2, customer: 'Aperture Labs' }
  ],
  appearance: { showFilterRow: true },
  behavior: { allowSorting: true, multiSelect: true },
  events: {
    onRowClick: event => console.log(event.key, event.row)
  }
};

new DBGrid('#grid').render(options);
```

See `docs/tcxgrid-research.md` for the TcxGrid feature inventory and implementation mapping.
