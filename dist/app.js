import { DBGrid } from './dbgrid';
const methods = [
    {
        'LIST': {
            httpMethod: 'GET',
            url: '/api/v1/list',
        }
    },
    {
        'ITEM': {
            httpMethod: 'GET',
            url: '/api/v1/{id}'
        }
    },
    {
        'CREATE': {
            httpMethod: 'POST',
            url: '/api/v1/'
        }
    },
    {
        'UPDATE': {
            httpMethod: 'PUT',
            url: '/api/v1/{id}'
        }
    },
    {
        'DELETE': {
            httpMethod: 'DELETE',
            url: '/api/v1/{id}'
        }
    }
];
const gridOptions = {
    id: 'ordersGrid',
    keyField: 'id',
    className: 'grid',
    style: 'width: 100%;',
    columns: [
        { fieldName: 'id', caption: 'ID', width: 70, dataType: 'number', alignment: 'right' },
        { fieldName: 'customer', caption: 'Customer', width: 220 },
        { fieldName: 'status', caption: 'Status', width: 140 },
        { fieldName: 'amount', caption: 'Amount', width: 120, dataType: 'number', alignment: 'right', renderer: value => `$${Number(value !== null && value !== void 0 ? value : 0).toFixed(2)}` },
        { fieldName: 'paid', caption: 'Paid', width: 90, dataType: 'boolean', alignment: 'center' }
    ],
    data: [
        { id: 1001, customer: 'Black Mesa', status: 'Open', amount: 1250.50, paid: false },
        { id: 1002, customer: 'Aperture Labs', status: 'Processing', amount: 835.00, paid: true },
        { id: 1003, customer: 'Wayne Enterprises', status: 'Closed', amount: 4200.25, paid: true },
        { id: 1004, customer: 'Stark Industries', status: 'Open', amount: 980.10, paid: false }
    ],
    appearance: {
        showFilterRow: true,
        stripedRows: true,
        emptyText: 'No orders found'
    },
    behavior: {
        allowSorting: true,
        allowFiltering: true,
        focusedRowEnabled: true,
        multiSelect: true
    },
    paging: {
        enabled: true,
        pageSize: 3,
        showNavigator: true
    },
    editing: {
        allowInsert: true,
        allowUpdate: true,
        allowDelete: true,
        mode: 'inline'
    }
};
const grid = new DBGrid('#grid', methods);
grid.setBaseUrl('http://api.napr.gov.ge');
grid.render(gridOptions);
//# sourceMappingURL=app.js.map