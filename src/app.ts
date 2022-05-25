import { methodsInterface } from "./dataSource";
import { DBGrid } from "./dbgrid";
import { tableRowInterface } from "./table";

const tableRows: tableRowInterface[] = [
    {
        id: 'row1',
        class: 'dbgrid-table',
        style: '',
        cols: [
            {
                id: 'col1',
                class: '',
                style: '',
                innerHtml: 'test 1'
            },
            {
                id: 'col2',
                class: '',
                style: '',
                innerHtml: 'test 2'
            },
            {
                id: 'col3',
                class: '',
                style: '',
                innerHtml: 'test 3'
            }
        ]
    }
];

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


const grid = new DBGrid('#grid', methods);
grid.setBaseUrl('http://api.napr.gov.ge');
grid.render({
    id: 'grid',
    class: 'grid',
    innerHtml: '',
    style: 'width: 100%; height: 100%;',
    rows: tableRows
});