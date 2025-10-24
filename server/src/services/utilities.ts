export const formatDataForResponse = (data: any): any => {
    if (data === null || data === undefined) {
        return data;
    }
    
    if (typeof data === 'bigint') {
        return data.toString();
    }
    
    if (Array.isArray(data)) {
        return data.map(item => formatDataForResponse(item));
    }
    
    if (typeof data === 'object') {
        const converted: any = {};
        for (const [key, value] of Object.entries(data)) {
            converted[key] = formatDataForResponse(value);
        }
        return converted;
    }
    
    return data;
}

const convertBigIntToString = (obj: any): any => {
    if (obj === null || obj === undefined) {
        return obj;
    }
    if (typeof obj === 'bigint') {
        return obj.toString();
    }
    if (Array.isArray(obj)) {
        return obj.map(convertBigIntToString);
    }
    if (typeof obj === 'object') {
        const converted: any = {};
        for (const [key, value] of Object.entries(obj)) {
            converted[key] = convertBigIntToString(value);
        }
        return converted;
    }
    return obj;
};