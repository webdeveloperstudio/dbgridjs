import $ from 'jquery';
import { Table } from './table';
export class DBGrid extends Table {
    constructor(pEl, pMethods) {
        super(pMethods);
        this.baseElement = $(pEl);
    }
    setBaseUrl(pUrl) {
        super.setBaseUrl(pUrl);
    }
    render(pTable) {
        const vTable = this.assemble(pTable);
        this.baseElement.html(vTable);
    }
}
//# sourceMappingURL=dbgrid.js.map