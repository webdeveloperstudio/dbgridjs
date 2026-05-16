import $ from 'jquery';
import { dataSource } from './dataSource';
export class Table extends dataSource {
    constructor(pMethods) {
        super(pMethods);
        this.tableTps = (pData) => `<table id="${pData.id}" class="dbgrid-table ${pData.class}" style="${pData.style}">${pData.innerHtml}</table>`;
        this.rowTps = (pTableData) => `<tr>${pTableData}</tr>`;
        this.columnsTps = (pData) => `<td id="${pData.id}" class="${pData.class}" style="${pData.style}">${pData.innerHtml}</td>`;
    }
    setBaseUrl(pUrl) {
        super.setBaseUrl(pUrl);
    }
    assemble(pTable) {
        const vRows = this.loadRow(pTable.rows);
        const table = {
            id: pTable.id,
            class: pTable.class,
            style: pTable.style,
            innerHtml: vRows,
            rows: pTable.rows
        };
        this.table = this.tableTps(table);
        $(this.table).attr('data-base-url', this.getBaseUrl());
        return this.table;
    }
    loadRow(pData) {
        let vRow = '';
        pData.forEach(row => {
            vRow += this.rowTps(row.cols.map(col => this.columnsTps(col)).join(''));
        });
        return vRow;
    }
    loadColumn(pData) {
        return this.columnsTps(pData);
    }
}
//# sourceMappingURL=table.js.map