import $ from 'jquery';
import { dataSource, methodsInterface } from './dataSource';

export interface tableInterface {
    id: string;
    class: string;
    style: string;
    innerHtml: string;
    rows: tableRowInterface[];
}

export interface tableColInterface {
    id: string;
    class: string;
    style: string;
    innerHtml: string;
}

export interface tableRowInterface {
    id: string;
    class: string;
    style: string;
    cols: tableColInterface[];
}

export class Table extends dataSource {
    private table!: string;
    private tableTps = (pData: tableInterface) => `<table id="${pData.id}" class="dbgrid-table ${pData.class}" style="${pData.style}">${pData.innerHtml}</table>`;
    private rowTps = (pTableData: string) => `<tr>${pTableData}</tr>`;
    private columnsTps = (pData: tableColInterface) => `<td id="${pData.id}" class="${pData.class}" style="${pData.style}">${pData.innerHtml}</td>`;
    constructor(pMethods: methodsInterface[]) {
        super(pMethods);
    }

    public setBaseUrl(pUrl: string) {
        super.setBaseUrl(pUrl);
    }

    public assemble(pTable: tableInterface): string {
        const vRows = this.loadRow(pTable.rows);
        const table: tableInterface = {
            id: pTable.id,
            class: pTable.class,
            style: pTable.style,
            innerHtml: vRows,
            rows: pTable.rows
        }
        this.table = this.tableTps(table);
        $(this.table).attr('data-base-url', this.getBaseUrl());
        return this.table;
    }

    private loadRow(pData: tableRowInterface[]): string {
        let vRow = '';
        pData.forEach(row => {
            vRow += this.rowTps(row.cols.map(col => this.columnsTps(col)).join(''));
        });
        return vRow;
    }

    private loadColumn(pData: tableColInterface) {
        return this.columnsTps(pData);
    }
}