
export interface methodsInterface{
    [key: string]: {
        httpMethod: string;
        url: string;
    };
}

export class dataSource {
    private baseUrl: string = '';
    private methods: methodsInterface[] = [
        {
            'LIST': {
                httpMethod: 'GET',
                url: 'http://localhost:3000/api/list'
            }
        }
    ];

    constructor(pMethods: methodsInterface[]) {
        this.setMethods(pMethods);
    }

    public getBaseUrl(): string {
        return this.baseUrl;
    }

    public setBaseUrl(pUrl: string) {
        this.baseUrl = pUrl;
    }

    public setMethods(pMethods: methodsInterface[]) {
        this.methods = pMethods;
    }

    public getMethods(): methodsInterface[] {
        return this.methods;
    }
}