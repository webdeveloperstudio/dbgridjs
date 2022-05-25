import $ from 'jquery';
import { methodsInterface } from './dataSource';
import { Table, tableInterface } from './table';

export class DBGrid extends Table {

    private baseElement: JQuery<HTMLDivElement>;

    constructor(pEl: string, pMethods: methodsInterface[]) {
        super(pMethods);
        this.baseElement = $(pEl);
    }

    public setBaseUrl(pUrl: string) {
        super.setBaseUrl(pUrl);
    }

    public render(pTable: tableInterface) {
        const vTable: string = this.assemble(pTable);
        this.baseElement.html(vTable);
    }
}