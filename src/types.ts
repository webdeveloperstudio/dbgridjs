export type DBGridCellValue = string | number | boolean | Date | null | undefined;
export type DBGridRow = Record<string, DBGridCellValue>;
export type DBGridAlignment = 'left' | 'center' | 'right';
export type DBGridSortDirection = 'asc' | 'desc';
export type DBGridFilterOperator = 'contains' | 'equals' | 'startsWith' | 'endsWith' | 'gt' | 'gte' | 'lt' | 'lte';
export type DBGridSummaryType = 'count' | 'sum' | 'avg' | 'min' | 'max';

export interface DBGridColumn {
    fieldName: string;
    caption?: string;
    visible?: boolean;
    width?: number | string;
    minWidth?: number | string;
    alignment?: DBGridAlignment;
    dataType?: 'string' | 'number' | 'date' | 'boolean' | 'custom';
    trueText?: string;
    falseText?: string;
    required?: boolean;
    readOnly?: boolean;
    sortable?: boolean;
    filterable?: boolean;
    groupable?: boolean;
    fixed?: boolean;
    summary?: DBGridSummaryType;
    allowHtml?: boolean;
    className?: string;
    headerClassName?: string;
    renderer?: (value: DBGridCellValue, row: DBGridRow, column: DBGridColumn, rowIndex: number) => string;
}

export interface DBGridAppearanceOptions {
    showColumnHeaders?: boolean;
    showFilterRow?: boolean;
    showGridLines?: boolean;
    stripedRows?: boolean;
    rowHeight?: number;
    emptyText?: string;
}

export interface DBGridBehaviorOptions {
    allowSorting?: boolean;
    allowFiltering?: boolean;
    allowGrouping?: boolean;
    allowColumnResize?: boolean;
    focusedRowEnabled?: boolean;
    multiSelect?: boolean;
}

export interface DBGridPagingOptions {
    enabled?: boolean;
    pageIndex?: number;
    pageSize?: number;
    showNavigator?: boolean;
    showRecordInfo?: boolean;
}

export interface DBGridGroupingOptions {
    enabled?: boolean;
    showGroupPanel?: boolean;
    descriptors?: DBGridGroupDescriptor[];
}

export interface DBGridNavigatorOptions {
    visible?: boolean;
    showNavigation?: boolean;
    showEditing?: boolean;
    showRefresh?: boolean;
}

export interface DBGridSortDescriptor {
    fieldName: string;
    direction: DBGridSortDirection;
}

export interface DBGridFilterDescriptor {
    fieldName: string;
    operator?: DBGridFilterOperator;
    value: DBGridCellValue;
}

export interface DBGridGroupDescriptor {
    fieldName: string;
    direction?: DBGridSortDirection;
}

export interface DBGridEditingOptions {
    allowInsert?: boolean;
    allowUpdate?: boolean;
    allowDelete?: boolean;
    mode?: 'inline' | 'popup' | 'readonly';
}

export interface DBGridEventContext {
    grid: unknown;
    options: DBGridOptions;
}

export interface DBGridRowEvent extends DBGridEventContext {
    row: DBGridRow;
    rowIndex: number;
    key: string;
}

export interface DBGridCellEvent extends DBGridRowEvent {
    column: DBGridColumn;
    value: DBGridCellValue;
}

export interface DBGridSelectionEvent extends DBGridEventContext {
    selectedKeys: string[];
    selectedRows: DBGridRow[];
}

export interface DBGridSortEvent extends DBGridEventContext {
    sorting: DBGridSortDescriptor[];
}

export interface DBGridFilterEvent extends DBGridEventContext {
    filters: DBGridFilterDescriptor[];
}

export interface DBGridGroupEvent extends DBGridEventContext {
    grouping: DBGridGroupDescriptor[];
}

export interface DBGridDataChangeEvent extends DBGridEventContext {
    row: DBGridRow;
    rowIndex: number;
    key: string;
}

export interface DBGridEvents {
    onInit?: (event: DBGridEventContext) => void;
    onBeforeRender?: (event: DBGridEventContext) => void;
    onAfterRender?: (event: DBGridEventContext & { element: HTMLElement }) => void;
    onRowClick?: (event: DBGridRowEvent) => void;
    onCellClick?: (event: DBGridCellEvent) => void;
    onFocusedRowChanged?: (event: DBGridRowEvent) => void;
    onSelectionChanged?: (event: DBGridSelectionEvent) => void;
    onSortChanged?: (event: DBGridSortEvent) => void;
    onFilterChanged?: (event: DBGridFilterEvent) => void;
    onGroupChanged?: (event: DBGridGroupEvent) => void;
    onRowInserted?: (event: DBGridDataChangeEvent) => void;
    onRowUpdated?: (event: DBGridDataChangeEvent) => void;
    onRowDeleted?: (event: DBGridDataChangeEvent) => void;
    onRefresh?: (event: DBGridEventContext) => void;
    onDataError?: (error: unknown) => void;
}

export interface DBGridOptions {
    id?: string;
    className?: string;
    style?: string;
    keyField?: string;
    columns: DBGridColumn[];
    data: DBGridRow[];
    appearance?: DBGridAppearanceOptions;
    behavior?: DBGridBehaviorOptions;
    paging?: DBGridPagingOptions;
    grouping?: DBGridGroupingOptions;
    navigator?: DBGridNavigatorOptions;
    sorting?: DBGridSortDescriptor[];
    filters?: DBGridFilterDescriptor[];
    editing?: DBGridEditingOptions;
    events?: DBGridEvents;
}
