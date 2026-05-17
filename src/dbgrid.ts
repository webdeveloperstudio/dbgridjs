import $ from 'jquery';
import { methodsInterface } from './dataSource';
import { Table, tableInterface } from './table';
import {
    DBGridCellValue,
    DBGridColumn,
    DBGridFilterDescriptor,
    DBGridOptions,
    DBGridRow,
    DBGridSortDescriptor
} from './types';

export class DBGrid extends Table {

    private baseElement: JQuery<HTMLDivElement>;
    private options?: DBGridOptions;
    private selectedKeys: Set<string> = new Set<string>();
    private focusedRowKey?: string;

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
            const rows = this.getPagedRows(this.getSortedRows(this.getFilteredRows(options.data, options.filters), options.sorting));
            this.baseElement.html(this.getGridTemplate(options, rows));
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

            this.applySelection(key, options.behavior?.multiSelect === true, event.ctrlKey === true || event.metaKey === true);

            if (options.behavior?.focusedRowEnabled !== false) {
                this.focusedRowKey = key;
            }
            options.events?.onRowClick?.({ ...this.createContext(options), row, rowIndex, key });
            options.events?.onFocusedRowChanged?.({ ...this.createContext(options), row, rowIndex, key });
            options.events?.onSelectionChanged?.({
                ...this.createContext(options),
                selectedKeys: Array.from(this.selectedKeys),
                selectedRows: Array.from(this.selectedKeys).map(item => this.getRowByKey(item)).filter((item): item is DBGridRow => Boolean(item))
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
    }

    private getGridTemplate(options: DBGridOptions, rows: DBGridRow[]): string {
        const columns = this.getVisibleColumns(options);
        const gridClasses = [
            'dbgrid',
            options.className ?? '',
            options.appearance?.showGridLines === false ? 'dbgrid-no-lines' : '',
            options.appearance?.stripedRows === false ? '' : 'dbgrid-striped'
        ].filter(Boolean).join(' ');

        return `
            <div id="${this.escape(options.id ?? 'dbgrid')}" class="${this.escape(gridClasses)}" style="${this.escape(options.style ?? '')}">
                <table class="dbgrid-table" role="grid">
                    ${options.appearance?.showColumnHeaders === false ? '' : this.getHeaderTemplate(options, columns)}
                    <tbody>${this.getBodyTemplate(options, columns, rows)}</tbody>
                </table>
                ${this.getNavigatorTemplate(options)}
            </div>`;
    }

    private getHeaderTemplate(options: DBGridOptions, columns: DBGridColumn[]): string {
        const header = columns.map(column => {
            const sort = options.sorting?.find(item => item.fieldName === column.fieldName);
            const width = column.width ? `width: ${this.formatSize(column.width)};` : '';
            const minWidth = column.minWidth ? `min-width: ${this.formatSize(column.minWidth)};` : '';
            return `<th class="${this.escape(column.headerClassName ?? '')}" style="${width}${minWidth}" data-dbgrid-field="${this.escape(column.fieldName)}" scope="col">
                <span>${this.escape(column.caption ?? column.fieldName)}</span>${sort ? `<span class="dbgrid-sort">${sort.direction === 'asc' ? '▲' : '▼'}</span>` : ''}
            </th>`;
        }).join('');

        const filters = options.appearance?.showFilterRow && options.behavior?.allowFiltering !== false
            ? `<tr class="dbgrid-filter-row">${columns.map(column => `<th>${column.filterable === false ? '' : `<input type="search" data-dbgrid-filter="${this.escape(column.fieldName)}" value="${this.escape(String(this.getFilterValue(column.fieldName, options.filters) ?? ''))}" />`}</th>`).join('')}</tr>`
            : '';

        return `<thead><tr>${header}</tr>${filters}</thead>`;
    }

    private getBodyTemplate(options: DBGridOptions, columns: DBGridColumn[], rows: DBGridRow[]): string {
        if (rows.length === 0) {
            return `<tr class="dbgrid-empty"><td colspan="${columns.length}">${this.escape(options.appearance?.emptyText ?? 'No records')}</td></tr>`;
        }

        return rows.map((row, rowIndex) => {
            const key = this.getRowKey(row, rowIndex, options);
            const rowClasses = [
                this.selectedKeys.has(key) ? 'dbgrid-selected' : '',
                this.focusedRowKey === key ? 'dbgrid-focused' : ''
            ].filter(Boolean).join(' ');
            const height = options.appearance?.rowHeight ? `height: ${options.appearance.rowHeight}px;` : '';
            const cells = columns.map(column => this.getCellTemplate(row, column, rowIndex)).join('');
            return `<tr class="${rowClasses}" style="${height}" data-dbgrid-row-key="${this.escape(key)}" data-dbgrid-row-index="${rowIndex}">${cells}</tr>`;
        }).join('');
    }

    private getCellTemplate(row: DBGridRow, column: DBGridColumn, rowIndex: number): string {
        const value = row[column.fieldName];
        const rawContent = column.renderer ? column.renderer(value, row, column, rowIndex) : this.formatValue(value, column);
        const content = column.allowHtml ? rawContent : this.escape(rawContent);
        return `<td class="${this.escape(column.className ?? '')}" style="text-align: ${column.alignment ?? 'left'}" data-dbgrid-cell-field="${this.escape(column.fieldName)}">${content}</td>`;
    }

    private getNavigatorTemplate(options: DBGridOptions): string {
        if (!options.paging?.enabled || options.paging.showNavigator === false) {
            return '';
        }

        const pageIndex = options.paging.pageIndex ?? 0;
        const pageSize = options.paging.pageSize ?? 20;
        const totalRows = this.getFilteredRows(options.data, options.filters).length;
        const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
        return `<div class="dbgrid-navigator">
            <button type="button" data-dbgrid-page="prev" ${pageIndex === 0 ? 'disabled' : ''}>Previous</button>
            <span>Page ${pageIndex + 1} / ${totalPages}</span>
            <button type="button" data-dbgrid-page="next" ${pageIndex >= totalPages - 1 ? 'disabled' : ''}>Next</button>
        </div>`;
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
                focusedRowEnabled: true,
                multiSelect: false,
                ...options.behavior
            },
            paging: {
                enabled: false,
                pageIndex: 0,
                pageSize: 20,
                showNavigator: true,
                ...options.paging
            },
            sorting: options.sorting ?? [],
            filters: options.filters ?? []
        };
    }

    private getVisibleColumns(options: DBGridOptions): DBGridColumn[] {
        return options.columns.filter(column => column.visible !== false);
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

    private getNextSort(fieldName: string, sorting: DBGridSortDescriptor[] = []): DBGridSortDescriptor {
        const current = sorting.find(item => item.fieldName === fieldName);
        return { fieldName, direction: current?.direction === 'asc' ? 'desc' : 'asc' };
    }

    private getRowByKey(key: string): DBGridRow | undefined {
        return this.options?.data.find((row, index) => this.getRowKey(row, index, this.options as DBGridOptions) === key);
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
        return $('<div />').text(value).html();
    }

    private createContext(options: DBGridOptions) {
        return { grid: this, options };
    }

    private isGridOptions(value: tableInterface | DBGridOptions): value is DBGridOptions {
        return Array.isArray((value as DBGridOptions).columns) && Array.isArray((value as DBGridOptions).data);
    }
}
