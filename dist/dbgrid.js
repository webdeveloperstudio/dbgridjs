import $ from 'jquery';
import { Table } from './table';
export class DBGrid extends Table {
    constructor(pEl, pMethods = []) {
        super(pMethods);
        this.selectedKeys = new Set();
        this.htmlEntities = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        };
        this.baseElement = $(pEl);
    }
    setBaseUrl(pUrl) {
        super.setBaseUrl(pUrl);
    }
    configure(pOptions) {
        var _a, _b;
        this.options = this.normalizeOptions(pOptions);
        (_b = (_a = this.options.events) === null || _a === void 0 ? void 0 : _a.onInit) === null || _b === void 0 ? void 0 : _b.call(_a, this.createContext(this.options));
    }
    getOptions() {
        return this.options;
    }
    setData(pData) {
        if (!this.options) {
            return;
        }
        this.options.data = pData;
        this.render(this.options);
    }
    render(pTable) {
        if (this.isGridOptions(pTable)) {
            this.configure(pTable);
            this.renderGrid();
            return;
        }
        const vTable = this.assemble(pTable);
        this.baseElement.html(vTable);
    }
    renderGrid() {
        var _a, _b, _c, _d, _e, _f;
        if (!this.options) {
            return;
        }
        try {
            const options = this.options;
            (_b = (_a = options.events) === null || _a === void 0 ? void 0 : _a.onBeforeRender) === null || _b === void 0 ? void 0 : _b.call(_a, this.createContext(options));
            const filteredRows = this.getFilteredRows(options.data, options.filters);
            const sortedRows = this.getSortedRows(filteredRows, options.sorting);
            const pagedRows = this.getPagedRows(sortedRows);
            this.baseElement.html(this.getGridTemplate(options, pagedRows));
            this.bindGridEvents();
            (_d = (_c = options.events) === null || _c === void 0 ? void 0 : _c.onAfterRender) === null || _d === void 0 ? void 0 : _d.call(_c, Object.assign(Object.assign({}, this.createContext(options)), { element: this.baseElement[0] }));
        }
        catch (error) {
            (_f = (_e = this.options.events) === null || _e === void 0 ? void 0 : _e.onDataError) === null || _f === void 0 ? void 0 : _f.call(_e, error);
            throw error;
        }
    }
    bindGridEvents() {
        if (!this.options) {
            return;
        }
        const options = this.options;
        this.baseElement.off('.dbgridjs');
        this.baseElement.on('click.dbgridjs', '[data-dbgrid-field]', (event) => {
            var _a, _b, _c;
            const fieldName = String($(event.currentTarget).attr('data-dbgrid-field'));
            const column = this.getVisibleColumns(options).find(item => item.fieldName === fieldName);
            if (!column || column.sortable === false || ((_a = options.behavior) === null || _a === void 0 ? void 0 : _a.allowSorting) === false) {
                return;
            }
            options.sorting = [this.getNextSort(fieldName, options.sorting)];
            (_c = (_b = options.events) === null || _b === void 0 ? void 0 : _b.onSortChanged) === null || _c === void 0 ? void 0 : _c.call(_b, Object.assign(Object.assign({}, this.createContext(options)), { sorting: options.sorting }));
            this.renderGrid();
        });
        this.baseElement.on('input.dbgridjs', '[data-dbgrid-filter]', (event) => {
            var _a, _b, _c, _d;
            const input = $(event.currentTarget);
            const fieldName = String(input.attr('data-dbgrid-filter'));
            const value = String((_a = input.val()) !== null && _a !== void 0 ? _a : '');
            options.filters = ((_b = options.filters) !== null && _b !== void 0 ? _b : []).filter(item => item.fieldName !== fieldName);
            if (value.length > 0) {
                options.filters.push({ fieldName, operator: 'contains', value });
            }
            options.paging = Object.assign(Object.assign({}, options.paging), { pageIndex: 0 });
            (_d = (_c = options.events) === null || _c === void 0 ? void 0 : _c.onFilterChanged) === null || _d === void 0 ? void 0 : _d.call(_c, Object.assign(Object.assign({}, this.createContext(options)), { filters: options.filters }));
            this.renderGrid();
        });
        this.baseElement.on('click.dbgridjs', '[data-dbgrid-row-key]', (event) => {
            var _a, _b, _c, _d, _e, _f, _g, _h;
            const rowEl = $(event.currentTarget);
            const key = String(rowEl.attr('data-dbgrid-row-key'));
            const rowIndex = Number(rowEl.attr('data-dbgrid-row-index'));
            const row = this.getRowByKey(key);
            if (!row) {
                return;
            }
            const isCtrlOrMetaPressed = Boolean(event.ctrlKey || event.metaKey);
            this.applySelection(key, ((_a = options.behavior) === null || _a === void 0 ? void 0 : _a.multiSelect) === true, isCtrlOrMetaPressed);
            if (((_b = options.behavior) === null || _b === void 0 ? void 0 : _b.focusedRowEnabled) !== false) {
                this.focusedRowKey = key;
            }
            (_d = (_c = options.events) === null || _c === void 0 ? void 0 : _c.onRowClick) === null || _d === void 0 ? void 0 : _d.call(_c, Object.assign(Object.assign({}, this.createContext(options)), { row, rowIndex, key }));
            (_f = (_e = options.events) === null || _e === void 0 ? void 0 : _e.onFocusedRowChanged) === null || _f === void 0 ? void 0 : _f.call(_e, Object.assign(Object.assign({}, this.createContext(options)), { row, rowIndex, key }));
            (_h = (_g = options.events) === null || _g === void 0 ? void 0 : _g.onSelectionChanged) === null || _h === void 0 ? void 0 : _h.call(_g, Object.assign(Object.assign({}, this.createContext(options)), { selectedKeys: Array.from(this.selectedKeys), selectedRows: this.getSelectedRows() }));
            this.renderGrid();
        });
        this.baseElement.on('click.dbgridjs', '[data-dbgrid-cell-field]', (event) => {
            var _a, _b;
            const cell = $(event.currentTarget);
            const fieldName = String(cell.attr('data-dbgrid-cell-field'));
            const key = String(cell.closest('[data-dbgrid-row-key]').attr('data-dbgrid-row-key'));
            const rowIndex = Number(cell.closest('[data-dbgrid-row-key]').attr('data-dbgrid-row-index'));
            const column = this.getVisibleColumns(options).find(item => item.fieldName === fieldName);
            const row = this.getRowByKey(key);
            if (!column || !row) {
                return;
            }
            (_b = (_a = options.events) === null || _a === void 0 ? void 0 : _a.onCellClick) === null || _b === void 0 ? void 0 : _b.call(_a, Object.assign(Object.assign({}, this.createContext(options)), { row, rowIndex, key, column, value: row[fieldName] }));
        });
        this.baseElement.on('click.dbgridjs', '[data-dbgrid-page]', (event) => {
            var _a, _b, _c;
            const action = String($(event.currentTarget).attr('data-dbgrid-page'));
            const paging = (_a = options.paging) !== null && _a !== void 0 ? _a : {};
            const currentPage = (_b = paging.pageIndex) !== null && _b !== void 0 ? _b : 0;
            const pageSize = (_c = paging.pageSize) !== null && _c !== void 0 ? _c : 20;
            const totalPages = Math.max(1, Math.ceil(this.getFilteredRows(options.data, options.filters).length / pageSize));
            const nextPage = action === 'next' ? Math.min(currentPage + 1, totalPages - 1) : Math.max(currentPage - 1, 0);
            options.paging = Object.assign(Object.assign({}, paging), { pageIndex: nextPage });
            this.renderGrid();
        });
    }
    getGridTemplate(options, rows) {
        var _a, _b, _c, _d, _e, _f;
        const columns = this.getVisibleColumns(options);
        const gridClasses = [
            'dbgrid',
            (_a = options.className) !== null && _a !== void 0 ? _a : '',
            ((_b = options.appearance) === null || _b === void 0 ? void 0 : _b.showGridLines) === false ? 'dbgrid-no-lines' : '',
            ((_c = options.appearance) === null || _c === void 0 ? void 0 : _c.stripedRows) === false ? '' : 'dbgrid-striped'
        ].filter(Boolean).join(' ');
        return `
            <div id="${this.escape((_d = options.id) !== null && _d !== void 0 ? _d : 'dbgrid')}" class="${this.escape(gridClasses)}" style="${this.escape((_e = options.style) !== null && _e !== void 0 ? _e : '')}">
                <table class="dbgrid-table" role="grid">
                    ${((_f = options.appearance) === null || _f === void 0 ? void 0 : _f.showColumnHeaders) === false ? '' : this.getHeaderTemplate(options, columns)}
                    <tbody>${this.getBodyTemplate(options, columns, rows)}</tbody>
                </table>
                ${this.getNavigatorTemplate(options)}
            </div>`;
    }
    getHeaderTemplate(options, columns) {
        const header = columns.map(column => {
            var _a, _b, _c;
            const sort = (_a = options.sorting) === null || _a === void 0 ? void 0 : _a.find(item => item.fieldName === column.fieldName);
            const width = column.width ? `width: ${this.formatSize(column.width)};` : '';
            const minWidth = column.minWidth ? `min-width: ${this.formatSize(column.minWidth)};` : '';
            return `<th class="${this.escape((_b = column.headerClassName) !== null && _b !== void 0 ? _b : '')}" style="${width}${minWidth}" data-dbgrid-field="${this.escape(column.fieldName)}" scope="col">
                <span>${this.escape((_c = column.caption) !== null && _c !== void 0 ? _c : column.fieldName)}</span>${sort ? `<span class="dbgrid-sort">${sort.direction === 'asc' ? '▲' : '▼'}</span>` : ''}
            </th>`;
        }).join('');
        return `<thead><tr>${header}</tr>${this.getFilterRowTemplate(options, columns)}</thead>`;
    }
    getFilterRowTemplate(options, columns) {
        var _a, _b;
        if (!((_a = options.appearance) === null || _a === void 0 ? void 0 : _a.showFilterRow) || ((_b = options.behavior) === null || _b === void 0 ? void 0 : _b.allowFiltering) === false) {
            return '';
        }
        const filters = columns.map(column => {
            var _a;
            if (column.filterable === false) {
                return '<th></th>';
            }
            const value = String((_a = this.getFilterValue(column.fieldName, options.filters)) !== null && _a !== void 0 ? _a : '');
            return `<th><input type="search" data-dbgrid-filter="${this.escape(column.fieldName)}" value="${this.escape(value)}" /></th>`;
        }).join('');
        return `<tr class="dbgrid-filter-row">${filters}</tr>`;
    }
    getBodyTemplate(options, columns, rows) {
        var _a, _b;
        if (rows.length === 0) {
            return `<tr class="dbgrid-empty"><td colspan="${columns.length}">${this.escape((_b = (_a = options.appearance) === null || _a === void 0 ? void 0 : _a.emptyText) !== null && _b !== void 0 ? _b : 'No records')}</td></tr>`;
        }
        return rows.map((row, rowIndex) => {
            var _a;
            const key = this.getRowKey(row, rowIndex, options);
            const rowClasses = [
                this.selectedKeys.has(key) ? 'dbgrid-selected' : '',
                this.focusedRowKey === key ? 'dbgrid-focused' : ''
            ].filter(Boolean).join(' ');
            const height = ((_a = options.appearance) === null || _a === void 0 ? void 0 : _a.rowHeight) ? `height: ${options.appearance.rowHeight}px;` : '';
            const cells = columns.map(column => this.getCellTemplate(row, column, rowIndex)).join('');
            return `<tr class="${rowClasses}" style="${height}" data-dbgrid-row-key="${this.escape(key)}" data-dbgrid-row-index="${rowIndex}">${cells}</tr>`;
        }).join('');
    }
    getCellTemplate(row, column, rowIndex) {
        var _a, _b;
        const value = row[column.fieldName];
        const rawContent = column.renderer ? column.renderer(value, row, column, rowIndex) : this.formatValue(value, column);
        const content = column.allowHtml ? rawContent : this.escape(rawContent);
        return `<td class="${this.escape((_a = column.className) !== null && _a !== void 0 ? _a : '')}" style="text-align: ${(_b = column.alignment) !== null && _b !== void 0 ? _b : 'left'}" data-dbgrid-cell-field="${this.escape(column.fieldName)}">${content}</td>`;
    }
    getNavigatorTemplate(options) {
        var _a, _b, _c;
        if (!((_a = options.paging) === null || _a === void 0 ? void 0 : _a.enabled) || options.paging.showNavigator === false) {
            return '';
        }
        const pageIndex = (_b = options.paging.pageIndex) !== null && _b !== void 0 ? _b : 0;
        const pageSize = (_c = options.paging.pageSize) !== null && _c !== void 0 ? _c : 20;
        const totalRows = this.getFilteredRows(options.data, options.filters).length;
        const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
        return `<div class="dbgrid-navigator">
            <button type="button" data-dbgrid-page="prev" ${pageIndex === 0 ? 'disabled' : ''}>Previous</button>
            <span>Page ${pageIndex + 1} / ${totalPages}</span>
            <button type="button" data-dbgrid-page="next" ${pageIndex >= totalPages - 1 ? 'disabled' : ''}>Next</button>
        </div>`;
    }
    normalizeOptions(options) {
        var _a, _b;
        return Object.assign(Object.assign({}, options), { appearance: Object.assign({ showColumnHeaders: true, showFilterRow: false, showGridLines: true, stripedRows: true, emptyText: 'No records' }, options.appearance), behavior: Object.assign({ allowSorting: true, allowFiltering: true, focusedRowEnabled: true, multiSelect: false }, options.behavior), paging: Object.assign({ enabled: false, pageIndex: 0, pageSize: 20, showNavigator: true }, options.paging), sorting: (_a = options.sorting) !== null && _a !== void 0 ? _a : [], filters: (_b = options.filters) !== null && _b !== void 0 ? _b : [] });
    }
    getVisibleColumns(options) {
        return options.columns.filter(column => column.visible !== false);
    }
    getFilteredRows(rows, filters = []) {
        if (filters.length === 0) {
            return rows;
        }
        return rows.filter(row => filters.every(filter => this.matchesFilter(row[filter.fieldName], filter)));
    }
    matchesFilter(value, filter) {
        var _a, _b;
        const source = String(value !== null && value !== void 0 ? value : '').toLowerCase();
        const target = String((_a = filter.value) !== null && _a !== void 0 ? _a : '').toLowerCase();
        switch ((_b = filter.operator) !== null && _b !== void 0 ? _b : 'contains') {
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
    getSortedRows(rows, sorting = []) {
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
    getPagedRows(rows) {
        var _a, _b, _c;
        const paging = (_a = this.options) === null || _a === void 0 ? void 0 : _a.paging;
        if (!(paging === null || paging === void 0 ? void 0 : paging.enabled)) {
            return rows;
        }
        const pageIndex = (_b = paging.pageIndex) !== null && _b !== void 0 ? _b : 0;
        const pageSize = (_c = paging.pageSize) !== null && _c !== void 0 ? _c : 20;
        return rows.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize);
    }
    getNextSort(fieldName, sorting = []) {
        const current = sorting.find(item => item.fieldName === fieldName);
        return { fieldName, direction: (current === null || current === void 0 ? void 0 : current.direction) === 'asc' ? 'desc' : 'asc' };
    }
    getRowByKey(key) {
        const options = this.options;
        if (!options) {
            return undefined;
        }
        return options.data.find((row, index) => this.getRowKey(row, index, options) === key);
    }
    getSelectedRows() {
        return Array.from(this.selectedKeys)
            .map(item => this.getRowByKey(item))
            .filter((item) => Boolean(item));
    }
    getRowKey(row, index, options) {
        const keyField = options.keyField;
        if (keyField && row[keyField] !== undefined && row[keyField] !== null) {
            return String(row[keyField]);
        }
        return String(index);
    }
    getFilterValue(fieldName, filters = []) {
        var _a;
        return (_a = filters.find(item => item.fieldName === fieldName)) === null || _a === void 0 ? void 0 : _a.value;
    }
    compareValues(left, right) {
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
    formatValue(value, column) {
        var _a, _b;
        if (value instanceof Date) {
            return value.toLocaleDateString();
        }
        if (column.dataType === 'boolean' && typeof value === 'boolean') {
            return value ? ((_a = column.trueText) !== null && _a !== void 0 ? _a : 'Yes') : ((_b = column.falseText) !== null && _b !== void 0 ? _b : 'No');
        }
        return String(value !== null && value !== void 0 ? value : '');
    }
    applySelection(key, isMultiSelect, isToggleClick) {
        if (!isMultiSelect) {
            this.selectedKeys = new Set([key]);
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
    formatSize(value) {
        return typeof value === 'number' ? `${value}px` : value;
    }
    escape(value) {
        return value.replace(/[&<>"']/g, character => { var _a; return (_a = this.htmlEntities[character]) !== null && _a !== void 0 ? _a : character; });
    }
    createContext(options) {
        return { grid: this, options };
    }
    isGridOptions(value) {
        return Array.isArray(value.columns) && Array.isArray(value.data);
    }
}
//# sourceMappingURL=dbgrid.js.map