export class dataSource {
    constructor(pMethods) {
        this.baseUrl = '';
        this.methods = [
            {
                'LIST': {
                    httpMethod: 'GET',
                    url: 'http://localhost:3000/api/list'
                }
            }
        ];
        this.setMethods(pMethods);
    }
    getBaseUrl() {
        return this.baseUrl;
    }
    setBaseUrl(pUrl) {
        this.baseUrl = pUrl;
    }
    setMethods(pMethods) {
        this.methods = pMethods;
    }
    getMethods() {
        return this.methods;
    }
}
//# sourceMappingURL=dataSource.js.map