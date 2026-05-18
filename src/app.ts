import { methodsInterface } from './dataSource';
import { DBGrid } from './dbgrid';
import { DBGridOptions } from './types';

const methods: methodsInterface[] = [
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

const gridOptions: DBGridOptions = {
    id: 'ordersGrid',
    keyField: 'id',
    className: 'grid',
    style: 'width: 100%;',
    columns: [
        { fieldName: 'id', caption: 'ID', width: 70, dataType: 'number', alignment: 'right' },
        { fieldName: 'customer', caption: 'Customer', width: 220 },
        { fieldName: 'status', caption: 'Status', width: 140, groupable: true },
        { fieldName: 'amount', caption: 'Amount', width: 120, dataType: 'number', alignment: 'right', summary: 'sum', renderer: value => `$${Number(value ?? 0).toFixed(2)}` },
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
        allowGrouping: true,
        focusedRowEnabled: true,
        multiSelect: true
    },
    paging: {
        enabled: true,
        pageSize: 3,
        showNavigator: true
    },
    grouping: {
        enabled: true,
        showGroupPanel: true,
        descriptors: [{ fieldName: 'status' }]
    },
    navigator: {
        visible: true,
        showNavigation: true,
        showEditing: true,
        showRefresh: true
    },
    editing: {
        allowInsert: true,
        allowUpdate: true,
        allowDelete: true,
        mode: 'inline'
    },
    events: {
        onGroupChanged: event => console.log('Grouping changed', event.grouping),
        onRowInserted: event => console.log('Inserted', event.row),
        onRowUpdated: event => console.log('Updated', event.row),
        onRowDeleted: event => console.log('Deleted', event.row),
        onRefresh: event => console.log('Refresh requested', event.options.data.length)
    }
};

const grid = new DBGrid('#grid', methods);
grid.setBaseUrl('http://api.napr.gov.ge');
grid.render(gridOptions);
