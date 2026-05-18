import $ from 'jquery';
import { methodsInterface } from './dataSource';
import { Table, tableInterface } from './table';
import {
    DBGridCellValue,
    DBGridColumn,
    DBGridFilterDescriptor,
    DBGridGroupDescriptor,
    DBGridOptions,
    DBGridRow,
    DBGridSortDescriptor
} from './types';

interface DBGridGroupBucket {
    value: DBGridCellValue;
    rows: DBGridRow[];
}

interface DBGridEditorState {
    mode: 'insert' | 'edit';
    row: DBGridRow;
    rowIndex?: number;
    errors: Record<string, string>;
}

export class DBGrid extends Table {

    private baseElement: JQuery<HTMLDivElement>;
    private options?: DBGridOptions;
    private selectedKeys: Set<string> = new Set<string>();
    private focusedRowKey?: string;
    private editorState?: DBGridEditorState;
    private readonly htmlEntities: Record<string, string> = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    };

    constructor(pEl: string, pMethods: methodsInterface[] = []) {
        super(pMethods);
        this.baseElement = $(pEl);
    }

    public setBaseUrl(pUrl: string) {
        super.setBaseUrl(pUrl);
    }

    public configure(pOptions: DBGridOptions): void {
        this.options = this.normalizeOptions(pOptions);
        this.options.events?.onInit?.(this.createContext(this.options));
    }

    public getOptions(): DBGridOptions | undefined {
        return this.options;
    }

    public setData(pData: DBGridRow[]): void {
        if (!this.options) {
            return;
        }

        this.options.data = pData;
        this.render(this.options);
    }

    public render(pTable: tableInterface | DBGridOptions) {
        if (this.isGridOptions(pTable)) {
            this.configure(pTable);
            this.renderGrid();
            return;
        }

        const vTable: string = this.assemble(pTable);
        this.baseElement.html(vTable);
    }

    private renderGrid(): void {
        if (!this.options) {
            return;
        }

        try {
            const options = this.options;
            options.events?.onBeforeRender?.(this.createContext(options));
            const filteredRows = this.getFilteredRows(options.data, options.filters);
            const sortedRows = this.getSortedRows(filteredRows, options.sorting);
            this.ensureFocusedRow(sortedRows, options);
            const pagedRows = this.getPagedRows(sortedRows);
            this.baseElement.html(this.getGridTemplate(options, pagedRows, sortedRows));
            this.bindGridEvents();
            options.events?.onAfterRender?.({ ...this.createContext(options), element: this.baseElement[0] });
        } catch (error) {
            this.options.events?.onDataError?.(error);
            throw error;
        }
    }

    private bindGridEvents(): void {
        if (!this.options) {
            return;
        }

        const options = this.options;
        this.baseElement.off('.dbgridjs');

        this.baseElement.on('click.dbgridjs', '[data-dbgrid-group-field]', (event: JQuery.TriggeredEvent) => {
            event.preventDefault();
            event.stopPropagation();
            if (options.behavior?.allowGrouping === false || options.grouping?.enabled === false) {
                return;
            }

            const fieldName = String($(event.currentTarget).attr('data-dbgrid-group-field'));
            const column = this.getVisibleColumns(options).find(item => item.fieldName === fieldName);
            if (!column || column.groupable === false) {
                return;
            }

            this.toggleGroup(fieldName);
        });

        this.baseElement.on('click.dbgridjs', '[data-dbgrid-remove-group]', (event: JQuery.TriggeredEvent) => {
            event.preventDefault();
            const fieldName = String($(event.currentTarget).attr('data-dbgrid-remove-group'));
            this.removeGroup(fieldName);
        });

        this.baseElement.on('click.dbgridjs', '[data-dbgrid-field]', (event: JQuery.TriggeredEvent) => {
            const fieldName = String($(event.currentTarget).attr('data-dbgrid-field'));
            const column = this.getVisibleColumns(options).find(item => item.fieldName === fieldName);
            if (!column || column.sortable === false || options.behavior?.allowSorting === false) {
                return;
            }

            options.sorting = [this.getNextSort(fieldName, options.sorting)];
            options.events?.onSortChanged?.({ ...this.createContext(options), sorting: options.sorting });
            this.renderGrid();
        });

        this.baseElement.on('input.dbgridjs', '[data-dbgrid-filter]', (event: JQuery.TriggeredEvent) => {
            const input = $(event.currentTarget);
            const fieldName = String(input.attr('data-dbgrid-filter'));
            const value = String(input.val() ?? '');
            options.filters = (options.filters ?? []).filter(item => item.fieldName !== fieldName);
            if (value.length > 0) {
                options.filters.push({ fieldName, operator: 'contains', value });
            }
            options.paging = { ...options.paging, pageIndex: 0 };
            options.events?.onFilterChanged?.({ ...this.createContext(options), filters: options.filters });
            this.renderGrid();
        });

        this.baseElement.on('click.dbgridjs', '[data-dbgrid-row-key]', (event: JQuery.TriggeredEvent) => {
            const rowEl = $(event.currentTarget);
            const key = String(rowEl.attr('data-dbgrid-row-key'));
            const rowIndex = Number(rowEl.attr('data-dbgrid-row-index'));
            const row = this.getRowByKey(key);
            if (!row) {
                return;
            }

            const isCtrlOrMetaPressed = Boolean(event.ctrlKey || event.metaKey);
            this.applySelection(key, options.behavior?.multiSelect === true, isCtrlOrMetaPressed);

            if (options.behavior?.focusedRowEnabled !== false) {
                this.focusedRowKey = key;
            }
            options.events?.onRowClick?.({ ...this.createContext(options), row, rowIndex, key });
            options.events?.onFocusedRowChanged?.({ ...this.createContext(options), row, rowIndex, key });
            options.events?.onSelectionChanged?.({
                ...this.createContext(options),
                selectedKeys: Array.from(this.selectedKeys),
                selectedRows: this.getSelectedRows()
            });
            this.renderGrid();
        });

        this.baseElement.on('click.dbgridjs', '[data-dbgrid-cell-field]', (event: JQuery.TriggeredEvent) => {
            const cell = $(event.currentTarget);
            const fieldName = String(cell.attr('data-dbgrid-cell-field'));
            const key = String(cell.closest('[data-dbgrid-row-key]').attr('data-dbgrid-row-key'));
            const rowIndex = Number(cell.closest('[data-dbgrid-row-key]').attr('data-dbgrid-row-index'));
            const column = this.getVisibleColumns(options).find(item => item.fieldName === fieldName);
            const row = this.getRowByKey(key);
            if (!column || !row) {
                return;
            }

            options.events?.onCellClick?.({ ...this.createContext(options), row, rowIndex, key, column, value: row[fieldName] });
        });

        this.baseElement.on('click.dbgridjs', '[data-dbgrid-page]', (event: JQuery.TriggeredEvent) => {
            const action = String($(event.currentTarget).attr('data-dbgrid-page'));
            const paging = options.paging ?? {};
            const currentPage = paging.pageIndex ?? 0;
            const pageSize = paging.pageSize ?? 20;
            const totalPages = Math.max(1, Math.ceil(this.getFilteredRows(options.data, options.filters).length / pageSize));
            const nextPage = action === 'next' ? Math.min(currentPage + 1, totalPages - 1) : Math.max(currentPage - 1, 0);
            options.paging = { ...paging, pageIndex: nextPage };
            this.renderGrid();
        });

        this.baseElement.on('click.dbgridjs', '[data-dbgrid-nav]', (event: JQuery.TriggeredEvent) => {
            const action = String($(event.currentTarget).attr('data-dbgrid-nav'));
            this.handleNavigatorAction(action);
        });

        this.baseElement.on('input.dbgridjs change.dbgridjs', '[data-dbgrid-editor-field]', (event: JQuery.TriggeredEvent) => {
            this.updateEditorValue($(event.currentTarget));
        });

        this.baseElement.on('submit.dbgridjs', '[data-dbgrid-editor-form]', (event: JQuery.SubmitEvent) => {
            event.preventDefault();
            this.saveEditor();
        });

        this.baseElement.on('click.dbgridjs', '[data-dbgrid-editor-cancel]', () => {
            this.closeEditor();
        });
    }

    private getGridTemplate(options: DBGridOptions, rows: DBGridRow[], allRows: DBGridRow[]): string {
        const columns = this.getVisibleColumns(options);
        const gridClasses = [
            'dbgrid',
            options.className ?? '',
            options.appearance?.showGridLines === false ? 'dbgrid-no-lines' : '',
            options.appearance?.stripedRows === false ? '' : 'dbgrid-striped'
        ].filter(Boolean).join(' ');

        return `
            <div id="${this.escape(options.id ?? 'dbgrid')}" class="${this.escape(gridClasses)}" style="${this.escape(options.style ?? '')}">
                ${this.getGroupPanelTemplate(options)}
                <table class="dbgrid-table" role="grid">
                    ${options.appearance?.showColumnHeaders === false ? '' : this.getHeaderTemplate(options, columns)}
                    <tbody>${this.getBodyTemplate(options, columns, rows)}</tbody>
                </table>
                ${this.getNavigatorTemplate(options, allRows)}
                ${this.getEditorTemplate(options)}
            </div>`;
    }

    private getHeaderTemplate(options: DBGridOptions, columns: DBGridColumn[]): string {
        const header = columns.map(column => {
            const sort = options.sorting?.find(item => item.fieldName === column.fieldName);
            const isGrouped = this.getGroupDescriptors(options).some(item => item.fieldName === column.fieldName);
            const width = column.width ? `width: ${this.formatSize(column.width)};` : '';
            const minWidth = column.minWidth ? `min-width: ${this.formatSize(column.minWidth)};` : '';
            return `<th class="${this.escape(column.headerClassName ?? '')}" style="${width}${minWidth}" data-dbgrid-field="${this.escape(column.fieldName)}" scope="col">
                <span>${this.escape(column.caption ?? column.fieldName)}</span>
                <span class="dbgrid-header-tools">
                    ${column.groupable === false || options.behavior?.allowGrouping === false ? '' : `<button type="button" class="dbgrid-icon-button ${isGrouped ? 'dbgrid-active' : ''}" data-dbgrid-group-field="${this.escape(column.fieldName)}" title="${isGrouped ? 'Ungroup' : 'Group'} by ${this.escape(column.caption ?? column.fieldName)}">${isGrouped ? '⊟' : '⊞'}</button>`}
                    ${sort ? `<span class="dbgrid-sort">${sort.direction === 'asc' ? '▲' : '▼'}</span>` : ''}
                </span>
            </th>`;
        }).join('');

        return `<thead><tr>${header}</tr>${this.getFilterRowTemplate(options, columns)}</thead>`;
    }

    private getFilterRowTemplate(options: DBGridOptions, columns: DBGridColumn[]): string {
        if (!options.appearance?.showFilterRow || options.behavior?.allowFiltering === false) {
            return '';
        }

        const filters = columns.map(column => {
            if (column.filterable === false) {
                return '<th></th>';
            }

            const value = String(this.getFilterValue(column.fieldName, options.filters) ?? '');
            return `<th><input type="search" data-dbgrid-filter="${this.escape(column.fieldName)}" value="${this.escape(value)}" /></th>`;
        }).join('');

        return `<tr class="dbgrid-filter-row">${filters}</tr>`;
    }

    private getBodyTemplate(options: DBGridOptions, columns: DBGridColumn[], rows: DBGridRow[]): string {
        if (rows.length === 0) {
            return `<tr class="dbgrid-empty"><td colspan="${columns.length}">${this.escape(options.appearance?.emptyText ?? 'No records')}</td></tr>`;
        }

        const groupDescriptors = this.getGroupDescriptors(options);
        if (groupDescriptors.length > 0) {
            return this.getGroupedRowsTemplate(options, columns, rows, groupDescriptors, 0);
        }

        return rows.map((row, rowIndex) => {
            const dataIndex = this.getDataRowIndex(row, options, rowIndex);
            const key = this.getRowKey(row, dataIndex, options);
            const rowClasses = [
                this.selectedKeys.has(key) ? 'dbgrid-selected' : '',
                this.focusedRowKey === key ? 'dbgrid-focused' : ''
            ].filter(Boolean).join(' ');
            const height = options.appearance?.rowHeight ? `height: ${options.appearance.rowHeight}px;` : '';
            const cells = columns.map(column => this.getCellTemplate(row, column, dataIndex)).join('');
            return `<tr class="${rowClasses}" style="${height}" data-dbgrid-row-key="${this.escape(key)}" data-dbgrid-row-index="${dataIndex}">${cells}</tr>`;
        }).join('');
    }

    private getGroupedRowsTemplate(options: DBGridOptions, columns: DBGridColumn[], rows: DBGridRow[], descriptors: DBGridGroupDescriptor[], level: number): string {
        const descriptor = descriptors[level];
        if (!descriptor) {
            return this.getBodyTemplate({ ...options, grouping: { ...options.grouping, descriptors: [] } }, columns, rows);
        }

        return this.getGroupBuckets(rows, descriptor).map(bucket => {
            const column = columns.find(item => item.fieldName === descriptor.fieldName);
            const caption = column?.caption ?? descriptor.fieldName;
            const value = this.formatGroupValue(bucket.value, column);
            const childRows = level + 1 < descriptors.length
                ? this.getGroupedRowsTemplate(options, columns, bucket.rows, descriptors, level + 1)
                : this.getBodyTemplate({ ...options, grouping: { ...options.grouping, descriptors: [] } }, columns, bucket.rows);

            return `<tr class="dbgrid-group-row" data-dbgrid-group-level="${level}">
                <td colspan="${columns.length}" style="padding-left: ${8 + level * 18}px">
                    <span class="dbgrid-group-title">${this.escape(caption)}: ${this.escape(value)}</span>
                    <span class="dbgrid-group-summary">${this.escape(this.getGroupSummary(columns, bucket.rows))}</span>
                </td>
            </tr>${childRows}`;
        }).join('');
    }

    private getCellTemplate(row: DBGridRow, column: DBGridColumn, rowIndex: number): string {
        const value = row[column.fieldName];
        const rawContent = column.renderer ? column.renderer(value, row, column, rowIndex) : this.formatValue(value, column);
        const content = column.allowHtml ? rawContent : this.escape(rawContent);
        return `<td class="${this.escape(column.className ?? '')}" style="text-align: ${column.alignment ?? 'left'}" data-dbgrid-cell-field="${this.escape(column.fieldName)}">${content}</td>`;
    }

    private getNavigatorTemplate(options: DBGridOptions, rows: DBGridRow[]): string {
        if (options.navigator?.visible === false || options.paging?.showNavigator === false) {
            return '';
        }

        const paging = options.paging ?? {};
        const pageIndex = paging.pageIndex ?? 0;
        const pageSize = paging.pageSize ?? 20;
        const totalRows = this.getFilteredRows(options.data, options.filters).length;
        const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
        const focusedIndex = this.getFocusedRowIndex(rows);
        const canMovePrevious = focusedIndex > 0;
        const canMoveNext = focusedIndex >= 0 && focusedIndex < rows.length - 1;
        const hasCurrentRow = focusedIndex >= 0;
        const canInsert = options.editing?.allowInsert === true;
        const canUpdate = options.editing?.allowUpdate === true && hasCurrentRow;
        const canDelete = options.editing?.allowDelete === true && hasCurrentRow;
        const navigation = options.navigator?.showNavigation === false ? '' : `
            <button type="button" data-dbgrid-nav="first" title="First record" ${!canMovePrevious ? 'disabled' : ''}>|&lt;</button>
            <button type="button" data-dbgrid-nav="prior" title="Prior record" ${!canMovePrevious ? 'disabled' : ''}>&lt;</button>
            <button type="button" data-dbgrid-nav="next" title="Next record" ${!canMoveNext ? 'disabled' : ''}>&gt;</button>
            <button type="button" data-dbgrid-nav="last" title="Last record" ${!canMoveNext ? 'disabled' : ''}>&gt;|</button>`;
        const editing = options.navigator?.showEditing === false ? '' : `
            <span class="dbgrid-nav-separator"></span>
            <button type="button" data-dbgrid-nav="insert" title="Create record" ${!canInsert ? 'disabled' : ''}>+</button>
            <button type="button" data-dbgrid-nav="edit" title="Edit record" ${!canUpdate ? 'disabled' : ''}>Edit</button>
            <button type="button" data-dbgrid-nav="delete" title="Delete record" ${!canDelete ? 'disabled' : ''}>Delete</button>`;
        const refresh = options.navigator?.showRefresh === false ? '' : `
            <span class="dbgrid-nav-separator"></span>
            <button type="button" data-dbgrid-nav="refresh" title="Refresh grid">Refresh</button>`;
        const recordInfo = paging.showRecordInfo === false ? '' : `<span class="dbgrid-record-info">Record ${hasCurrentRow ? focusedIndex + 1 : 0} of ${rows.length}${paging.enabled ? `, Page ${pageIndex + 1} / ${totalPages}` : ''}</span>`;

        return `<div class="dbgrid-navigator" role="toolbar" aria-label="Grid navigator">
            <div class="dbgrid-nav-buttons">${navigation}${editing}${refresh}</div>
            ${recordInfo}
        </div>`;
    }

    private getGroupPanelTemplate(options: DBGridOptions): string {
        if (options.grouping?.enabled === false || options.grouping?.showGroupPanel === false) {
            return '';
        }

        const descriptors = this.getGroupDescriptors(options);
        const chips = descriptors.map(descriptor => {
            const column = this.getVisibleColumns(options).find(item => item.fieldName === descriptor.fieldName);
            const caption = column?.caption ?? descriptor.fieldName;
            return `<span class="dbgrid-group-chip">${this.escape(caption)}<button type="button" data-dbgrid-remove-group="${this.escape(descriptor.fieldName)}" title="Remove ${this.escape(caption)} grouping">×</button></span>`;
        }).join('');

        return `<div class="dbgrid-group-panel">${chips || '<span class="dbgrid-group-placeholder">Use the plus button in a column header to group records</span>'}</div>`;
    }

    private normalizeOptions(options: DBGridOptions): DBGridOptions {
        return {
            ...options,
            appearance: {
                showColumnHeaders: true,
                showFilterRow: false,
                showGridLines: true,
                stripedRows: true,
                emptyText: 'No records',
                ...options.appearance
            },
            behavior: {
                allowSorting: true,
                allowFiltering: true,
                allowGrouping: true,
                focusedRowEnabled: true,
                multiSelect: false,
                ...options.behavior
            },
            paging: {
                enabled: false,
                pageIndex: 0,
                pageSize: 20,
                showNavigator: true,
                showRecordInfo: true,
                ...options.paging
            },
            grouping: {
                enabled: true,
                showGroupPanel: true,
                ...options.grouping,
                descriptors: options.grouping?.descriptors ?? []
            },
            navigator: {
                visible: true,
                showNavigation: true,
                showEditing: true,
                showRefresh: true,
                ...options.navigator
            },
            sorting: options.sorting ?? [],
            filters: options.filters ?? []
        };
    }

    private getVisibleColumns(options: DBGridOptions): DBGridColumn[] {
        return options.columns.filter(column => column.visible !== false);
    }

    private getGroupDescriptors(options: DBGridOptions): DBGridGroupDescriptor[] {
        if (options.grouping?.enabled === false || options.behavior?.allowGrouping === false) {
            return [];
        }

        const columns = this.getVisibleColumns(options);
        return (options.grouping?.descriptors ?? []).filter(descriptor => {
            const column = columns.find(item => item.fieldName === descriptor.fieldName);
            return Boolean(column && column.groupable !== false);
        });
    }

    private toggleGroup(fieldName: string): void {
        if (!this.options) {
            return;
        }

        const descriptors = this.getGroupDescriptors(this.options);
        const isGrouped = descriptors.some(item => item.fieldName === fieldName);
        const grouping = isGrouped
            ? descriptors.filter(item => item.fieldName !== fieldName)
            : [...descriptors, { fieldName, direction: 'asc' as const }];

        this.options.grouping = { ...this.options.grouping, descriptors: grouping };
        this.options.paging = { ...this.options.paging, pageIndex: 0 };
        this.options.events?.onGroupChanged?.({ ...this.createContext(this.options), grouping });
        this.renderGrid();
    }

    private removeGroup(fieldName: string): void {
        if (!this.options) {
            return;
        }

        const grouping = this.getGroupDescriptors(this.options).filter(item => item.fieldName !== fieldName);
        this.options.grouping = { ...this.options.grouping, descriptors: grouping };
        this.options.paging = { ...this.options.paging, pageIndex: 0 };
        this.options.events?.onGroupChanged?.({ ...this.createContext(this.options), grouping });
        this.renderGrid();
    }

    private getGroupBuckets(rows: DBGridRow[], descriptor: DBGridGroupDescriptor): DBGridGroupBucket[] {
        const buckets = new Map<string, DBGridGroupBucket>();
        rows.forEach(row => {
            const value = row[descriptor.fieldName];
            const key = String(value ?? '');
            const bucket = buckets.get(key) ?? { value, rows: [] };
            bucket.rows.push(row);
            buckets.set(key, bucket);
        });

        return Array.from(buckets.values()).sort((left, right) => {
            const result = this.compareValues(left.value, right.value);
            return descriptor.direction === 'desc' ? -result : result;
        });
    }

    private getGroupSummary(columns: DBGridColumn[], rows: DBGridRow[]): string {
        const recordText = `${rows.length} ${rows.length === 1 ? 'record' : 'records'}`;
        const summaryText = columns
            .filter(column => Boolean(column.summary))
            .map(column => `${column.caption ?? column.fieldName}: ${this.getSummaryValue(column, rows)}`)
            .filter(Boolean)
            .join(', ');

        return summaryText ? `${recordText}, ${summaryText}` : recordText;
    }

    private getSummaryValue(column: DBGridColumn, rows: DBGridRow[]): string {
        const values = rows.map(row => row[column.fieldName]).filter(value => value !== null && value !== undefined);
        if (column.summary === 'count') {
            return String(values.length);
        }

        const numbers = values.map(value => Number(value)).filter(value => !Number.isNaN(value));
        if (numbers.length === 0) {
            return '';
        }

        switch (column.summary) {
            case 'avg': return String(numbers.reduce((total, value) => total + value, 0) / numbers.length);
            case 'min': return String(Math.min(...numbers));
            case 'max': return String(Math.max(...numbers));
            case 'sum':
            default: return String(numbers.reduce((total, value) => total + value, 0));
        }
    }

    private formatGroupValue(value: DBGridCellValue, column?: DBGridColumn): string {
        if (!column) {
            return String(value ?? '(blank)');
        }

        return this.formatValue(value, column) || '(blank)';
    }

    private getFilteredRows(rows: DBGridRow[], filters: DBGridFilterDescriptor[] = []): DBGridRow[] {
        if (filters.length === 0) {
            return rows;
        }

        return rows.filter(row => filters.every(filter => this.matchesFilter(row[filter.fieldName], filter)));
    }

    private matchesFilter(value: DBGridCellValue, filter: DBGridFilterDescriptor): boolean {
        const source = String(value ?? '').toLowerCase();
        const target = String(filter.value ?? '').toLowerCase();
        switch (filter.operator ?? 'contains') {
            case 'equals': return source === target;
            case 'startsWith': return source.startsWith(target);
            case 'endsWith': return source.endsWith(target);
            case 'gt': return Number(value) > Number(filter.value);
            case 'gte': return Number(value) >= Number(filter.value);
            case 'lt': return Number(value) < Number(filter.value);
            case 'lte': return Number(value) <= Number(filter.value);
            case 'contains':
            default: return source.includes(target);
        }
    }

    private getSortedRows(rows: DBGridRow[], sorting: DBGridSortDescriptor[] = []): DBGridRow[] {
        if (sorting.length === 0) {
            return rows;
        }

        return [...rows].sort((left, right) => {
            for (const sort of sorting) {
                const result = this.compareValues(left[sort.fieldName], right[sort.fieldName]);
                if (result !== 0) {
                    return sort.direction === 'asc' ? result : -result;
                }
            }
            return 0;
        });
    }

    private getPagedRows(rows: DBGridRow[]): DBGridRow[] {
        const paging = this.options?.paging;
        if (!paging?.enabled) {
            return rows;
        }

        const pageIndex = paging.pageIndex ?? 0;
        const pageSize = paging.pageSize ?? 20;
        return rows.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize);
    }

    private getCurrentRows(options: DBGridOptions): DBGridRow[] {
        return this.getSortedRows(this.getFilteredRows(options.data, options.filters), options.sorting);
    }

    private ensureFocusedRow(rows: DBGridRow[], options: DBGridOptions): void {
        if (rows.length === 0) {
            this.focusedRowKey = undefined;
            this.selectedKeys.clear();
            return;
        }

        const hasFocusedRow = Boolean(this.focusedRowKey && rows.some((row, index) => {
            const dataIndex = this.getDataRowIndex(row, options, index);
            return this.getRowKey(row, dataIndex, options) === this.focusedRowKey;
        }));

        if (!hasFocusedRow) {
            const firstRow = rows[0];
            const firstIndex = this.getDataRowIndex(firstRow, options, 0);
            this.focusedRowKey = this.getRowKey(firstRow, firstIndex, options);
        }
    }

    private handleNavigatorAction(action: string): void {
        switch (action) {
            case 'first':
            case 'prior':
            case 'next':
            case 'last':
                this.moveFocusedRecord(action);
                return;
            case 'insert':
                this.insertRecord();
                return;
            case 'edit':
                this.editRecord();
                return;
            case 'delete':
                this.deleteRecord();
                return;
            case 'refresh':
                if (this.options) {
                    this.options.events?.onRefresh?.(this.createContext(this.options));
                    this.renderGrid();
                }
                return;
        }
    }

    private moveFocusedRecord(action: string): void {
        if (!this.options) {
            return;
        }

        const rows = this.getCurrentRows(this.options);
        if (rows.length === 0) {
            return;
        }

        const currentIndex = Math.max(0, this.getFocusedRowIndex(rows));
        const nextIndex = action === 'first'
            ? 0
            : action === 'prior'
                ? Math.max(currentIndex - 1, 0)
                : action === 'next'
                    ? Math.min(currentIndex + 1, rows.length - 1)
                    : rows.length - 1;

        this.focusRecord(rows, nextIndex);
    }

    private focusRecord(rows: DBGridRow[], rowIndex: number): void {
        if (!this.options) {
            return;
        }

        const row = rows[rowIndex];
        if (!row) {
            return;
        }

        const dataIndex = this.getDataRowIndex(row, this.options, rowIndex);
        const key = this.getRowKey(row, dataIndex, this.options);
        this.focusedRowKey = key;
        this.selectedKeys = new Set<string>([key]);

        if (this.options.paging?.enabled) {
            const pageSize = this.options.paging.pageSize ?? 20;
            this.options.paging = { ...this.options.paging, pageIndex: Math.floor(rowIndex / pageSize) };
        }

        this.options.events?.onFocusedRowChanged?.({ ...this.createContext(this.options), row, rowIndex: dataIndex, key });
        this.options.events?.onSelectionChanged?.({
            ...this.createContext(this.options),
            selectedKeys: Array.from(this.selectedKeys),
            selectedRows: this.getSelectedRows()
        });
        this.renderGrid();
    }

    private insertRecord(): void {
        if (!this.options || this.options.editing?.allowInsert !== true) {
            return;
        }

        const row = this.promptForRow();
        if (!row) {
            return;
        }

        this.options.data.push(row);
        const rowIndex = this.options.data.length - 1;
        const key = this.getRowKey(row, rowIndex, this.options);
        this.focusedRowKey = key;
        this.selectedKeys = new Set<string>([key]);
        this.options.events?.onRowInserted?.({ ...this.createContext(this.options), row, rowIndex, key });
        this.renderGrid();
    }

    private editRecord(): void {
        if (!this.options || this.options.editing?.allowUpdate !== true || !this.focusedRowKey) {
            return;
        }

        const row = this.getRowByKey(this.focusedRowKey);
        if (!row) {
            return;
        }

        const rowIndex = this.getDataRowIndex(row, this.options, 0);
        const updatedRow = this.promptForRow(row);
        if (!updatedRow) {
            return;
        }

        this.options.data[rowIndex] = updatedRow;
        const key = this.getRowKey(updatedRow, rowIndex, this.options);
        this.focusedRowKey = key;
        this.selectedKeys = new Set<string>([key]);
        this.options.events?.onRowUpdated?.({ ...this.createContext(this.options), row: updatedRow, rowIndex, key });
        this.renderGrid();
    }

    private deleteRecord(): void {
        if (!this.options || this.options.editing?.allowDelete !== true || !this.focusedRowKey) {
            return;
        }

        const row = this.getRowByKey(this.focusedRowKey);
        if (!row) {
            return;
        }

        const rowIndex = this.getDataRowIndex(row, this.options, 0);
        const caption = this.options.keyField ? String(row[this.options.keyField] ?? '') : String(rowIndex + 1);
        if (!window.confirm(`Delete record ${caption}?`)) {
            return;
        }

        const deletedRows = this.options.data.splice(rowIndex, 1);
        const deletedRow = deletedRows[0];
        const key = this.focusedRowKey;
        this.focusedRowKey = undefined;
        this.selectedKeys.delete(key);
        this.options.events?.onRowDeleted?.({ ...this.createContext(this.options), row: deletedRow, rowIndex, key });
        this.renderGrid();
    }

    private promptForRow(source?: DBGridRow): DBGridRow | undefined {
        if (!this.options) {
            return undefined;
        }

        const row: DBGridRow = { ...(source ?? {}) };
        for (const column of this.getVisibleColumns(this.options)) {
            if (column.readOnly) {
                continue;
            }

            const currentValue = row[column.fieldName];
            const input = window.prompt(column.caption ?? column.fieldName, String(currentValue ?? ''));
            if (input === null) {
                return undefined;
            }

            row[column.fieldName] = this.parseInputValue(input, column, currentValue);
        }

        return row;
    }

    private parseInputValue(value: string, column: DBGridColumn, currentValue: DBGridCellValue): DBGridCellValue {
        if (column.dataType === 'number') {
            const numberValue = Number(value);
            return Number.isNaN(numberValue) ? currentValue : numberValue;
        }
        if (column.dataType === 'boolean') {
            return ['true', 'yes', '1', column.trueText?.toLowerCase()].includes(value.toLowerCase());
        }
        if (column.dataType === 'date') {
            const dateValue = new Date(value);
            return Number.isNaN(dateValue.getTime()) ? currentValue : dateValue;
        }
        return value;
    }

    private getFocusedRowIndex(rows: DBGridRow[]): number {
        if (!this.options || !this.focusedRowKey) {
            return rows.length > 0 ? 0 : -1;
        }

        return rows.findIndex((row, index) => {
            const dataIndex = this.getDataRowIndex(row, this.options as DBGridOptions, index);
            return this.getRowKey(row, dataIndex, this.options as DBGridOptions) === this.focusedRowKey;
        });
    }

    private getNextSort(fieldName: string, sorting: DBGridSortDescriptor[] = []): DBGridSortDescriptor {
        const current = sorting.find(item => item.fieldName === fieldName);
        return { fieldName, direction: current?.direction === 'asc' ? 'desc' : 'asc' };
    }

    private getRowByKey(key: string): DBGridRow | undefined {
        const options = this.options;
        if (!options) {
            return undefined;
        }

        return options.data.find((row, index) => this.getRowKey(row, index, options) === key);
    }

    private getSelectedRows(): DBGridRow[] {
        return Array.from(this.selectedKeys)
            .map(item => this.getRowByKey(item))
            .filter((item): item is DBGridRow => Boolean(item));
    }

    private getDataRowIndex(row: DBGridRow, options: DBGridOptions, fallbackIndex: number): number {
        const index = options.data.indexOf(row);
        return index >= 0 ? index : fallbackIndex;
    }

    private getRowKey(row: DBGridRow, index: number, options: DBGridOptions): string {
        const keyField = options.keyField;
        if (keyField && row[keyField] !== undefined && row[keyField] !== null) {
            return String(row[keyField]);
        }
        return String(index);
    }

    private getFilterValue(fieldName: string, filters: DBGridFilterDescriptor[] = []): DBGridCellValue {
        return filters.find(item => item.fieldName === fieldName)?.value;
    }

    private compareValues(left: DBGridCellValue, right: DBGridCellValue): number {
        if (left === right) {
            return 0;
        }
        if (left === null || left === undefined) {
            return -1;
        }
        if (right === null || right === undefined) {
            return 1;
        }
        if (typeof left === 'number' && typeof right === 'number') {
            return left - right;
        }
        return String(left).localeCompare(String(right));
    }

    private formatValue(value: DBGridCellValue, column: DBGridColumn): string {
        if (value instanceof Date) {
            return value.toLocaleDateString();
        }
        if (column.dataType === 'boolean' && typeof value === 'boolean') {
            return value ? (column.trueText ?? 'Yes') : (column.falseText ?? 'No');
        }
        return String(value ?? '');
    }

    private applySelection(key: string, isMultiSelect: boolean, isToggleClick: boolean): void {
        if (!isMultiSelect) {
            this.selectedKeys = new Set<string>([key]);
            return;
        }

        if (isToggleClick && this.selectedKeys.has(key)) {
            this.selectedKeys.delete(key);
            return;
        }

        if (!isToggleClick) {
            this.selectedKeys.clear();
        }
        this.selectedKeys.add(key);
    }

    private formatSize(value: number | string): string {
        return typeof value === 'number' ? `${value}px` : value;
    }

    private escape(value: string): string {
        return value.replace(/[&<>"']/g, character => this.htmlEntities[character] ?? character);
    }

    private createContext(options: DBGridOptions) {
        return { grid: this, options };
    }

    private isGridOptions(value: tableInterface | DBGridOptions): value is DBGridOptions {
        return Array.isArray((value as DBGridOptions).columns) && Array.isArray((value as DBGridOptions).data);
    }
}
